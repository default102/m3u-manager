'use client';

import { useState, useEffect } from 'react';
import { usePlaylist } from './PlaylistContext';
import { X, CheckCircle2, Copy, Trash2, Link, Tag } from 'lucide-react';
import { Channel } from '@/types';
import { Modal } from '../Modal';

interface DuplicateGroup {
  type: 'name' | 'url';
  value: string;
  channels: Channel[];
}

export const DuplicateCheckModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { channels } = usePlaylist();
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsScanning(true);
      
      const nameMap = new Map<string, Channel[]>();
      const urlMap = new Map<string, Channel[]>();
      
      channels.forEach(c => {
        const nameKey = c.name.trim().toLowerCase();
        const urlKey = c.url.trim().toLowerCase();
        
        if (!nameMap.has(nameKey)) nameMap.set(nameKey, []);
        nameMap.get(nameKey)!.push(c);
        
        if (!urlMap.has(urlKey)) urlMap.set(urlKey, []);
        urlMap.get(urlKey)!.push(c);
      });

      const groups: DuplicateGroup[] = [];
      const urlDuplicateIds = new Set<number>();

      urlMap.forEach((list, val) => {
        if (list.length > 1) {
          groups.push({ type: 'url', value: val, channels: list });
          list.forEach(c => urlDuplicateIds.add(c.id));
        }
      });

      nameMap.forEach((list, val) => {
        if (list.length > 1) {
          const hasNewConflicts = list.some(c => !urlDuplicateIds.has(c.id));
          if (hasNewConflicts) {
            groups.push({ type: 'name', value: val, channels: list });
          }
        }
      });

      setDuplicateGroups(groups);
      
      const autoSelect = new Set<number>();
      const alreadyKept = new Set<number>();

      groups.forEach(g => {
        let keptIndex = g.channels.findIndex(c => !alreadyKept.has(c.id));
        if (keptIndex === -1) keptIndex = 0;
        alreadyKept.add(g.channels[keptIndex].id);
        g.channels.forEach((c, idx) => {
          if (idx !== keptIndex) autoSelect.add(c.id);
        });
      });
      
      setSelectedIds(autoSelect);
      setIsScanning(false);
    }
  }, [isOpen, channels]);

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch('/api/channel/batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: Array.from(selectedIds) })
      });
      if (res.ok) window.location.reload();
      else alert('删除失败');
    } catch (error) {
      console.error(error);
      alert('网络错误');
    }
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      maxWidth="max-w-2xl"
      zIndex={100000}
      header={
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
              <Copy size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">重复频道清理</h3>
              <p className="text-xs text-slate-500 font-medium">自动识别名称或 URL 相同的频道</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>
      }
      footer={
        <div className="p-6 flex items-center justify-between w-full bg-white">
          <div className="text-sm font-bold text-slate-500">
            {selectedIds.size > 0 ? (
              <span className="text-red-500">已选中 {selectedIds.size} 个待删除项</span>
            ) : (
              <span>请勾选要清理的重复项</span>
            )}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 font-black rounded-xl transition-all active:scale-95 text-sm"
            >
              取消
            </button>
            <button
              onClick={handleDelete}
              disabled={selectedIds.size === 0}
              className="px-8 py-2.5 text-white font-black rounded-xl transition-all shadow-lg flex items-center gap-2 text-sm active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: selectedIds.size > 0 ? '#dc2626' : '#cbd5e1',
                color: 'white',
                opacity: 1,
                visibility: 'visible'
              }}
            >
              <Trash2 size={16} style={{ color: 'white' }} />
              <span style={{ color: 'white' }}>确认删除</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="p-6">
        {isScanning ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm text-slate-500 font-bold">正在扫描冗余频道...</p>
          </div>
        ) : duplicateGroups.length > 0 ? (
          <div className="space-y-8">
            {duplicateGroups.map((group, gIdx) => (
              <div key={gIdx} className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-100 flex items-center gap-2">
                  {group.type === 'url' ? <Link size={14} className="text-blue-500"/> : <Tag size={14} className="text-indigo-500"/>}
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {group.type === 'url' ? '地址重复' : '名称重复'}
                  </span>
                  <span className="text-xs font-bold text-slate-600 truncate flex-1">{group.value}</span>
                  <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full text-slate-400 border border-slate-200">{group.channels.length} 份</span>
                </div>
                
                <div className="divide-y divide-slate-100">
                  {group.channels.map(channel => (
                    <div 
                      key={channel.id}
                      onClick={() => toggleSelect(channel.id)}
                      className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${selectedIds.has(channel.id) ? 'bg-red-50/50' : 'hover:bg-white'}`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        selectedIds.has(channel.id) 
                          ? 'bg-red-500 border-red-500 text-white' 
                          : 'border-slate-200 bg-white'
                      }`}>
                        {selectedIds.has(channel.id) && <X size={14} strokeWidth={4} />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-bold text-slate-700 truncate">{channel.name}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-medium">{channel.groupTitle || '未分类'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate font-mono">{channel.url}</div>
                      </div>

                      {selectedIds.has(channel.id) ? (
                        <span className="text-[10px] font-black text-red-500 bg-red-100 px-2 py-1 rounded-lg shrink-0">待删除</span>
                      ) : (
                        <span className="text-[10px] font-black text-green-600 bg-green-100 px-2 py-1 rounded-lg shrink-0">将保留</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-slate-800 font-black text-lg">未发现重复频道</h4>
            <p className="text-sm text-slate-400 mt-2">您的播放列表非常整洁，没有任何冗余数据。</p>
          </div>
        )}
      </div>
    </Modal>
  );
}