'use client';

import { usePlaylist } from './PlaylistContext';
import { Search, Plus, Settings2, EyeOff, X } from 'lucide-react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableGroupItem } from './SortableGroupItem';

export function CategorySidebar({ onSelect }: { onSelect?: () => void }) {
  const {
    channels,
    sortableGroups,
    hiddenGroups,
    selectedGroup,
    isSortingGroups,
    groupSearch,
    setGroupSearch,
    setSelectedGroup,
    setIsSortingGroups,
    handleCreateGroup,
    handleReorderGroups,
    handleDeleteGroup,
    handleRenameGroup,
    handleToggleHideGroup
  } = usePlaylist();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleGroupClick = (group: string) => {
    setSelectedGroup(group);
    if (window.innerWidth < 768 && onSelect) {
      onSelect();
    }
  };

  return (
    <div className={`w-full md:w-80 bg-slate-50/50 dark:bg-slate-900/20 border-r border-slate-100 dark:border-slate-800 shadow-[4px_0_24px_rgba(0,0,0,0.04)] dark:shadow-none z-20 flex flex-col shrink-0 transition-all duration-300 overflow-hidden`}>
         <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <button 
                      onClick={onSelect} 
                      className="md:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">节目分组</h3>
                </div>
                <div className="flex gap-1">
                    <button onClick={handleCreateGroup} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 transition-colors" title="新建分组"><Plus size={16}/></button>
                    <button onClick={() => setIsSortingGroups(!isSortingGroups)} className={`p-1.5 rounded-lg transition-all ${isSortingGroups ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'}`} title="管理分组"><Settings2 size={16}/></button>
                </div>
            </div>
            <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
                <input className="w-full pl-9 pr-3 py-2 text-base md:text-sm border border-slate-200 dark:border-slate-700 rounded-xl outline-none bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-700 dark:text-slate-200" placeholder="搜索分组..." value={groupSearch} onChange={e => setGroupSearch(e.target.value)} />
            </div>
         </div>
         
         <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
            <div className="px-3 mb-1">
                <button 
                  onClick={() => handleGroupClick('全部')}
                  disabled={isSortingGroups}
                  className={`w-full text-left px-4 py-3 text-sm font-semibold transition-all rounded-xl ${selectedGroup === '全部' ? 'bg-blue-600 text-white shadow-lg dark:shadow-none' : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'} ${isSortingGroups ? 'opacity-30 cursor-not-allowed' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span>全部频道</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${selectedGroup === '全部' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                        {channels.length}
                      </span>
                    </div>
                </button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => {
                if (e.over && e.active.id !== e.over.id) {
                    handleReorderGroups(e.active.id as string, e.over.id as string);
                }
            }}>
                <SortableContext items={sortableGroups} strategy={verticalListSortingStrategy} disabled={!isSortingGroups}>
                    <div className="px-3 space-y-1">
                        {sortableGroups.map(g => (
                            <div key={g}>
                                {isSortingGroups ? (
                                    <SortableGroupItem 
                                        id={g} 
                                        label={g} 
                                        count={channels.filter(c => (c.groupTitle || '未分类') === g).length} 
                                        isHidden={hiddenGroups.includes(g)}
                                        onDelete={handleDeleteGroup}
                                        onRename={handleRenameGroup}
                                        onToggleHide={handleToggleHideGroup}
                                    />
                                ) : (
                                    <button onClick={() => handleGroupClick(g)}
                                      className={`w-full text-left px-4 py-3 text-sm font-semibold transition-all rounded-xl ${selectedGroup === g ? 'bg-blue-600 text-white shadow-lg dark:shadow-none' : 'text-slate-600 dark:text-slate-355 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'} ${hiddenGroups.includes(g) ? 'opacity-60' : ''}`}>
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2 min-w-0">
                                            {hiddenGroups.includes(g) && <EyeOff size={12} className="text-slate-400 dark:text-slate-500 shrink-0" />}
                                            <span className={`truncate ${hiddenGroups.includes(g) ? 'line-through' : ''}`}>{g}</span>
                                          </div>
                                          <span className={`text-xs px-2 py-0.5 rounded-full ${selectedGroup === g ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                            {channels.filter(c => (c.groupTitle || '未分类') === g).length}
                                          </span>
                                        </div>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
         </div>
    </div>
  );
}
