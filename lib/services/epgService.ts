/**
 * EPG & Logo Matching Service
 * Contains mapping dictionaries and matching helper logic for Chinese TV channels.
 */

// 基础的公共高清图标库前缀（FanMingMing TV Logo CDN，包含所有标准 CCTV 与卫视的台标）
const LOGO_BASE_URL = 'https://live.fanmingming.com/tv';

interface EPGInfo {
  tvgId: string;
  tvgName: string;
  tvgLogo: string;
}

// 标准电视台字典
const STATIONS_DICTIONARY: { [key: string]: { id: string; name: string; logoFile: string } } = {
  // 央视 CCTV 系列
  'CCTV1': { id: 'CCTV1', name: 'CCTV-1 综合', logoFile: 'CCTV1.png' },
  'CCTV2': { id: 'CCTV2', name: 'CCTV-2 财经', logoFile: 'CCTV2.png' },
  'CCTV3': { id: 'CCTV3', name: 'CCTV-3 综艺', logoFile: 'CCTV3.png' },
  'CCTV4': { id: 'CCTV4', name: 'CCTV-4 中文国际', logoFile: 'CCTV4.png' },
  'CCTV5': { id: 'CCTV5', name: 'CCTV-5 体育', logoFile: 'CCTV5.png' },
  'CCTV5+': { id: 'CCTV5+', name: 'CCTV-5+ 体育赛事', logoFile: 'CCTV5Plus.png' },
  'CCTV6': { id: 'CCTV6', name: 'CCTV-6 电影', logoFile: 'CCTV6.png' },
  'CCTV7': { id: 'CCTV7', name: 'CCTV-7 国防军事', logoFile: 'CCTV7.png' },
  'CCTV8': { id: 'CCTV8', name: 'CCTV-8 电视剧', logoFile: 'CCTV8.png' },
  'CCTV9': { id: 'CCTV9', name: 'CCTV-9 纪录', logoFile: 'CCTV9.png' },
  'CCTV10': { id: 'CCTV10', name: 'CCTV-10 科教', logoFile: 'CCTV10.png' },
  'CCTV11': { id: 'CCTV11', name: 'CCTV-11 戏曲', logoFile: 'CCTV11.png' },
  'CCTV12': { id: 'CCTV12', name: 'CCTV-12 社会与法', logoFile: 'CCTV12.png' },
  'CCTV13': { id: 'CCTV13', name: 'CCTV-13 新闻', logoFile: 'CCTV13.png' },
  'CCTV14': { id: 'CCTV14', name: 'CCTV-14 少儿', logoFile: 'CCTV14.png' },
  'CCTV15': { id: 'CCTV15', name: 'CCTV-15 音乐', logoFile: 'CCTV15.png' },
  'CCTV16': { id: 'CCTV16', name: 'CCTV-16 奥林匹克', logoFile: 'CCTV16.png' },
  'CCTV17': { id: 'CCTV17', name: 'CCTV-17 农业农村', logoFile: 'CCTV17.png' },
  'CCTV4K': { id: 'CCTV4K', name: 'CCTV-4K 超高清', logoFile: 'CCTV4K.png' },
  'CCTV8K': { id: 'CCTV8K', name: 'CCTV-8K 超高清', logoFile: 'CCTV8K.png' },

  // 各省卫视系列
  '湖南卫视': { id: '湖南卫视', name: '湖南卫视', logoFile: '湖南卫视.png' },
  '浙江卫视': { id: '浙江卫视', name: '浙江卫视', logoFile: '浙江卫视.png' },
  '东方卫视': { id: '东方卫视', name: '东方卫视', logoFile: '东方卫视.png' },
  '江苏卫视': { id: '江苏卫视', name: '江苏卫视', logoFile: '江苏卫视.png' },
  '北京卫视': { id: '北京卫视', name: '北京卫视', logoFile: '北京卫视.png' },
  '广东卫视': { id: '广东卫视', name: '广东卫视', logoFile: '广东卫视.png' },
  '深圳卫视': { id: '深圳卫视', name: '深圳卫视', logoFile: '深圳卫视.png' },
  '安徽卫视': { id: '安徽卫视', name: '安徽卫视', logoFile: '安徽卫视.png' },
  '山东卫视': { id: '山东卫视', name: '山东卫视', logoFile: '山东卫视.png' },
  '天津卫视': { id: '天津卫视', name: '天津卫视', logoFile: '天津卫视.png' },
  '重庆卫视': { id: '重庆卫视', name: '重庆卫视', logoFile: '重庆卫视.png' },
  '湖北卫视': { id: '湖北卫视', name: '湖北卫视', logoFile: '湖北卫视.png' },
  '河南卫视': { id: '河南卫视', name: '河南卫视', logoFile: '河南卫视.png' },
  '四川卫视': { id: '四川卫视', name: '四川卫视', logoFile: '四川卫视.png' },
  '黑龙江卫视': { id: '黑龙江卫视', name: '黑龙江卫视', logoFile: '黑龙江卫视.png' },
  '江西卫视': { id: '江西卫视', name: '江西卫视', logoFile: '江西卫视.png' },
  '辽宁卫视': { id: '辽宁卫视', name: '辽宁卫视', logoFile: '辽宁卫视.png' },
  '吉林卫视': { id: '吉林卫视', name: '吉林卫视', logoFile: '吉林卫视.png' },
  '贵州卫视': { id: '贵州卫视', name: '贵州卫视', logoFile: '贵州卫视.png' },
  '福建东南卫视': { id: '东南卫视', name: '东南卫视', logoFile: '东南卫视.png' },
  '东南卫视': { id: '东南卫视', name: '东南卫视', logoFile: '东南卫视.png' },
  '山西卫视': { id: '山西卫视', name: '山西卫视', logoFile: '山西卫视.png' },
  '陕西卫视': { id: '陕西卫视', name: '陕西卫视', logoFile: '陕西卫视.png' },
  '河北卫视': { id: '河北卫视', name: '河北卫视', logoFile: '河北卫视.png' },
  '云南卫视': { id: '云南卫视', name: '云南卫视', logoFile: '云南卫视.png' },
  '甘肃卫视': { id: '甘肃卫视', name: '甘肃卫视', logoFile: '甘肃卫视.png' },
  '宁夏卫视': { id: '宁夏卫视', name: '宁夏卫视', logoFile: '宁夏卫视.png' },
  '青海卫视': { id: '青海卫视', name: '青海卫视', logoFile: '青海卫视.png' },
  '内蒙古卫视': { id: '内蒙古卫视', name: '内蒙古卫视', logoFile: '内蒙古卫视.png' },
  '新疆卫视': { id: '新疆卫视', name: '新疆卫视', logoFile: '新疆卫视.png' },
  '西藏卫视': { id: '西藏卫视', name: '西藏卫视', logoFile: '西藏卫视.png' },
  '海南卫视': { id: '海南卫视', name: '海南卫视', logoFile: '海南卫视.png' },
  '三沙卫视': { id: '三沙卫视', name: '三沙卫视', logoFile: '三沙卫视.png' },
  '厦门卫视': { id: '厦门卫视', name: '厦门卫视', logoFile: '厦门卫视.png' },
};

