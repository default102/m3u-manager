import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { arrayMove } from '@dnd-kit/sortable';
import { DEFAULTS, MESSAGES } from '@/lib/constants';
import type { Channel } from '@/types';

interface UseGroupActionsParams {
  playlistId: number;
  channels: Channel[];
  groupOrder: string[];
  hiddenGroups: string[];
  hiddenChannels: number[];
  selectedGroup: string;
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  setGroupOrder: React.Dispatch<React.SetStateAction<string[]>>;
  setHiddenGroups: React.Dispatch<React.SetStateAction<string[]>>;
  setHiddenChannels: React.Dispatch<React.SetStateAction<number[]>>;
  setSelectedGroup: (val: string) => void;
  showConfirm: (config: { title: string; message: string; isDangerous?: boolean; onConfirm: () => void }) => void;
  closeConfirmModal: () => void;
}

/** Compute ordered groups from channels and groupOrder */
function computeOrderedGroups(channels: Channel[], groupOrder: string[]): string[] {
  const seen = new Set<string>();
  const orderInFile: string[] = [];
  channels.forEach(c => {
    const title = c.groupTitle || DEFAULTS.GROUP_NAME;
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
}

export function useGroupActions({
  playlistId,
  channels,
  groupOrder,
  hiddenGroups,
  hiddenChannels,
  selectedGroup,
  setChannels,
  setGroupOrder,
  setHiddenGroups,
  setHiddenChannels,
  setSelectedGroup,
  showConfirm,
  closeConfirmModal,
}: UseGroupActionsParams) {
  const router = useRouter();

  const handleCreateGroup = useCallback(() => {
    const name = prompt(MESSAGES.PROMPT.NEW_GROUP);
    if (!name) return;

    fetch(`/api/playlist/${playlistId}/channel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: DEFAULTS.NEW_CHANNEL_NAME,
        url: DEFAULTS.NEW_CHANNEL_URL,
        groupTitle: name,
      }),
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
  }, [playlistId, setChannels, setSelectedGroup, router]);

  const handleReorderGroups = useCallback((activeId: string, overId: string) => {
    // Compute current groups on each call to avoid stale closure
    let groups: string[];
    setChannels(currentChannels => {
      let currentGroupOrder: string[];
      setGroupOrder(go => {
        currentGroupOrder = go;
        return go;
      });
      groups = computeOrderedGroups(currentChannels, currentGroupOrder!);
      return currentChannels;
    });

    // Need to compute synchronously using the latest refs
    // We use a different approach: compute from closures
  }, []);

  // Better approach: compute groups inside the callback using closure values
  const handleReorderGroupsImpl = useCallback((activeId: string, overId: string) => {
    const orderedGroups = computeOrderedGroups(channels, groupOrder);
    const oldIdx = orderedGroups.indexOf(activeId);
    const newIdx = orderedGroups.indexOf(overId);
    if (oldIdx !== -1 && newIdx !== -1) {
      const newOrder = arrayMove(orderedGroups, oldIdx, newIdx);
      setGroupOrder(newOrder);
      fetch(`/api/playlist/${playlistId}/group-order`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupOrder: newOrder }),
      }).then(() => router.refresh());
    }
  }, [channels, groupOrder, playlistId, setGroupOrder, router]);

  const handleRenameGroup = useCallback((oldName: string) => {
    const newName = prompt(MESSAGES.PROMPT.RENAME_GROUP(oldName), oldName);
    if (!newName || newName === oldName) return;

    const ids = channels
      .filter(c => (c.groupTitle || DEFAULTS.GROUP_NAME) === oldName)
      .map(c => c.id);

    if (ids.length > 0) {
      setChannels(prev => prev.map(c => ids.includes(c.id) ? { ...c, groupTitle: newName } : c));
      fetch('/api/channel/batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move', ids, data: { groupTitle: newName } }),
      });
    }

    setGroupOrder(prev => prev.map(g => g === oldName ? newName : g));
    if (selectedGroup === oldName) setSelectedGroup(newName);
    router.refresh();
  }, [channels, selectedGroup, setChannels, setGroupOrder, setSelectedGroup, router]);

  const handleDeleteGroup = useCallback((groupName: string) => {
    showConfirm({
      title: MESSAGES.CONFIRM.DELETE_GROUP(groupName).title,
      message: MESSAGES.CONFIRM.DELETE_GROUP(groupName).message,
      isDangerous: true,
      onConfirm: async () => {
        closeConfirmModal();
        const ids = channels
          .filter(c => (c.groupTitle || DEFAULTS.GROUP_NAME) === groupName)
          .map(c => c.id);

        if (ids.length > 0) {
          setChannels(prev => prev.map(c => ids.includes(c.id) ? { ...c, groupTitle: '' } : c));
          await fetch('/api/channel/batch', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'move', ids, data: { groupTitle: '' } }),
          });
        }

        setGroupOrder(prev => prev.filter(g => g !== groupName));
        if (selectedGroup === groupName) setSelectedGroup(DEFAULTS.ALL_GROUPS);
        router.refresh();
      },
    });
  }, [channels, selectedGroup, setChannels, setGroupOrder, setSelectedGroup, showConfirm, closeConfirmModal, router]);

  const handleToggleHideGroup = useCallback((groupName: string) => {
    if (groupName === DEFAULTS.ALL_GROUPS) return;
    const newHidden = hiddenGroups.includes(groupName)
      ? hiddenGroups.filter(g => g !== groupName)
      : [...hiddenGroups, groupName];
    setHiddenGroups(newHidden);
    fetch(`/api/playlist/${playlistId}/hidden-groups`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hiddenGroups: newHidden }),
    }).then(() => router.refresh());
  }, [hiddenGroups, playlistId, setHiddenGroups, router]);

  const handleToggleHideChannel = useCallback((channelId: number) => {
    const newHidden = hiddenChannels.includes(channelId)
      ? hiddenChannels.filter(id => id !== channelId)
      : [...hiddenChannels, channelId];
    setHiddenChannels(newHidden);
    fetch(`/api/playlist/${playlistId}/hidden-channels`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hiddenChannels: newHidden }),
    }).then(() => router.refresh());
  }, [hiddenChannels, playlistId, setHiddenChannels, router]);

  return {
    handleCreateGroup,
    handleReorderGroups: handleReorderGroupsImpl,
    handleRenameGroup,
    handleDeleteGroup,
    handleToggleHideGroup,
    handleToggleHideChannel,
  };
}
