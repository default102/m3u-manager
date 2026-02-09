'use client';

import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

interface Props {
  selectedCount: number;
  allGroups: string[];
  onMove: (targetGroup: string) => void;
  onDelete: () => void;
}

export function BatchActionBar({ selectedCount, allGroups, onMove, onDelete }: Props) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-6 z-40 text-black">
      <div className="text-sm font-bold text-slate-600">已选 {selectedCount} 项</div>
      <div className="h-4 w-[1px] bg-slate-200"></div>
      
      <div className="relative">
        <button 
          onClick={() => setShowMoveMenu(!showMoveMenu)} 
          className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          移动到... <ChevronDown size={14}/>
        </button>

        {showMoveMenu && (
          <div className="absolute bottom-full mb-2 left-0 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 origin-bottom-left text-black">
            <div className="p-3 border-b bg-slate-50 text-xs font-bold text-slate-400 uppercase">选择目标分组</div>
            <div className="max-h-60 overflow-y-auto">
              <button 
                onClick={() => { const n = prompt("新分组名称:"); if(n) onMove(n); setShowMoveMenu(false); }} 
                className="w-full text-left px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 border-b border-dashed flex items-center gap-2"
              >
                <Plus size={14}/> 新建分组
              </button>
              {allGroups.map(g => (
                <button 
                  key={g} 
                  onClick={() => { onMove(g); setShowMoveMenu(false); }} 
                  className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 text-slate-700"
                >
                  {g}
                </button>
              ))}
            </div>
            <div className="p-2 border-t bg-slate-50">
              <button onClick={() => setShowMoveMenu(false)} className="w-full py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded">取消</button>
            </div>
          </div>
        )}
      </div>

      <button 
        onClick={onDelete} 
        className="flex items-center gap-1.5 text-sm font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
      >
        删除
      </button>
    </div>
  );
}
