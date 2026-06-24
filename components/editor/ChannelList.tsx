'use client';

import { usePlaylist } from './PlaylistContext';
import { Search } from 'lucide-react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableChannelItem } from './SortableChannelItem';
import { BatchActionBar } from './BatchActionBar';
import { AIGroupConfirmModal } from './AIGroupConfirmModal';

export function ChannelList() {
  const {
    filteredChannels,
    selectedGroup,
    isSortingGroups,
    selectedIds,
    hiddenChannels,
    orderedGroupNames,
    handleReorderChannels,
    setEditingChannel,
    handleSingleDelete,
    handleToggleSelect,
    handleBatchDelete,
    handleBatchMove,
    handleRequestAIGroup,
    handleToggleHideChannel,
    isAILoading,
    aiProgress
  } = usePlaylist();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 relative">
         {/* AI Loading Mask */}
         {isAILoading && (
           <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center p-6 text-black">
             <div className="w-12 h-12 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin mb-4"></div>
             <p className="text-base font-extrabold text-purple-700">AI 智能分析分组中...</p>
             {aiProgress && (
               <div className="w-64 mt-4 bg-slate-200 h-5 rounded-full overflow-hidden border border-slate-100 shadow-inner relative">
                 <div 
                   className="bg-purple-600 h-full rounded-full transition-all duration-300"
                   style={{ width: `${Math.round((aiProgress.current / aiProgress.total) * 100)}%` }}
                 />
                 <span className="absolute inset-0 text-[10px] font-extrabold text-slate-700 flex items-center justify-center mix-blend-difference">
                   {aiProgress.current} / {aiProgress.total} ({Math.round((aiProgress.current / aiProgress.total) * 100)}%)
                 </span>
               </div>
             )}
           </div>
         )}

         <div className="flex-1 overflow-y-auto p-2 md:p-4 custom-scrollbar pb-32">
            <div className="w-full">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => {
                  if (e.over && e.active.id !== e.over.id) {
                      const activeId = parseInt(e.active.id.toString().replace('channel-', ''));
                      const overId = parseInt(e.over.id.toString().replace('channel-', ''));
                      handleReorderChannels(activeId, overId);
                  }
              }}>
                <SortableContext items={filteredChannels.map(c => `channel-${c.id}`)} strategy={verticalListSortingStrategy} disabled={selectedGroup === '全部' || isSortingGroups}>
                  <div className="grid grid-cols-1 gap-2">
                    {filteredChannels.map(channel => (
                       <SortableChannelItem 
                          key={channel.id} 
                          id={`channel-${channel.id}`} 
                          channel={channel} 
                          onEdit={setEditingChannel} 
                          onDelete={handleSingleDelete}
                          selected={selectedIds.has(channel.id)}
                          isHidden={hiddenChannels.includes(channel.id)}
                          onToggleSelect={handleToggleSelect}
                          onToggleHide={handleToggleHideChannel}
                          isAllView={selectedGroup === '全部'}
                       />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              
              {filteredChannels.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                    <Search size={48} strokeWidth={1} className="mb-4 opacity-20" />
                    <p className="text-sm font-medium">此分类下暂无频道</p>
                </div>
              )}
            </div>
         </div>

         {selectedIds.size > 0 && (
             <BatchActionBar 
                selectedCount={selectedIds.size} 
                allGroups={orderedGroupNames} 
                onMove={handleBatchMove} 
                onAIGroup={handleRequestAIGroup}
                onDelete={handleBatchDelete} 
             />
         )}

         {/* AI Confirmation Modals */}
         <AIGroupConfirmModal />
    </div>
  );
}
