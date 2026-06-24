'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { usePlaylist } from './PlaylistContext';

export function AIGroupConfirmModal() {
  const {
    aiRecommendations,
    setAiRecommendations,
    handleApplyAIGroup,
    orderedGroupNames
  } = usePlaylist();

  const [localUpdates, setLocalUpdates] = useState<{ id: number; name: string; originalGroupTitle: string; groupTitle: string }[]>([]);

  useEffect(() => {
    if (aiRecommendations) {
      setLocalUpdates(
        aiRecommendations.map(r => ({
          id: r.channelId,
          name: r.name || '未知频道',
          originalGroupTitle: r.originalGroupTitle || '未分类',
          groupTitle: r.recommendedGroupTitle || '未分类'
        }))
      );
    }
  }, [aiRecommendations]);

  if (!aiRecommendations) return null;

  const handleGroupValueChange = (id: number, value: string) => {
    setLocalUpdates(prev =>
      prev.map(item => (item.id === id ? { ...item, groupTitle: value } : item))
    );
  };

  const handleConfirm = () => {
    const finalUpdates = localUpdates.map(item => ({
      id: item.id,
      groupTitle: item.groupTitle.trim() || '未分类'
    }));
    handleApplyAIGroup(finalUpdates);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b flex justify-between items-center bg-white shrink-0">
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            AI 智能分组预览与微调
          </h2>
          <button 
            onClick={() => setAiRecommendations(null)} 
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info Tip */}
        <div className="px-8 py-3 bg-purple-50/50 border-b border-purple-50 text-xs text-purple-700 flex items-center gap-2 shrink-0">
          <AlertCircle size={14} className="shrink-0" />
          <span>大模型已根据频道语义推荐分组。您可以在下方直接编辑修改，点击“确认应用”后写入数据库。</span>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">频道名称</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">当前分组</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase w-1/3">推荐分组（可修改）</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {localUpdates.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5 text-sm font-bold text-slate-700 truncate max-w-[200px]" title={item.name}>
                      {item.name}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-400 font-medium">
                      {item.originalGroupTitle}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="relative flex items-center gap-2">
                        <ArrowRight size={14} className="text-slate-300" />
                        <input
                          type="text"
                          value={item.groupTitle}
                          list={`groups-datalist-${item.id}`}
                          onChange={e => handleGroupValueChange(item.id, e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white text-purple-700 transition-all"
                        />
                        {/* Datalist for existing groups recommendation */}
                        <datalist id={`groups-datalist-${item.id}`}>
                          {orderedGroupNames.map(g => (
                            <option key={g} value={g} />
                          ))}
                        </datalist>
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
              onClick={() => setAiRecommendations(null)} 
              className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-200/50 rounded-xl transition-all text-sm"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-purple-100 active:scale-95 text-sm"
            >
              确认应用分组
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
