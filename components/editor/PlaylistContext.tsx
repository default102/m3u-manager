'use client';

import React, { createContext, useContext, useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Channel, Playlist, AIRecommendationResult } from '@/types';
import { DEFAULTS } from '@/lib/constants';
import { safeJsonParse } from '@/lib/utils/helpers';
import { useChannelActions } from '@/lib/hooks/editor/useChannelActions';
import { useGroupActions } from '@/lib/hooks/editor/useGroupActions';
import { useAIActions } from '@/lib/hooks/editor/useAIActions';

// ============================================================
// Context Type Definition
// ============================================================
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
  isAILoading: boolean;
  aiProgress: { current: number; total: number } | null;
  aiRecommendations: AIRecommendationResult[] | null;
  setAiRecommendations: (val: AIRecommendationResult[] | null) => void;

  // Derived State
  allExistingGroupNames: string[];
  allChannelUrls: string[];
  orderedGroupNames: string[];
  sortableGroups: string[];
  filteredChannels: Channel[];
  stats: {
    totalChannels: number;
    totalGroups: number;
    hiddenGroupsCount: number;
    hiddenChannelsCount: number;
  };

  // Setter Actions
  setGroupSearch: (val: string) => void;
  setChannelSearch: (val: string) => void;
  setSelectedGroup: (val: string) => void;
  setIsSortingGroups: (val: boolean) => void;
  setEditingChannel: (channel: Channel | null) => void;
  setIsAddingChannel: (val: boolean) => void;
  setIsDuplicateModalOpen: (val: boolean) => void;
  setSelectedIds: (ids: Set<number>) => void;

  // Selection
  handleToggleSelect: (id: number) => void;
  handleSelectAll: () => void;
  handleDeselectAll: () => void;

  // Channel CRUD
  handleAddChannel: (channel: Omit<Channel, 'id' | 'playlistId' | 'order' | 'createdAt' | 'updatedAt' | 'duration'>) => Promise<void>;
  handleUpdateChannel: (updated: Channel) => Promise<void>;
  handleSingleDelete: (id: number) => void;
  handleBatchDelete: () => void;
  handleBatchMove: (targetGroup: string) => Promise<void>;
  handleReorderChannels: (activeId: number, overId: number) => void;

  // Group Management
  handleCreateGroup: () => void;
  handleReorderGroups: (activeId: string, overId: string) => void;
  handleRenameGroup: (oldName: string) => void;
  handleDeleteGroup: (groupName: string) => void;
  handleToggleHideGroup: (groupName: string) => void;
  handleToggleHideChannel: (channelId: number) => void;

  // AI
  handleRequestAIGroup: () => Promise<void>;
  handleApplyAIGroup: (updates: { id: number; groupTitle: string }[]) => Promise<void>;

  // Confirmation
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

