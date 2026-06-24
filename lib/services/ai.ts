export interface AIGroupResponse {
  channelId: number;
  groupTitle: string;
}

export interface AISanitizeResponse {
  channelId: number;
  name: string;
}

export interface AIEPGResponse {
  channelId: number;
  tvgId: string;
  tvgName: string;
  tvgLogo: string;
}

interface AIStreamOptions {
  systemPrompt: string;
  userContent: string;
}

// ============================================================
// 公共函数：调用 AI API 并读取 SSE 流式响应
// ============================================================
async function callAIStream(options: AIStreamOptions): Promise<string> {
  const baseUrl = process.env.OPENAI_API_BASE_URL;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  if (!baseUrl || !apiKey || !model) {
    throw new Error('AI configuration is missing. Please check your .env file.');
  }

  const endpoint = baseUrl.endsWith('/')
    ? `${baseUrl}chat/completions`
    : `${baseUrl}/chat/completions`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: options.userContent },
        ],
        stream: true,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        chat_template_kwargs: { enable_thinking: false },
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI API Error (${response.status}): ${text}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body returned from AI model.');
  }

  const content = await readSSEStream(reader);

  if (!content) {
    throw new Error('No content returned from AI model.');
  }

  return content;
}

// ============================================================
// 公共函数：读取 SSE 流，拼接完整的响应内容
// ============================================================
async function readSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<string> {
  const decoder = new TextDecoder('utf-8');
  let content = '';
  let done = false;
  let buffer = '';

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (value) {
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const dataStr = trimmed.slice(6);
        if (dataStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(dataStr);
          content += parsed.choices?.[0]?.delta?.content || '';
        } catch {
          // Ignore parse errors for partial lines
        }
      }
    }
  }

  // Handle remaining buffer
  if (buffer.trim()) {
    const trimmed = buffer.trim();
    if (trimmed.startsWith('data: ') && trimmed.slice(6) !== '[DONE]') {
      try {
        const parsed = JSON.parse(trimmed.slice(6));
        content += parsed.choices?.[0]?.delta?.content || '';
      } catch {
        // Ignore
      }
    }
  }

  return content;
}

