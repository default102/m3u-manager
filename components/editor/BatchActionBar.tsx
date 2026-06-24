'use client';

import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

interface Props {
  selectedCount: number;
  allGroups: string[];
  onMove: (targetGroup: string) => void;
  onAIGroup?: () => void;
  onDelete: () => void;
}

export function BatchActionBar({ selectedCount, allGroups, onMove, onAIGroup, onDelete }: Props) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl dark:shadow-slate-950/30 rounded-2xl px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-6 z-40">
      <div className="text-sm font-bold text-slate-600 dark:text-slate-300">已选 {selectedCount} 项</div>
      <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700"></div>

      <div className="relative">
        <button
          onClick={() => setShowMoveMenu(!showMoveMenu)}
          className="flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-colors"
        >
          移动到... <ChevronDown size={14}/>
        </button>

        {showMoveMenu && (
          <div className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 origin-bottom-left">
            <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">选择目标分组</div>
            <div className="max-h-60 overflow-y-auto">
              <button
                onClick={() => { const n = prompt("新分组名称:"); if(n) onMove(n); setShowMoveMenu(false); }}
                className="w-full text-left px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border-b border-dashed border-slate-100 dark:border-slate-700 flex items-center gap-2"
              >
                <Plus size={14}/> 新建分组
              </button>
              {onAIGroup && (
                <button
                  onClick={() => { onAIGroup(); setShowMoveMenu(false); }}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 border-b border-dashed border-slate-100 dark:border-slate-700 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                  智能分组 (AI)
                </button>
              )}
              {allGroups.map(g => (
                <button
                  key={g}
                  onClick={() => { onMove(g); setShowMoveMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200"
                >
                  {g}
                </button>
              ))}
            </div>
            <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-850">
              <button onClick={() => setShowMoveMenu(false)} className="w-full py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">取消</button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onDelete}
        className="flex items-center gap-1.5 text-sm font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-lg transition-colors"
      >
        删除
      </button>
    </div>
  );
}
