import { usePlaylist } from './PlaylistContext';
import { ListFilter, Eye, EyeOff, Edit2, Trash2, Search, Copy } from 'lucide-react';

export function EditorHeader({ showSidebar, onToggleSidebar }: { showSidebar: boolean; onToggleSidebar: () => void }) {
  const {
    selectedGroup,
    filteredChannels,
    channelSearch,
    setChannelSearch,
    selectedIds,
    hiddenGroups,
    setSelectedIds,
    handleToggleHideGroup,
    handleRenameGroup,
    handleDeleteGroup,
    setIsDuplicateModalOpen
  } = usePlaylist();

  const isCurrentGroupHidden = hiddenGroups.includes(selectedGroup);

  return (
    <div className="p-4 shadow-md border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 gap-4 relative text-slate-800 dark:text-slate-200 transition-colors">
        <div className="flex items-center gap-4 overflow-hidden flex-1">
          <button onClick={onToggleSidebar} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 shrink-0 transition-colors"><ListFilter size={20} /></button>
          
          <div className="flex flex-col min-w-0">
             <div className="flex items-center gap-2">
               <h2 className="font-black text-slate-800 dark:text-slate-200 text-base md:text-lg truncate">
                   {selectedGroup}
               </h2>
               <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0">{filteredChannels.length} CH</span>
               
               {selectedGroup !== '全部' && (
                   <div className="flex items-center gap-1 ml-2 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl shrink-0">
                      <button 
                        onClick={() => handleToggleHideGroup(selectedGroup)}
                        className={`p-1.5 rounded-lg transition-all ${isCurrentGroupHidden ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-900'}`}
                        title={isCurrentGroupHidden ? "显示此分类" : "在订阅中隐藏此分类"}
                      >
                        {isCurrentGroupHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      
                      {selectedGroup !== '未分类' && (
                        <>
                          <button 
                            onClick={() => handleRenameGroup(selectedGroup)}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                            title="重命名此分类"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteGroup(selectedGroup)}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                            title="删除此分类"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                   </div>
               )}

               {selectedGroup === '全部' && (
                  <></>
               )}
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input 
                    className="w-full pl-9 pr-3 py-2 text-base md:text-xs border border-slate-200 dark:border-slate-700 rounded-xl outline-none bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-700 dark:text-slate-200" 
                    placeholder="搜索频道..." 
                    value={channelSearch} 
                    onChange={e => setChannelSearch(e.target.value)} 
                />
            </div>
            
            <button 
                onClick={() => selectedIds.size === filteredChannels.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(filteredChannels.map(c => c.id)))} 
                className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-4 py-2 rounded-xl transition-all shrink-0 whitespace-nowrap"
            >
                {selectedIds.size === filteredChannels.length && filteredChannels.length > 0 ? '取消全选' : '全选'}
            </button>
        </div>
    </div>
  );
}