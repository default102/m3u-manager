'use client';

import { usePlaylist } from './PlaylistContext';
import { ListFilter, Eye, EyeOff, Edit2, Trash2 } from 'lucide-react';

export function EditorHeader({ showSidebar, onToggleSidebar }: { showSidebar: boolean; onToggleSidebar: () => void }) {
  const {
    selectedGroup,
    filteredChannels,
    stats,
    selectedIds,
    hiddenGroups,
    setSelectedIds,
    handleToggleHideGroup,
    handleRenameGroup,
    handleDeleteGroup
  } = usePlaylist();

  const isCurrentGroupHidden = hiddenGroups.includes(selectedGroup);

  return (
    <div className="p-4 border-b flex justify-between items-center bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4 overflow-hidden">
          <button onClick={onToggleSidebar} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 shrink-0 transition-colors"><ListFilter size={20} /></button>
          
          <div className="flex flex-col min-w-0">
             <div className="flex items-center gap-2">
               <h2 className="font-black text-slate-800 text-base md:text-lg truncate">
                   {selectedGroup}
               </h2>
               <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0">{filteredChannels.length} CH</span>
               
               {selectedGroup !== '全部' && (
                   <div className="flex items-center gap-1 ml-2 bg-slate-100/50 p-1 rounded-xl shrink-0">
                      <button 
                        onClick={() => handleToggleHideGroup(selectedGroup)}
                        className={`p-1.5 rounded-lg transition-all ${isCurrentGroupHidden ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-400 hover:text-blue-600 hover:bg-white'}`}
                        title={isCurrentGroupHidden ? "显示此分类" : "在订阅中隐藏此分类"}
                      >
                        {isCurrentGroupHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      
                      {selectedGroup !== '未分类' && (
                        <>
                          <button 
                            onClick={() => handleRenameGroup(selectedGroup)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                            title="重命名此分类"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteGroup(selectedGroup)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                            title="删除此分类"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                   </div>
               )}
             </div>
             
             {/* Global Stats Integrated in Header - Removed */}
          </div>
        </div>
        
        <button 
            onClick={() => selectedIds.size === filteredChannels.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(filteredChannels.map(c => c.id)))} 
            className="text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all shrink-0 ml-4"
        >
            {selectedIds.size === filteredChannels.length && filteredChannels.length > 0 ? '取消全选' : '全选'}
        </button>
    </div>
  );
}
