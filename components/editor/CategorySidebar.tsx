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
    search,
    setSearch,
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
    <div className={`w-full md:w-80 bg-slate-50/50 border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 overflow-hidden z-10`}>
         <div className="p-4 border-b bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <button 
                      onClick={onSelect} 
                      className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                    >
                        <X size={18} />
                    </button>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">节目分组</h3>
                </div>
                <div className="flex gap-1">
                    <button onClick={handleCreateGroup} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="新建分组"><Plus size={16}/></button>
                    <button onClick={() => setIsSortingGroups(!isSortingGroups)} className={`p-1.5 rounded-lg transition-all ${isSortingGroups ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-slate-100 text-slate-400'}`} title="管理分组"><Settings2 size={16}/></button>
                </div>
            </div>
            <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-700" placeholder="搜索分组..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
         </div>
         
         <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
            <div className="px-3 mb-1">
                <button 
                  onClick={() => handleGroupClick('全部')}
                  disabled={isSortingGroups}
                  className={`w-full text-left px-4 py-3 text-xs font-bold transition-all rounded-xl ${selectedGroup === '全部' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-white hover:shadow-sm'} ${isSortingGroups ? 'opacity-30 cursor-not-allowed' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span>全部频道</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedGroup === '全部' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
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
                                      className={`w-full text-left px-4 py-3 text-xs font-bold transition-all rounded-xl ${selectedGroup === g ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-white hover:shadow-sm'} ${hiddenGroups.includes(g) ? 'opacity-60' : ''}`}>
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2 min-w-0">
                                            {hiddenGroups.includes(g) && <EyeOff size={12} className="text-slate-400 shrink-0" />}
                                            <span className={`truncate ${hiddenGroups.includes(g) ? 'line-through' : ''}`}>{g}</span>
                                          </div>
                                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedGroup === g ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
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
