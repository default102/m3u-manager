'use client';

import { useState } from 'react';
import { Modal } from './Modal';
import { Copy, Check } from 'lucide-react';
import { getExportUrl } from '@/lib/utils/helpers';
import { useClipboard } from '@/lib/hooks/useClipboard';

interface CustomPrefixModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistId: number;
  playlistName: string;
  baseUrl: string;
}

export function CustomPrefixModal({
  isOpen,
  onClose,
  playlistId,
  playlistName,
  baseUrl,
}: CustomPrefixModalProps) {
  const [prefix, setPrefix] = useState('');
  const { copiedId, copyToClipboard } = useClipboard();

  const handleCopy = () => {
    let exportUrl = getExportUrl(baseUrl, playlistId);
    if (prefix.trim()) {
      exportUrl += `?prefix=${encodeURIComponent(prefix.trim())}`;
    }
    copyToClipboard(exportUrl, playlistId);
  };

  const previewUrl = prefix.trim()
    ? `${getExportUrl(baseUrl, playlistId)}?prefix=${prefix.trim()}`
    : getExportUrl(baseUrl, playlistId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="自定义前缀复制">
      <div className="p-6 space-y-6">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">正在为列表生成地址:</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">{playlistName}</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">自定义前缀</label>
          <input
            className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm focus:bg-white dark:focus:bg-slate-900"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="例如: 1.1.1.1:88"
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 ml-1">
            将替换导出的频道播放地址中的 host 与端口（如 DS920:7089 替换为该前缀）。不影响数据库数据。
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">订阅预览链接</label>
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 px-3 py-3 rounded-2xl max-w-full">
            <code className="text-xs text-slate-500 dark:text-slate-400 break-all font-mono block whitespace-pre-wrap select-all">
              {previewUrl}
            </code>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all text-sm"
          >
            取消
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-blue-200 dark:shadow-blue-950/30 active:scale-95 text-sm"
          >
            {copiedId === playlistId ? (
              <>
                <Check size={16} />
                <span>已复制</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>复制链接</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
