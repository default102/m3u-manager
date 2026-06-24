import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { arrayMove } from '@dnd-kit/sortable';
import type { Channel } from '@/types';

interface UseChannelActionsParams {
  playlistId: number;
  channels: Channel[];
  selectedIds: Set<number>;
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  setEditingChannel: (channel: Channel | null) => void;
  setSelectedIds: (ids: Set<number>) => void;
  closeConfirmModal: () => void;
  showConfirm: (config: { title: string; message: string; isDangerous?: boolean; onConfirm: () => void }) => void;
}

export function useChannelActions({
  playlistId,
  channels,
  selectedIds,
  setChannels,
  setEditingChannel,
  setSelectedIds,
  closeConfirmModal,
  showConfirm,
}: UseChannelActionsParams) {
  const router = useRouter();

  const handleAddChannel = useCallback(async (newChannel: Omit<Channel, 'id' | 'playlistId' | 'order' | 'createdAt' | 'updatedAt' | 'duration'>) => {
    try {
      const res = await fetch(`/api/playlist/${playlistId}/channel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChannel),
      });
      if (!res.ok) throw new Error('Failed to create channel');
      const createdChannel = await res.json();
      setChannels(prev => [...prev, createdChannel]);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('添加频道失败');
    }
  }, [playlistId, setChannels, router]);

  const handleUpdateChannel = useCallback(async (updated: Channel) => {
    const res = await fetch(`/api/channel/${updated.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      setChannels(prev => prev.map(c => c.id === updated.id ? updated : c));
      setEditingChannel(null);
      router.refresh();
    }
  }, [setChannels, setEditingChannel, router]);

  const handleSingleDelete = useCallback((id: number) => {
    showConfirm({
      title: '确认删除频道',
      message: '您确定要删除这个频道吗？',
      isDangerous: true,
      onConfirm: async () => {
        closeConfirmModal();
        setChannels(prev => prev.filter(c => c.id !== id));
        await fetch(`/api/channel/${id}`, { method: 'DELETE' });
        router.refresh();
      },
    });
  }, [showConfirm, closeConfirmModal, setChannels, router]);

  const handleBatchDelete = useCallback(() => {
    showConfirm({
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
          body: JSON.stringify({ action: 'delete', ids: idsToDelete }),
        });
        router.refresh();
      },
    });
  }, [showConfirm, closeConfirmModal, selectedIds, setChannels, setSelectedIds, router]);

  const handleBatchMove = useCallback(async (targetGroup: string) => {
    const idsToMove = Array.from(selectedIds);
    setChannels(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, groupTitle: targetGroup } : c));
    setSelectedIds(new Set());
    await fetch('/api/channel/batch', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'move', ids: idsToMove, data: { groupTitle: targetGroup } }),
    });
    router.refresh();
  }, [selectedIds, setChannels, setSelectedIds, router]);

  const handleReorderChannels = useCallback((activeId: number, overId: number) => {
    const oldIndex = channels.findIndex(c => c.id === activeId);
    const newIndex = channels.findIndex(c => c.id === overId);
    if (oldIndex !== -1 && newIndex !== -1) {
      const moved = arrayMove(channels, oldIndex, newIndex);
      const reordered = moved.map((c, idx) => ({ ...c, order: idx }));
      setChannels(reordered);
      fetch(`/api/playlist/${playlistId}/sort`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelIds: reordered.map(c => c.id) }),
      }).then(() => router.refresh());
    }
  }, [channels, playlistId, setChannels, router]);

  return {
    handleAddChannel,
    handleUpdateChannel,
    handleSingleDelete,
    handleBatchDelete,
    handleBatchMove,
    handleReorderChannels,
  };
}
