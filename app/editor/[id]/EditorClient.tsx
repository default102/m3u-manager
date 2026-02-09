'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, ListFilter, Plus, Settings2, EyeOff, Edit2, Trash2, Eye } from 'lucide-react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { Channel, Playlist } from '@/types';
import { SortableGroupItem } from '@/components/editor/SortableGroupItem';
import { SortableChannelItem } from '@/components/editor/SortableChannelItem';
import { BatchActionBar } from '@/components/editor/BatchActionBar';
import { EditChannelModal } from '@/components/editor/EditChannelModal';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function EditorClient({ playlist }: { playlist: Playlist }) {
  const [channels, setChannels] = useState<Channel[]>(playlist.channels);
  const [groupOrder, setGroupOrder] = useState<string[]>(playlist.groupOrder ? JSON.parse(playlist.groupOrder) : []);
  const [hiddenGroups, setHiddenGroups] = useState<string[]>(playlist.hiddenGroups ? JSON.parse(playlist.hiddenGroups) : []);
  const [selectedGroup, setSelectedGroup] = useState<string>('全部');
  const [search, setSearch] = useState('');
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [showGroups, setShowGroups] = useState(true);
  const [isSortingGroups, setIsSortingGroups] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDangerous: false
  });

  useEffect(() => {
    setMounted(true);
    if (window.innerWidth < 768) setShowGroups(false);
  }, []);

  const allExistingGroupNames = useMemo(() => {
    const names = new Set(channels.map(c => c.groupTitle || '未分类'));
    return Array.from(names).filter(n => n !== '未分类').sort();
  }, [channels]);

  const sortableGroups = useMemo(() => {
    const seen = new Set<string>();
    const orderInFile: string[] = [];
    
    channels.forEach(c => {
        const title = c.groupTitle || '未分类';
        if (!seen.has(title)) {
            seen.add(title);
            orderInFile.push(title);
        }
    });

    if (groupOrder.length > 0) {
        const ordered = groupOrder.filter(name => seen.has(name));
        const remaining = orderInFile.filter(name => !ordered.includes(name));
        return [...ordered, ...remaining];
    }
    return orderInFile;
  }, [channels, groupOrder]);

  const stats = useMemo(() => {
    const totalChannels = channels.length;
    const totalGroups = sortableGroups.length;
    const hiddenGroupsCount = hiddenGroups.length;
    
    const hiddenChannelsCount = channels.filter(c => 
      hiddenGroups.includes(c.groupTitle || '未分类')
    ).length;

    return {
      totalChannels,
      totalGroups,
      hiddenGroupsCount,
      hiddenChannelsCount
    };
  }, [channels, sortableGroups, hiddenGroups]);

  const filteredChannels = useMemo(() => {
    let res = [...channels];
    if (selectedGroup !== '全部') {
       res = res.filter(c => (c.groupTitle || '未分类') === selectedGroup);
    }
    if (search) {
       res = res.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }
    return res;
  }, [channels, selectedGroup, search]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (isSortingGroups) {
        const oldIdx = sortableGroups.indexOf(active.id as string);
        const newIdx = sortableGroups.indexOf(over.id as string);
        if (oldIdx !== -1 && newIdx !== -1) {
            const newOrder = arrayMove(sortableGroups, oldIdx, newIdx);
            setGroupOrder(newOrder);
            fetch(`/api/playlist/${playlist.id}/group-order`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupOrder: newOrder })
            });
        }
        return;
    }

    if (selectedGroup === '全部') return;

    const activeId = parseInt(active.id.toString().replace('channel-', ''));
    const overId = parseInt(over.id.toString().replace('channel-', ''));
    const oldIndex = channels.findIndex(c => c.id === activeId);
    const newIndex = channels.findIndex(c => c.id === overId);
    
    if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(channels, oldIndex, newIndex);
        setChannels(reordered);
        fetch(`/api/playlist/${playlist.id}/sort`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelIds: reordered.map(c => c.id) })
        });
    }
  };

  const handleToggleSelect = (id: number) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const handleBatchDelete = () => {
      setConfirmModal({
          isOpen: true,
          title: '确认批量删除',
          message: `您确定要删除选中的 ${selectedIds.size} 个频道吗？此操作不可撤销。`,
          isDangerous: true,
          onConfirm: async () => {
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
              const idsToDelete = Array.from(selectedIds);
              setChannels(prev => prev.filter(c => !selectedIds.has(c.id)));
              setSelectedIds(new Set());
              await fetch('/api/channel/batch', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'delete', ids: idsToDelete })
              });
          }
      });
  };

  const handleSingleDelete = (id: number) => {
      setConfirmModal({
          isOpen: true,
          title: '确认删除频道',
          message: '您确定要删除这个频道吗？',
          isDangerous: true,
          onConfirm: async () => {
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
              setChannels(prev => prev.filter(c => c.id !== id));
              await fetch(`/api/channel/${id}`, { method: 'DELETE' });
          }
      });
  };

  const handleDeleteGroup = (groupName: string) => {
      setConfirmModal({
          isOpen: true,
          title: '确认删除分组',
          message: `您确定要删除分组 "${groupName}" 吗？该分组下的所有频道将被移动到 "未分类"。`,
          isDangerous: true,
          onConfirm: async () => {
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
              
              const channelIdsToMove = channels
                .filter(c => (c.groupTitle || '未分类') === groupName)
                .map(c => c.id);

              if (channelIdsToMove.length > 0) {
                  setChannels(prev => prev.map(c => 
                    channelIdsToMove.includes(c.id) ? { ...c, groupTitle: '' } : c
                  ));

                  await fetch('/api/channel/batch', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        action: 'move', 
                        ids: channelIdsToMove, 
                        data: { groupTitle: '' } 
                      })
                  });
              }

              const newOrder = groupOrder.filter(g => g !== groupName);
              setGroupOrder(newOrder);
              
              if (selectedGroup === groupName) {
                  setSelectedGroup('全部');
              }
          }
      });
  };

  const handleRenameGroup = (oldName: string) => {
      const newName = prompt(`将分组 "${oldName}" 重命名为:`, oldName);
      if (!newName || newName === oldName) return;

      const channelIdsToMove = channels
        .filter(c => (c.groupTitle || '未分类') === oldName)
        .map(c => c.id);

      if (channelIdsToMove.length > 0) {
          setChannels(prev => prev.map(c => 
            channelIdsToMove.includes(c.id) ? { ...c, groupTitle: newName } : c
          ));

          fetch('/api/channel/batch', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                action: 'move', 
                ids: channelIdsToMove, 
                data: { groupTitle: newName } 
              })
          });
      }

      const newOrder = groupOrder.map(g => g === oldName ? newName : g);
      setGroupOrder(newOrder);
      
      if (selectedGroup === oldName) {
          setSelectedGroup(newName);
      }
  };

  const handleToggleHideGroup = (groupName: string) => {
      if (groupName === '全部') return;
      const newHidden = hiddenGroups.includes(groupName)
        ? hiddenGroups.filter(g => g !== groupName)
        : [...hiddenGroups, groupName];
      
      setHiddenGroups(newHidden);
      fetch(`/api/playlist/${playlist.id}/hidden-groups`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hiddenGroups: newHidden })
      });
  };

  const handleBatchMove = async (targetGroup: string) => {
      const idsToMove = Array.from(selectedIds);
      setChannels(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, groupTitle: targetGroup } : c));
      setSelectedIds(new Set());
      await fetch('/api/channel/batch', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'move', ids: idsToMove, data: { groupTitle: targetGroup } })
      });
  };

  const handleUpdate = async (updated: Channel) => {
    const res = await fetch(`/api/channel/${updated.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
    });
    if (res.ok) {
        setChannels(prev => prev.map(c => c.id === updated.id ? updated : c));
        setEditingChannel(null);
    }
  };

  if (!mounted) return <div className="h-full flex items-center justify-center text-slate-400">正在加载编辑器...</div>;

  const isCurrentGroupHidden = hiddenGroups.includes(selectedGroup);

  return (
    <div className="flex h-full text-slate-900 overflow-hidden bg-white relative">
      <div className={`${showGroups ? (isSortingGroups ? 'w-80' : 'w-64') : 'w-0'} bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 overflow-hidden z-10 text-black`}>
         <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between mb-3 text-black">
                <div className="min-w-0">
                    <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                        共 {stats.totalGroups} 分类 / {stats.totalChannels} 频道
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[11px] text-blue-600 font-extrabold whitespace-nowrap">
                            有效: {stats.totalGroups - stats.hiddenGroupsCount} 分类 / {stats.totalChannels - stats.hiddenChannelsCount} 频道
                        </p>
                        {(stats.hiddenGroupsCount > 0 || stats.hiddenChannelsCount > 0) && (
                            <span className="text-[9px] text-slate-300 font-bold whitespace-nowrap">
                                (隐藏: {stats.hiddenGroupsCount}组/{stats.hiddenChannelsCount}台)
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-1 text-black shrink-0">
                    <button onClick={() => {
                        const name = prompt("输入新分组名称:");
                        if (name) {
                            fetch('/api/playlist/dummy-channel', { 
                                method: 'POST', 
                                headers: { 'Content-Type': 'application/json' }, 
                                body: JSON.stringify({ 
                                    name: '新频道', 
                                    url: 'http://', 
                                    groupTitle: name, 
                                    playlistId: playlist.id, 
                                    order: channels.length 
                                }) 
                            })
                            .then(res => res.json())
                            .then(data => { 
                                setChannels(prev => [...prev, data]); 
                                setSelectedGroup(name); 
                            });
                        }
                    }} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="新建分组"><Plus size={16}/></button>
                    <button onClick={() => setIsSortingGroups(!isSortingGroups)} className={`p-1.5 rounded-lg transition-all ${isSortingGroups ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-slate-100 text-slate-400'}`} title="管理分组"><Settings2 size={16}/></button>
                </div>
            </div>
            <div className="relative text-black">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none bg-slate-50 focus:ring-2 focus:ring-blue-500 transition-all text-black" placeholder="快速过滤..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
         </div>
         <div className="flex-1 overflow-y-auto py-2 custom-scrollbar text-black font-bold">
            <div className="px-2 mb-1">
                <button 
                  onClick={() => { setSelectedGroup('全部'); if (window.innerWidth < 768) setShowGroups(false); }}
                  disabled={isSortingGroups}
                  className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all rounded-xl ${selectedGroup === '全部' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-200/50'} ${isSortingGroups ? 'opacity-30 cursor-not-allowed' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span>全部</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${selectedGroup === '全部' ? 'bg-blue-500 text-blue-50' : 'bg-slate-100 text-slate-400'}`}>
                        {channels.length}
                      </span>
                    </div>
                </button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sortableGroups} strategy={verticalListSortingStrategy} disabled={!isSortingGroups}>
                    {sortableGroups.map(g => (
                        <div key={g} className="px-2 mb-1">
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
                                <button onClick={() => { setSelectedGroup(g); if (window.innerWidth < 768) setShowGroups(false); }}
                                  className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all rounded-xl ${selectedGroup === g ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-200/50'} ${hiddenGroups.includes(g) ? 'opacity-60' : ''}`}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 min-w-0">
                                        {hiddenGroups.includes(g) && <EyeOff size={12} className="text-slate-400 shrink-0" />}
                                        <span className={`truncate ${hiddenGroups.includes(g) ? 'line-through' : ''}`}>{g}</span>
                                      </div>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${selectedGroup === g ? 'bg-blue-500 text-blue-50' : 'bg-slate-100 text-slate-400'}`}>
                                        {channels.filter(c => (c.groupTitle || '未分类') === g).length}
                                      </span>
                                    </div>
                                </button>
                            )}
                        </div>
                    ))}
                </SortableContext>
            </DndContext>
         </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
         <div className="p-4 border-b flex justify-between items-center bg-white z-10 text-black">
             <div className="flex items-center gap-3 overflow-hidden">
               <button onClick={() => setShowGroups(!showGroups)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 shrink-0"><ListFilter size={18} /></button>
               
               <div className="flex items-center gap-2 min-w-0">
                  <h2 className="font-extrabold text-slate-800 text-sm md:text-base truncate">
                    {selectedGroup}
                  </h2>
                  <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] md:text-xs shrink-0">{filteredChannels.length}</span>
                  
                  {/* Quick Action Shortcuts for Selected Group */}
                  {selectedGroup !== '全部' && (
                    <div className="flex items-center gap-1 ml-2 border-l border-slate-100 pl-2 shrink-0">
                       <button 
                         onClick={() => handleToggleHideGroup(selectedGroup)}
                         className={`p-1.5 rounded-md transition-all ${isCurrentGroupHidden ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                         title={isCurrentGroupHidden ? "显示此分类" : "在订阅中隐藏此分类"}
                       >
                         {isCurrentGroupHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                       </button>
                       
                       {selectedGroup !== '未分类' && (
                         <>
                           <button 
                             onClick={() => handleRenameGroup(selectedGroup)}
                             className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                             title="重命名此分类"
                           >
                             <Edit2 size={16} />
                           </button>
                           <button 
                             onClick={() => handleDeleteGroup(selectedGroup)}
                             className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                             title="删除此分类"
                           >
                             <Trash2 size={16} />
                           </button>
                         </>
                       )}
                    </div>
                  )}
               </div>
             </div>
             
             <button onClick={() => selectedIds.size === filteredChannels.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(filteredChannels.map(c => c.id)))} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg shrink-0 ml-2">
                 {selectedIds.size === filteredChannels.length && filteredChannels.length > 0 ? '取消全选' : '全选'}
             </button>
         </div>

         <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30 custom-scrollbar pb-24">
            <div className="max-w-3xl mx-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredChannels.map(c => `channel-${c.id}`)} strategy={verticalListSortingStrategy} disabled={selectedGroup === '全部' || isSortingGroups}>
                  {filteredChannels.map(channel => (
                     <SortableChannelItem 
                        key={channel.id} 
                        id={`channel-${channel.id}`} 
                        channel={channel} 
                        onEdit={setEditingChannel} 
                        onDelete={handleSingleDelete}
                        selected={selectedIds.has(channel.id)}
                        onToggleSelect={handleToggleSelect}
                        isAllView={selectedGroup === '全部'}
                     />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
         </div>

         {selectedIds.size > 0 && (
             <BatchActionBar 
                selectedCount={selectedIds.size} 
                allGroups={allExistingGroupNames} 
                onMove={handleBatchMove} 
                onDelete={handleBatchDelete} 
             />
         )}
      </div>

      {editingChannel && (
        <EditChannelModal 
            channel={editingChannel} 
            allGroups={allExistingGroupNames} 
            onClose={() => setEditingChannel(null)} 
            onUpdate={handleUpdate} 
        />
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDangerous={confirmModal.isDangerous}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}