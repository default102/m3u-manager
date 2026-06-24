'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
import { usePlaylist } from './PlaylistContext';
import { Modal } from '../Modal';

interface EPGUpdateItem {
  id: number;
  name: string;
  currentLogo: string;
  currentTvgId: string;
  recommendedLogo: string;
  recommendedTvgId: string;
  checked: boolean;
}

export function EPGMatchConfirmModal() {
  const {
    epgMatchRecommendations,
    setEpgMatchRecommendations,
    handleApplyEPGMatch,
    isEPGMatching
  } = usePlaylist();

  const [localUpdates, setLocalUpdates] = useState<EPGUpdateItem[]>([]);
  const [allChecked, setAllChecked] = useState(true);

  useEffect(() => {
    if (epgMatchRecommendations) {
      setLocalUpdates(
        epgMatchRecommendations.map(r => ({
          id: r.id,
          name: r.name,
          currentLogo: r.currentLogo,
          currentTvgId: r.currentTvgId,
          recommendedLogo: r.recommendedLogo,
          recommendedTvgId: r.recommendedTvgId,
          checked: true
        }))
      );
      setAllChecked(true);
    }
  }, [epgMatchRecommendations]);

  if (!epgMatchRecommendations) return null;

  const handleRowCheck = (id: number) => {
    setLocalUpdates(prev => {
      const next = prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item));
      setAllChecked(next.every(item => item.checked));
      return next;
    });
  };

  const handleToggleAll = () => {
    const nextChecked = !allChecked;
    setAllChecked(nextChecked);
    setLocalUpdates(prev => prev.map(item => ({ ...item, checked: nextChecked })));
  };

  const handleLogoValueChange = (id: number, value: string) => {
    setLocalUpdates(prev =>
      prev.map(item => (item.id === id ? { ...item, recommendedLogo: value } : item))
    );
  };

  const handleTvgIdValueChange = (id: number, value: string) => {
    setLocalUpdates(prev =>
      prev.map(item => (item.id === id ? { ...item, recommendedTvgId: value } : item))
    );
  };

  const handleConfirm = () => {
    const activeUpdates = localUpdates
      .filter(item => item.checked)
      .map(item => ({
        id: item.id,
        tvgId: item.recommendedTvgId.trim(),
        tvgName: item.name, // 默认使用频道原本的名字作为 EPG tvg-name
        tvgLogo: item.recommendedLogo.trim()
      }));

    if (activeUpdates.length === 0) {
      alert('您未勾选任何修改选项');
      return;
    }

    handleApplyEPGMatch(activeUpdates);
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => setEpgMatchRecommendations(null)}
      title="智能匹配台标与 EPG 确认"
      maxWidth="max-w-4xl"
    >
      <div className="flex flex-col h-[70vh] text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
        
        {/* Info Banner */}
        <div className="px-8 py-3 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100/50 dark:border-indigo-950/50 text-xs text-indigo-700 dark:text-indigo-400 flex items-center gap-2 shrink-0">
          <Sparkles size={14} className="shrink-0" />
          <span>系统已根据频道名称匹配了标准的高清台标和 EPG ID（不影响播放源地址）。您可以在下方预览并修改推荐值。</span>
        </div>

        {/* Comparison Table */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500">
                  <th className="px-4 py-3 text-xs font-bold w-12 text-center">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={handleToggleAll}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase w-1/4">频道名称</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase w-1/3">推荐台标（可修改）</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase">推荐 EPG ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {localUpdates.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleRowCheck(item.id)}
                        className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={item.name}>
                      {item.name}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {/* 台标预览对比 */}
                        <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1.5 rounded-lg w-16 h-10 justify-center">
                          {item.recommendedLogo ? (
                            <img
                              src={item.recommendedLogo}
                              alt="Logo"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <ImageIcon size={16} className="text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                        <input
                          type="text"
                          value={item.recommendedLogo}
                          onChange={e => handleLogoValueChange(item.id, e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-xs text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all font-mono"
                          placeholder="台标图片 URL"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="text"
                        value={item.recommendedTvgId}
                        onChange={e => handleTvgIdValueChange(item.id, e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-xs text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all font-mono"
                        placeholder="EPG ID (如 CCTV1)"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            共匹配 {localUpdates.length} 个项目，已选择 {localUpdates.filter(u => u.checked).length} 个
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => setEpgMatchRecommendations(null)}
              className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-xl transition-all text-sm"
              disabled={isEPGMatching}
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-100/50 dark:shadow-none active:scale-95 text-sm flex items-center gap-1.5"
              disabled={isEPGMatching}
            >
              {isEPGMatching ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : <Check size={16} />}
              <span>保存更新</span>
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
}
