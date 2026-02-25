'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Channel } from '@/types';

interface ChannelFormProps {
  initialData?: Partial<Channel>;
  allGroups: string[];
  allChannelNames?: string[];
  onSubmit: (data: Omit<Channel, 'id' | 'playlistId' | 'order' | 'createdAt' | 'updatedAt' | 'duration'>) => void;
  onCancel: () => void;
  submitLabel: string;
}

/**
 * 从频道 URL 列表中提取常用的 URL 前缀（协议 + 主机 + 端口 + 基础路径）
 * 例如：["http://192.168.1.1:8080/live/ch1", "http://192.168.1.1:8080/live/ch2"]
 *      => ["http://192.168.1.1:8080/live/"]
 */
function extractUrlPrefixes(urls: string[]): string[] {
  const prefixCount: Record<string, number> = {};

  for (const url of urls) {
    if (!url || !url.includes('://')) continue;
    try {
      const parsed = new URL(url);
      // 取 origin（协议+主机+端口）
      const origin = parsed.origin; // e.g. "http://192.168.1.1:8080"
      // 取 pathname 的各级路径段，逐层统计
      const segments = parsed.pathname.split('/').filter(Boolean);

      // 始终统计 origin/
      const originPrefix = origin + '/';
      prefixCount[originPrefix] = (prefixCount[originPrefix] || 0) + 1;

      // 再统计带第一段路径的前缀（常见的 /live/、/hls/ 等）
      if (segments.length > 0) {
        const firstSegPrefix = origin + '/' + segments[0] + '/';
        prefixCount[firstSegPrefix] = (prefixCount[firstSegPrefix] || 0) + 1;
      }
    } catch {
      // 无法解析的 URL（如 rtsp 不被所有浏览器支持），改用简单字符串分割
      const slashIdx = url.indexOf('/', url.indexOf('://') + 3);
      if (slashIdx !== -1) {
        const base = url.substring(0, slashIdx + 1);
        prefixCount[base] = (prefixCount[base] || 0) + 1;
      }
    }
  }

  // 按出现次数降序，只展示出现 ≥1 次的前缀
  return Object.entries(prefixCount)
    .filter(([, count]) => count >= 1)
    .sort((a, b) => b[1] - a[1])
    .map(([prefix]) => prefix)
    .slice(0, 8); // 最多显示 8 个
}

export function ChannelForm({ initialData, allGroups, allChannelNames = [], onSubmit, onCancel, submitLabel }: ChannelFormProps) {
  const [group, setGroup] = useState(initialData?.groupTitle || '');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [urlValue, setUrlValue] = useState(initialData?.url || '');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const urlRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowGroupDropdown(false);
        setIsTyping(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredGroups = isTyping
    ? allGroups.filter(g => g.toLowerCase().includes(group.toLowerCase()))
    : allGroups;

  // 从现有频道 URL 提取前缀建议
  const urlPrefixes = extractUrlPrefixes(allChannelNames);
  // 根据当前已输入内容过滤：只展示不以当前内容开头的（避免重复）
  const filteredUrlPrefixes = urlValue
    ? urlPrefixes.filter(p => p.startsWith(urlValue) && p !== urlValue)
    : urlPrefixes;

  const handleUrlPrefixClick = (prefix: string) => {
    setUrlValue(prefix);
    urlRef.current?.focus();
    // 光标移到末尾
    setTimeout(() => {
      const ta = urlRef.current;
      if (ta) {
        ta.setSelectionRange(prefix.length, prefix.length);
      }
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    onSubmit({
      name: formData.get('name') as string,
      groupTitle: group,
      tvgId: formData.get('tvgId') as string,
      tvgName: formData.get('tvgName') as string,
      tvgLogo: formData.get('tvgLogo') as string,
      url: urlValue,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">频道名称</label>
          <input
            name="name"
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm focus:bg-white"
            placeholder="例如: CCTV-1"
            defaultValue={initialData?.name}
            required
          />
        </div>

        <div className="space-y-2 relative" ref={dropdownRef}>
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">所属分组</label>
          <div className="relative">
            <input
              type="text"
              value={group}
              onChange={(e) => {
                setGroup(e.target.value);
                setShowGroupDropdown(true);
                setIsTyping(true);
              }}
              onFocus={() => setShowGroupDropdown(true)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm focus:bg-white pr-10"
              placeholder="输入或选择分组"
            />
            <div
              className="absolute right-3 top-3.5 text-slate-400 cursor-pointer hover:text-blue-500"
              onClick={() => {
                setShowGroupDropdown(!showGroupDropdown);
                setIsTyping(false);
              }}
            >
              <ChevronDown size={20} className={`transition-transform duration-200 ${showGroupDropdown ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {showGroupDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-10 custom-scrollbar p-1">
              {filteredGroups.length > 0 ? (
                filteredGroups.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setGroup(g);
                      setShowGroupDropdown(false);
                      setIsTyping(false);
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 font-medium text-sm transition-colors flex items-center justify-between group"
                  >
                    <span>{g}</span>
                    {group === g && <Check size={16} className="text-blue-600" />}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-slate-400 text-center">
                  无匹配分组，将创建新分组
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">TVG-ID (EPG ID)</label>
          <input name="tvgId" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs text-slate-600 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm focus:bg-white" placeholder="例如: CCTV1" defaultValue={initialData?.tvgId || ''} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">TVG-Name (内部名称)</label>
          <input name="tvgName" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs text-slate-600 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm focus:bg-white" placeholder="EPG 匹配名称 (选填)" defaultValue={initialData?.tvgName || ''} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Logo 地址</label>
        <input name="tvgLogo" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs text-slate-600 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm focus:bg-white" placeholder="http://example.com/logo.png" defaultValue={initialData?.tvgLogo || ''} />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase ml-1">直播源 (URL)</label>

        {/* URL 前缀建议 */}
        {filteredUrlPrefixes.length > 0 && (
          <div className="relative">
            <div className="flex flex-col gap-1">
              {filteredUrlPrefixes.map((prefix) => {
                // 拆分：协议头 + 主机部分 + 路径部分
                const protocolEnd = prefix.indexOf('://');
                const protocol = protocolEnd !== -1 ? prefix.slice(0, protocolEnd + 3) : '';
                const rest = prefix.slice(protocol.length);
                return (
                  <button
                    key={prefix}
                    type="button"
                    onClick={() => handleUrlPrefixClick(prefix)}
                    className="group flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 transition-all text-left"
                  >
                    {protocol && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-500 text-[10px] font-bold uppercase tracking-wider">
                        {protocol.replace('://', '')}
                      </span>
                    )}
                    <span className="font-mono text-xs text-slate-500 group-hover:text-slate-800 transition-colors break-all leading-relaxed">
                      {rest}
                    </span>
                    <span className="shrink-0 ml-auto text-[10px] text-slate-300 group-hover:text-violet-400 font-medium transition-colors whitespace-nowrap">
                      填入 →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <textarea
          ref={urlRef}
          name="url"
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-mono text-xs h-28 resize-none text-slate-600 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm focus:bg-white"
          required
          placeholder="http://example.com/stream.m3u8"
        />
      </div>

      <div className="pt-4 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all text-sm">取消</button>
        <button type="submit" className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 text-sm">{submitLabel}</button>
      </div>
    </form>
  );
}
