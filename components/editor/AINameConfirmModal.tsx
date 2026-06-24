'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { usePlaylist } from './PlaylistContext';

export function AINameConfirmModal() {
  const {
    aiSanitizedNames,
    setAiSanitizedNames,
    handleApplyAISanitize
  } = usePlaylist();

  const [localUpdates, setLocalUpdates] = useState<{ id: number; originalName: string; name: string }[]>([]);

  useEffect(() => {
    if (aiSanitizedNames) {
      setLocalUpdates(
        aiSanitizedNames.map(r => ({
          id: r.channelId,
          originalName: r.originalName || '未知频道',
          name: r.recommendedName || ''
        }))
      );
    }
  }, [aiSanitizedNames]);

  if (!aiSanitizedNames) return null;

  const handleNameValueChange = (id: number, value: string) => {
    setLocalUpdates(prev =>
      prev.map(item => (item.id === id ? { ...item, name: value } : item))
    );
  };

  const handleConfirm = () => {
    const finalUpdates = localUpdates.map(item => ({
      id: item.id,
      name: item.name.trim() || item.originalName
    }));
    handleApplyAISanitize(finalUpdates);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b flex justify-between items-center bg-white shrink-0">
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            AI 命名智能净化与微调
          </h2>
          <button 
            onClick={() => setAiSanitizedNames(null)} 
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info Tip */}
        <div className="px-8 py-3 bg-indigo-50/50 border-b border-indigo-50 text-xs text-indigo-700 flex items-center gap-2 shrink-0">
          <AlertCircle size={14} className="shrink-0" />
          <span>大模型已识别并去除名称中的 [电信]、[IPv6]、画质等冗余噪音。您可以在下方直接编辑微调。</span>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">原始名称</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase w-1/2">推荐净化名（可修改）</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {localUpdates.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5 text-sm font-bold text-slate-500 truncate max-w-[250px]" title={item.originalName}>
                      {item.originalName}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="relative flex items-center gap-2">
                        <ArrowRight size={14} className="text-slate-300" />
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => handleNameValueChange(item.id, e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white text-indigo-700 transition-all"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t bg-slate-50 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-400 font-medium">共 {localUpdates.length} 个待更新频道</span>
          <div className="flex gap-3">
            <button 
              onClick={() => setAiSanitizedNames(null)} 
              className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-200/50 rounded-xl transition-all text-sm"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 active:scale-95 text-sm"
            >
              确认应用名称
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