/**
 * 格式化频道名，便于模糊匹配
 */
function normalizeName(name: string): string {
  if (!name) return '';
  return name
    .toUpperCase()
    // 去除中英文括号及括号内的修饰词 (如: [电信]、(1080P)、[IPV6])
    .replace(/[\[\(\uff08\u3010][^\]\)\uff09\u3011]*[\]\)\uff09\u3011]/g, '')
    // 替换减号、加号、下划线、空格等分隔符
    .replace(/[-_+_\s]/g, '')
    // 去除常见修饰词
    .replace(/(HD|FHD|UHD|超高清|高清|高画质|1080P|720P|60帧|4K|8K|频道|综合频道|电影台|体育台)/g, '')
    .trim();
}

/**
 * 智能匹配频道台标和 EPG
 * @param channelName 频道的原始名称
 * @returns 匹配结果，未匹配到返回 null
 */
export function matchLogoAndEPG(channelName: string): EPGInfo | null {
  const norm = normalizeName(channelName);
  if (!norm) return null;

  // 1. 特例匹配 CCTV 5+
  if (norm.includes('CCTV5+') || norm.includes('CCTV5PLUS')) {
    const info = STATIONS_DICTIONARY['CCTV5+'];
    return {
      tvgId: info.id,
      tvgName: info.name,
      tvgLogo: `${LOGO_BASE_URL}/${info.logoFile}`
    };
  }

  // 2. 匹配 CCTV1 ~ CCTV17 以及 CCTV4K / CCTV8K
  const cctvMatch = norm.match(/CCTV(\d+|4K|8K)/i);
  if (cctvMatch) {
    const key = `CCTV${cctvMatch[1].toUpperCase()}`;
    const info = STATIONS_DICTIONARY[key];
    if (info) {
      return {
        tvgId: info.id,
        tvgName: info.name,
        tvgLogo: `${LOGO_BASE_URL}/${info.logoFile}`
      };
    }
  }

  // 3. 直接包含性匹配字典 (如 "湖南卫视" -> "湖南卫视")
  for (const dictKey in STATIONS_DICTIONARY) {
    if (norm.includes(dictKey) || dictKey.includes(norm)) {
      const info = STATIONS_DICTIONARY[dictKey];
      return {
        tvgId: info.id,
        tvgName: info.name,
        tvgLogo: `${LOGO_BASE_URL}/${info.logoFile}`
      };
    }
  }

  // 4. 正则匹配各省市卫视 (如 "湖南HD" -> "湖南卫视")
  const provinceMatch = norm.match(/(湖南|浙江|东方|江苏|北京|广东|深圳|安徽|山东|天津|重庆|湖北|河南|四川|黑龙江|江西|辽宁|吉林|贵州|山西|陕西|河北|云南|甘肃|宁夏|青海|内蒙古|新疆|西藏|海南|三沙|厦门)/);
  if (provinceMatch) {
    const key = `${provinceMatch[1]}卫视`;
    const info = STATIONS_DICTIONARY[key];
    if (info) {
      return {
        tvgId: info.id,
        tvgName: info.name,
        tvgLogo: `${LOGO_BASE_URL}/${info.logoFile}`
      };
    }
  }

  return null;
}
