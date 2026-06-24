export interface AIGroupResponse {
  channelId: number;
  groupTitle: string;
}

export async function guessChannelGroups(channels: { id: number; name: string }[]): Promise<AIGroupResponse[]> {
  const baseUrl = process.env.OPENAI_API_BASE_URL;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  if (!baseUrl || !apiKey || !model) {
    throw new Error('AI configuration is missing. Please check your .env file.');
  }

  // We ask the LLM to output a JSON array directly.
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

  const userContent = JSON.stringify(channels.map(c => ({ id: c.id, name: c.name })));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response;
  try {
    const endpoint = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        stream: true,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        chat_template_kwargs: {
          enable_thinking: false
        }
      }),
      signal: controller.signal
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
        if (!trimmed) continue;
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            content += delta;
          } catch (e) {
            // Ignore parse errors for partial or malformed lines
          }
        }
      }
    }
  }

  // Handle remaining buffer if any
  if (buffer.trim()) {
    const trimmed = buffer.trim();
    if (trimmed.startsWith('data: ')) {
      const dataStr = trimmed.slice(6);
      if (dataStr !== '[DONE]') {
        try {
          const parsed = JSON.parse(dataStr);
          content += parsed.choices?.[0]?.delta?.content || '';
        } catch (e) {}
      }
    }
  }

  if (!content) {
    throw new Error('No content returned from AI model.');
  }

  try {
    // Some models might wrap JSON in markdown blocks
    const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    // Sometimes the model might wrap the array in an object like {"result": [...]}
    const parsed = JSON.parse(cleanedContent);
    
    if (parsed.groups && Array.isArray(parsed.groups)) {
      return parsed.groups;
    } else if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed.result && Array.isArray(parsed.result)) {
      return parsed.result;
    } else {
      // Find the first array in the values if any
      const arrayVal = Object.values(parsed).find(Array.isArray);
      if (arrayVal) return arrayVal as AIGroupResponse[];
      
      throw new Error('Returned JSON does not contain a groups array.');
    }
  } catch (error: any) {
    throw new Error(`Failed to parse AI response: ${error.message}. Raw response: ${content}`);
  }
}

export interface AISanitizeResponse {
  channelId: number;
  name: string;
}

export async function sanitizeChannelNames(channels: { id: number; name: string }[]): Promise<AISanitizeResponse[]> {
  const baseUrl = process.env.OPENAI_API_BASE_URL;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  if (!baseUrl || !apiKey || !model) {
    throw new Error('AI configuration is missing. Please check your .env file.');
  }

  const systemPrompt = `你是一个专业的 IPTV 频道名称净化与标准化助手。
我会提供给你一组频道（包含 ID 和原始名称），你需要将频道的名称进行“去噪”和“标准化”处理。
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

  const userContent = JSON.stringify(channels.map(c => ({ id: c.id, name: c.name })));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response;
  try {
    const endpoint = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        stream: true,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        chat_template_kwargs: {
          enable_thinking: false
        }
      }),
      signal: controller.signal
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
        if (!trimmed) continue;
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            content += delta;
          } catch (e) {
            // Ignore parse errors for partial or malformed lines
          }
        }
      }
    }
  }

  // Handle remaining buffer if any
  if (buffer.trim()) {
    const trimmed = buffer.trim();
    if (trimmed.startsWith('data: ')) {
      const dataStr = trimmed.slice(6);
      if (dataStr !== '[DONE]') {
        try {
          const parsed = JSON.parse(dataStr);
          content += parsed.choices?.[0]?.delta?.content || '';
        } catch (e) {}
      }
    }
  }

  if (!content) {
    throw new Error('No content returned from AI model.');
  }

  try {
    const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedContent);
    
    if (parsed.channels && Array.isArray(parsed.channels)) {
      return parsed.channels;
    } else if (Array.isArray(parsed)) {
      return parsed;
    } else {
      const arrayVal = Object.values(parsed).find(Array.isArray);
      if (arrayVal) return arrayVal as AISanitizeResponse[];
      throw new Error('Returned JSON does not contain a channels array.');
    }
  } catch (error: any) {
    throw new Error(`Failed to parse AI response: ${error.message}. Raw response: ${content}`);
  }
}
