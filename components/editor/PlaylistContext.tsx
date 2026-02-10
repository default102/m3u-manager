'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { Channel, Playlist } from '@/types';
import { arrayMove } from '@dnd-kit/sortable';
import { useRouter } from 'next/navigation';

interface PlaylistContextType {
  // State
  playlistId: number;
  channels: Channel[];
  groupOrder: string[];
  hiddenGroups: string[];
  hiddenChannels: number[];
  selectedGroup: string;
  groupSearch: string;
  channelSearch: string;
  selectedIds: Set<number>;
  editingChannel: Channel | null;
  isSortingGroups: boolean;
  isAddingChannel: boolean;
  isDuplicateModalOpen: boolean;
  
  // Derived State
  allExistingGroupNames: string[];
  orderedGroupNames: string[];
  sortableGroups: string[];
  filteredChannels: Channel[];
  stats: {
    totalChannels: number;
    totalGroups: number;
    hiddenGroupsCount: number;
    hiddenChannelsCount: number;
  };

  // Actions
  setGroupSearch: (val: string) => void;
  setChannelSearch: (val: string) => void;
  setSelectedGroup: (val: string) => void;
  setIsSortingGroups: (val: boolean) => void;
  setEditingChannel: (channel: Channel | null) => void;
  setIsAddingChannel: (val: boolean) => void;
  setIsDuplicateModalOpen: (val: boolean) => void;
  setSelectedIds: (ids: Set<number>) => void;
  
  // Handlers
  handleCreateGroup: () => void;
  handleAddChannel: (channel: Omit<Channel, 'id' | 'playlistId' | 'order' | 'createdAt' | 'updatedAt' | 'duration'>) => Promise<void>;
  handleReorderGroups: (activeId: string, overId: string) => void;
  handleReorderChannels: (activeId: number, overId: number) => void;
  handleToggleSelect: (id: number) => void;
  handleSelectAll: () => void;
  handleDeselectAll: () => void;
  handleToggleHideChannel: (channelId: number) => void;
  
  // CRUD & Management
  handleUpdateChannel: (updated: Channel) => Promise<void>;
  handleSingleDelete: (id: number) => void;
  handleBatchDelete: () => void;
  handleBatchMove: (targetGroup: string) => Promise<void>;
  handleRenameGroup: (oldName: string) => void;
  handleDeleteGroup: (groupName: string) => void;
  handleToggleHideGroup: (groupName: string) => void;
  