// ============================================================
// 公共函数：从 AI 响应中解析 JSON 并提取数组
// ============================================================
function parseAIResponse<T>(
  rawContent: string,
  expectedKey?: string,
): T[] {
  const cleaned = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse AI response. Raw: ${rawContent}`);
  }

  // Case 1: direct array
  if (Array.isArray(parsed)) {
    return parsed as T[];
  }

  // Case 2: object with expected key
  if (expectedKey && typeof parsed === 'object' && parsed !== null) {
    const obj = parsed as Record<string, unknown>;
    if (obj[expectedKey] && Array.isArray(obj[expectedKey])) {
      return obj[expectedKey] as T[];
    }
    // Case 3: find first array in object values
    const arrayVal = Object.values(obj).find(Array.isArray);
    if (arrayVal) return arrayVal as T[];
  }

  throw new Error(`Returned JSON does not contain the expected array.`);
}

// ============================================================
// AI 智能分组
// ============================================================
export async function guessChannelGroups(
  channels: { id: number; name: string }[],
): Promise<AIGroupResponse[]> {
  const systemPrompt = `你是一个专业的 IPTV 频道分类助手。
我会提供给你一组频道（包含 ID 和名称），你需要根据频道的名称将其归类到一个合适的组（如：央视, 卫视, 地方台, 港澳台, 电影, 体育, 纪录, 新闻, 少儿, 音乐, 综合 等）。
要求：
1. 组名尽量简短且标准。
2. 必须返回合法的 JSON 格式。
3. 根节点必须是一个包含 groups 数组的对象，数组的每个元素包含 channelId 和 groupTitle。
例如：
输入：
[{"id":1, "name":"CCTV-1 综合"}, {"id":2, "name":"湖南卫视"}]
输出：
{"groups": [{"channelId":1, "groupTitle":"央视"}, {"channelId":2, "groupTitle":"卫视"}]}
`;

  const content = await callAIStream({
    systemPrompt,
    userContent: JSON.stringify(channels.map(c => ({ id: c.id, name: c.name }))),
  });

  return parseAIResponse<AIGroupResponse>(content, 'groups');
}

// ============================================================
// AI 名称净化
// ============================================================
export async function sanitizeChannelNames(
  channels: { id: number; name: string }[],
): Promise<AISanitizeResponse[]> {
  const systemPrompt = `你是一个专业的 IPTV 频道名称净化与标准化助手。
我会提供给你一组频道（包含 ID 和原始名称），你需要将频道的名称进行"去噪"和"标准化"处理。
净化规则：
1. 移除网络标识前缀或后缀。例如："[电信]", "(IPV6)", "[IPv4/v6]", "5G", "[联通]" 等。
2. 移除画质、帧率、音效标签。例如："1080P", "4K", "8K", "FHD", "HD", "高画质", "高清", "蓝光", "60帧", "5.1" 等。
3. 保持频道的主体核心名称，并进行统一的书写规范。例如：
   - "CCTV-1 综合频道" -> "CCTV-1"
   - "CCTV5 体育 [1080P]" -> "CCTV-5"
   - "湖南卫视 HD" -> "湖南卫视"
   - "HBO HD 电影" -> "HBO"
4. 必须返回合法的 JSON 格式。
5. 根节点必须是一个包含 channels 数组的对象，每个元素包含 channelId 和 name (净化后的标准名称)。
例如：
输入：
[{"id":1, "name":"[电信] CCTV1 高清"}, {"id":2, "name":"湖南卫视-1080P"}]
输出：
{"channels": [{"channelId":1, "name":"CCTV-1"}, {"channelId":2, "name":"湖南卫视"}]}
`;

  const content = await callAIStream({
    systemPrompt,
    userContent: JSON.stringify(channels.map(c => ({ id: c.id, name: c.name }))),
  });

  return parseAIResponse<AISanitizeResponse>(content, 'channels');
}

// ============================================================
// AI EPG 匹配（保留接口，API 路由暂未启用）
// ============================================================
export async function guessChannelEPG(
  channels: { id: number; name: string }[],
): Promise<AIEPGResponse[]> {
  const systemPrompt = `你是一个专业的 IPTV 频道台标与 EPG (电子节目单) 匹配助手。
我会提供给你一组频道（包含 ID 和名称），你需要帮我识别出这些频道对应的标准 EPG ID、标准台标 URL 和标准频道简称。
规则要求：
1. 分析频道名称，去掉噪音（如 [电信]、[IPv6]、高清、超高清等），识别出具体的频道简称。
2. 推荐的标准台标 URL 应使用稳定高质量的公共图片地址，你必须使用以下模板前缀（FanMingMing 台标 CDN）并拼接对应的文件名：
   模板格式为：https://live.fanmingming.com/tv/台标文件名.png
   例如：
   - CCTV-1 综合频道 -> EPG ID 为 "CCTV1"，简称为 "CCTV-1 综合"，台标文件名为 "CCTV1.png"，完整台标 URL 为 "https://live.fanmingming.com/tv/CCTV1.png"
   - 湖南卫视高清 -> EPG ID 为 "湖南卫视"，简称为 "湖南卫视"，台标文件名为 "湖南卫视.png"，完整台标 URL 为 "https://live.fanmingming.com/tv/湖南卫视.png"
   - HBO 电影台 -> EPG ID 为 "HBO"，简称为 "HBO"，台标为 "https://live.fanmingming.com/tv/HBO.png" （如果台标库没有，可以使用你认为合法的第三方台标图片 URL，或保持原样）。
3. 必须返回合法的 JSON 格式。
4. 根节点必须是一个包含 items 数组的对象，数组的每个元素包含 channelId, tvgId, tvgName, tvgLogo。
例如：
输入：
[{"id":1, "name":"CCTV-1 综合 [电信]"}, {"id":2, "name":"湖南卫视HD (IPV6)"}]
输出：
{"items": [
  {"channelId":1, "tvgId":"CCTV1", "tvgName":"CCTV-1 综合", "tvgLogo":"https://live.fanmingming.com/tv/CCTV1.png"},
  {"channelId":2, "tvgId":"湖南卫视", "tvgName":"湖南卫视", "tvgLogo":"https://live.fanmingming.com/tv/湖南卫视.png"}
]}
`;

  const content = await callAIStream({
    systemPrompt,
    userContent: JSON.stringify(channels.map(c => ({ id: c.id, name: c.name }))),
  });

  return parseAIResponse<AIEPGResponse>(content, 'items');
}