// ============================================================
// Provider Component
// ============================================================
export function PlaylistProvider({
  children,
  initialPlaylist,
}: {
  children: React.ReactNode;
  initialPlaylist: Playlist;
}) {
  // --- Core State ---
  const [channels, setChannels] = useState<Channel[]>(initialPlaylist.channels);
  const [groupOrder, setGroupOrder] = useState<string[]>(safeJsonParse<string[]>(initialPlaylist.groupOrder, []));
  const [hiddenGroups, setHiddenGroups] = useState<string[]>(safeJsonParse<string[]>(initialPlaylist.hiddenGroups, []));
  const [hiddenChannels, setHiddenChannels] = useState<number[]>(safeJsonParse<number[]>(initialPlaylist.hiddenChannels, []));
  const [selectedGroup, setSelectedGroup] = useState<string>(DEFAULTS.ALL_GROUPS);
  const [groupSearch, setGroupSearch] = useState('');
  const [channelSearch, setChannelSearch] = useState('');
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isSortingGroups, setIsSortingGroups] = useState(false);
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // --- Confirmation Modal ---
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDangerous: false,
  });

  const closeConfirmModal = useCallback(() => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showConfirm = useCallback((config: {
    title: string;
    message: string;
    isDangerous?: boolean;
    onConfirm: () => void;
  }) => {
    setConfirmModal({
      isOpen: true,
      title: config.title,
      message: config.message,
      isDangerous: config.isDangerous || false,
      onConfirm: config.onConfirm,
    });
  }, []);

  // --- Sync from initialPlaylist ---
  const hasInitialSync = useRef(false);
  useEffect(() => {
    if (hasInitialSync.current) {
      setChannels(initialPlaylist.channels);
      setGroupOrder(safeJsonParse<string[]>(initialPlaylist.groupOrder, []));
      setHiddenGroups(safeJsonParse<string[]>(initialPlaylist.hiddenGroups, []));
      setHiddenChannels(safeJsonParse<number[]>(initialPlaylist.hiddenChannels, []));
    }
    hasInitialSync.current = true;
  }, [initialPlaylist.id, initialPlaylist.updatedAt]);

  // --- Composed Hooks ---
  const channelActions = useChannelActions({
    playlistId: initialPlaylist.id,
    channels,
    selectedIds,
    setChannels,
    setEditingChannel,
    setSelectedIds,
    closeConfirmModal,
    showConfirm,
  });

  const groupActions = useGroupActions({
    playlistId: initialPlaylist.id,
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
  });

  const aiActions = useAIActions({
    selectedIds,
    channels,
    setChannels,
    setSelectedIds,
  });

  // --- Derived State ---
  const allExistingGroupNames = useMemo(() => {
    const names = new Set(channels.map(c => c.groupTitle || DEFAULTS.GROUP_NAME));
    return Array.from(names).filter(n => n !== DEFAULTS.GROUP_NAME).sort();
  }, [channels]);

  const allChannelUrls = useMemo(() => {
    return channels.map(c => c.url).filter(Boolean);
  }, [channels]);

  const allGroupsInOrder = useMemo(() => {
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
  }, [channels, groupOrder]);

  const orderedGroupNames = useMemo(() => {
    return allGroupsInOrder.filter(n => n !== DEFAULTS.GROUP_NAME);
  }, [allGroupsInOrder]);

  const sortableGroups = useMemo(() => {
    let result = allGroupsInOrder;
    if (groupSearch) {
      result = result.filter(g => g.toLowerCase().includes(groupSearch.toLowerCase()));
    }
    return result;
  }, [allGroupsInOrder, groupSearch]);

  const stats = useMemo(() => {
    const hiddenChannelsCount = channels.filter(c =>
      hiddenGroups.includes(c.groupTitle || DEFAULTS.GROUP_NAME) || hiddenChannels.includes(c.id)
    ).length;
    return {
      totalChannels: channels.length,
      totalGroups: sortableGroups.length,
      hiddenGroupsCount: hiddenGroups.length,
      hiddenChannelsCount,
    };
  }, [channels, sortableGroups, hiddenGroups, hiddenChannels]);

  const filteredChannels = useMemo(() => {
    let res = [...channels].sort((a, b) => a.order - b.order);
    if (selectedGroup !== DEFAULTS.ALL_GROUPS) {
      res = res.filter(c => (c.groupTitle || DEFAULTS.GROUP_NAME) === selectedGroup);
    }
    if (channelSearch) {
      res = res.filter(c => c.name.toLowerCase().includes(channelSearch.toLowerCase()));
    }
    return res;
  }, [channels, selectedGroup, channelSearch]);

  // --- Selection Helper ---
  const handleToggleSelect = useCallback((id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  }, [selectedIds]);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(filteredChannels.map(c => c.id)));
  }, [filteredChannels]);

  const handleDeselectAll = useCallback(() => setSelectedIds(new Set()), []);

  // --- Context Value ---
  const value: PlaylistContextType = {
    // State
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
    ...aiActions,

    // Derived State
    allExistingGroupNames,
    allChannelUrls,
    orderedGroupNames,
    sortableGroups,
    filteredChannels,
    stats,

    // Setters
    setGroupSearch,
    setChannelSearch,
    setSelectedGroup,
    setIsSortingGroups,
    setEditingChannel,
    setIsAddingChannel,
    setIsDuplicateModalOpen,
    setSelectedIds,

    // Selection
    handleToggleSelect,
    handleSelectAll,
    handleDeselectAll,

    // Channel actions
    ...channelActions,

    // Group actions
    ...groupActions,

    // Confirmation
    confirmModal,
    closeConfirmModal,
  };

  return <PlaylistContext.Provider value={value}>{children}</PlaylistContext.Provider>;
}

export function usePlaylist() {
  const context = useContext(PlaylistContext);
  if (!context) throw new Error('usePlaylist must be used within a PlaylistProvider');
  return context;
}