  // Confirmation Modal
  confirmModal: {
    isOpen: boolean;
    title: string;
    message: string;
    isDangerous: boolean;
    onConfirm: () => void;
  };
  closeConfirmModal: () => void;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export function PlaylistProvider({ 
  children, 
  initialPlaylist 
}: { 
  children: React.ReactNode; 
  initialPlaylist: Playlist 
}) {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>(initialPlaylist.channels);
  const [groupOrder, setGroupOrder] = useState<string[]>(initialPlaylist.groupOrder ? JSON.parse(initialPlaylist.groupOrder) : []);
  const [hiddenGroups, setHiddenGroups] = useState<string[]>(initialPlaylist.hiddenGroups ? JSON.parse(initialPlaylist.hiddenGroups) : []);
  const [hiddenChannels, setHiddenChannels] = useState<number[]>(initialPlaylist.hiddenChannels ? JSON.parse(initialPlaylist.hiddenChannels) : []);
  const [selectedGroup, setSelectedGroup] = useState<string>('全部');
  const [groupSearch, setGroupSearch] = useState('');
  const [channelSearch, setChannelSearch] = useState('');
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isSortingGroups, setIsSortingGroups] = useState(false);
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDangerous: false
  });

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  // Use a ref to track if initial sync happened
  const hasInitialSync = useRef(false);

  // Only sync from initialPlaylist when it changes substantially (like after a re-import)
  useEffect(() => {
    if (hasInitialSync.current) {
        // If we already have data, only update if the initialPlaylist version is actually different
        // For simplicity, we sync it, but we also call router.refresh() in actions to keep them in sync
        setChannels(initialPlaylist.channels);
        setGroupOrder(initialPlaylist.groupOrder ? JSON.parse(initialPlaylist.groupOrder) : []);
        setHiddenGroups(initialPlaylist.hiddenGroups ? JSON.parse(initialPlaylist.hiddenGroups) : []);
        setHiddenChannels(initialPlaylist.hiddenChannels ? JSON.parse(initialPlaylist.hiddenChannels) : []);
    }
    hasInitialSync.current = true;
  }, [initialPlaylist.id, initialPlaylist.updatedAt]); // Assuming there is an updatedAt or just ID

  // --- Derived State ---

  const allExistingGroupNames = useMemo(() => {
    const names = new Set(channels.map(c => c.groupTitle || '未分类'));
    return Array.from(names).filter(n => n !== '未分类').sort();
  }, [channels]);

  const allGroupsInOrder = useMemo(() => {
    const seen = new Set<string>();
    const orderInFile: string[] = [];
    
    channels.forEach(c => {
        const title = c.groupTitle || '未分类';
        if (!seen.has(title)) {
            seen.add(title);
            orderInFile.push(title);
        }
    });

    let result: string[] = [];
    if (groupOrder.length > 0) {
        const ordered = groupOrder.filter(name => seen.has(name));
        const remaining = orderInFile.filter(name => !ordered.includes(name));
        result = [...ordered, ...remaining];
    } else {
        result = orderInFile;
    }
    return result;
  }, [channels, groupOrder]);

  const orderedGroupNames = useMemo(() => {
    return allGroupsInOrder.filter(n => n !== '未分类');
  }, [allGroupsInOrder]);

  const sortableGroups = useMemo(() => {
    let result = allGroupsInOrder;
    if (groupSearch) {
      result = result.filter(g => g.toLowerCase().includes(groupSearch.toLowerCase()));
    }
    return result;
  }, [allGroupsInOrder, groupSearch]);

  const stats = useMemo(() => {
    const totalChannels = channels.length;
    const totalGroups = sortableGroups.length;
    const hiddenGroupsCount = hiddenGroups.length;
    
    // Count channels that are EITHER in a hidden group OR individually hidden
    const hiddenChannelsCount = channels.filter(c => 
      hiddenGroups.includes(c.groupTitle || '未分类') || hiddenChannels.includes(c.id)
    ).length;

    return { totalChannels, totalGroups, hiddenGroupsCount, hiddenChannelsCount };
  }, [channels, sortableGroups, hiddenGroups, hiddenChannels]);

  const filteredChannels = useMemo(() => {
    let res = [...channels].sort((a, b) => a.order - b.order);
    if (selectedGroup !== '全部') {
       res = res.filter(c => (c.groupTitle || '未分类') === selectedGroup);
    }
    if (channelSearch) {
       res = res.filter(c => c.name.toLowerCase().includes(channelSearch.toLowerCase()));
    }
    return res;
  }, [channels, selectedGroup, channelSearch]);

  // --- Actions ---

  const handleCreateGroup = () => {
    const name = prompt("输入新分组名称:");
    if (!name) return;
    
    fetch(`/api/playlist/${initialPlaylist.id}/channel`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
            name: '新频道', 
            url: 'http://', 
            groupTitle: name
        }) 
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to create channel');
        return res.json();
    })
    .then(data => { 
        setChannels(prev => {
            if (prev.some(c => c.id === data.id)) return prev;
            return [...prev, data];
        }); 
        setSelectedGroup(name); 
        router.refresh();
    })
    .catch(err => alert(err.message));
  };

  const handleAddChannel = async (newChannel: Omit<Channel, 'id' | 'playlistId' | 'order' | 'createdAt' | 'updatedAt' | 'duration'>) => {
    try {
      const res = await fetch(`/api/playlist/${initialPlaylist.id}/channel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChannel)
      });
      
      if (!res.ok) throw new Error('Failed to create channel');
      
      const createdChannel = await res.json();
      
      setChannels(prev => [...prev, createdChannel]);
      setIsAddingChannel(false);
      router.refresh();
      
      if (createdChannel.groupTitle && createdChannel.groupTitle !== selectedGroup && selectedGroup !== '全部') {
           // Optionally switch view or just notify
      }
    } catch (error) {
      console.error(error);
      alert('添加频道失败');
    }
  };

  const handleReorderGroups = (activeId: string, overId: string) => {
    const oldIdx = sortableGroups.indexOf(activeId);
    const newIdx = sortableGroups.indexOf(overId);
    if (oldIdx !== -1 && newIdx !== -1) {
        const newOrder = arrayMove(sortableGroups, oldIdx, newIdx);
        setGroupOrder(newOrder);
        fetch(`/api/playlist/${initialPlaylist.id}/group-order`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupOrder: newOrder })
        }).then(() => router.refresh());
    }
  };

  const handleReorderChannels = (activeId: number, overId: number) => {
    const oldIndex = channels.findIndex(c => c.id === activeId);
    const newIndex = channels.findIndex(c => c.id === overId);
    
    if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(channels, oldIndex, newIndex);
        setChannels(reordered);
        fetch(`/api/playlist/${initialPlaylist.id}/sort`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelIds: reordered.map(c => c.id) })
        }).then(() => router.refresh());
    }
  };

  const handleToggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => setSelectedIds(new Set(filteredChannels.map(c => c.id)));
  const handleDeselectAll = () => setSelectedIds(new Set());

  const handleUpdateChannel = async (updated: Channel) => {
    const res = await fetch(`/api/channel/${updated.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
    });
    if (res.ok) {
        setChannels(prev => prev.map(c => c.id === updated.id ? updated : c));
        setEditingChannel(null);
        router.refresh();
    }
  };

  const handleSingleDelete = (id: number) => {
    setConfirmModal({
        isOpen: true,
        title: '确认删除频道',
        message: '您确定要删除这个频道吗？',
        isDangerous: true,
        onConfirm: async () => {
            closeConfirmModal();
            setChannels(prev => prev.filter(c => c.id !== id));
            await fetch(`/api/channel/${id}`, { method: 'DELETE' });
            router.refresh();
        }
    });
  };

  const handleBatchDelete = () => {
    setConfirmModal({
        isOpen: true,
        title: '确认批量删除',
        message: `您确定要删除选中的 ${selectedIds.size} 个频道吗？此操作不可撤销。`,
        isDangerous: true,
        onConfirm: async () => {
            closeConfirmModal();
            const idsToDelete = Array.from(selectedIds);
            setChannels(prev => prev.filter(c => !selectedIds.has(c.id)));
            setSelectedIds(new Set());
            await fetch('/api/channel/batch', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', ids: idsToDelete })
            });
            router.refresh();
        }
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
    router.refresh();
  };

  const handleDeleteGroup = (groupName: string) => {
    setConfirmModal({
        isOpen: true,
        title: '确认删除分组',
        message: `您确定要删除分组 "${groupName}" 吗？该分组下的所有频道将被移动到 "未分类"。`,
        isDangerous: true,
        onConfirm: async () => {
            closeConfirmModal();
            
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
            router.refresh();
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
    router.refresh();
  };

  const handleToggleHideGroup = (groupName: string) => {
    if (groupName === '全部') return;
    const newHidden = hiddenGroups.includes(groupName)
      ? hiddenGroups.filter(g => g !== groupName)
      : [...hiddenGroups, groupName];
    
    setHiddenGroups(newHidden);
    fetch(`/api/playlist/${initialPlaylist.id}/hidden-groups`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hiddenGroups: newHidden })
    }).then(() => router.refresh());
  };

  const handleToggleHideChannel = (channelId: number) => {
    const newHidden = hiddenChannels.includes(channelId)
      ? hiddenChannels.filter(id => id !== channelId)
      : [...hiddenChannels, channelId];
    
    setHiddenChannels(newHidden);
    fetch(`/api/playlist/${initialPlaylist.id}/hidden-channels`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hiddenChannels: newHidden })
    }).then(() => router.refresh());
  };

  const value = {
    playlistId: initialPlaylist.id,
    channels,
    groupOrder,
    hiddenGroups,
    hiddenChannels,
    selectedGroup,
    groupSearch,
    channelSearch,
    selectedIds,
    editingChannel,
    isSortingGroups,
    isAddingChannel,
    isDuplicateModalOpen,
    
    allExistingGroupNames,
    orderedGroupNames,
    sortableGroups,
    filteredChannels,
    stats,

    setGroupSearch,
    setChannelSearch,
    setSelectedGroup,
    setIsSortingGroups,
    setEditingChannel,
    setIsAddingChannel,
    setIsDuplicateModalOpen,
    setSelectedIds,
    
    handleCreateGroup,
    handleAddChannel,
    handleReorderGroups,
    handleReorderChannels,
    handleToggleSelect,
    handleSelectAll,
    handleDeselectAll,
    handleToggleHideChannel,
    
    handleUpdateChannel,
    handleSingleDelete,
    handleBatchDelete,
    handleBatchMove,
    handleRenameGroup,
    handleDeleteGroup,
    handleToggleHideGroup,
    
    confirmModal,
    closeConfirmModal
  };

  return <PlaylistContext.Provider value={value}>{children}</PlaylistContext.Provider>;
}

export function usePlaylist() {
  const context = useContext(PlaylistContext);
  if (!context) throw new Error('usePlaylist must be used within a PlaylistProvider');
  return context;
}