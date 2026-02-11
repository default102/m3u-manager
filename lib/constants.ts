/**
 * Application Constants
 * 统一管理应用中的常量
 */

// API Endpoints
export const API_ENDPOINTS = {
  PLAYLISTS: '/api/playlist',
  PLAYLIST: (id: number) => `/api/playlist/${id}`,
  CHANNEL: (id: number) => `/api/channel/${id}`,
  CHANNEL_BATCH: '/api/channel/batch',
  EXPORT: (id: number) => `/api/export/${id}`,
  GROUP_ORDER: (playlistId: number) => `/api/playlist/${playlistId}/group-order`,
  HIDDEN_GROUPS: (playlistId: number) => `/api/playlist/${playlistId}/hidden-groups`,
  HIDDEN_CHANNELS: (playlistId: number) => `/api/playlist/${playlistId}/hidden-channels`,
  SORT_CHANNELS: (playlistId: number) => `/api/playlist/${playlistId}/sort`,
  CREATE_CHANNEL: (playlistId: number) => `/api/playlist/${playlistId}/channel`,
  BACKUP: '/api/backup',
  BACKUP_FILE: (filename: string) => `/api/backup/${filename}`,
} as const;

// Default Values
export const DEFAULTS = {
  GROUP_NAME: '未分类',
  ALL_GROUPS: '全部',
  NEW_CHANNEL_NAME: '新频道',
  NEW_CHANNEL_URL: 'http://',
  UNTITLED_PLAYLIST: 'Untitled Playlist',
} as const;

// UI Messages
export const MESSAGES = {
  CONFIRM: {
    DELETE_PLAYLIST: {
      title: '确认删除列表',
      message: '您确定要删除这个订阅列表吗？所有包含的频道和设置都将丢失。',
    },
    DELETE_CHANNEL: {
      title: '确认删除频道',
      message: '您确定要删除这个频道吗？',
    },
    BATCH_DELETE: (count: number) => ({
      title: '确认批量删除',
      message: `您确定要删除选中的 ${count} 个频道吗？此操作不可撤销。`,
    }),
    DELETE_GROUP: (groupName: string) => ({
      title: '确认删除分组',
      message: `您确定要删除分组 "${groupName}" 吗？该分组下的所有频道将被移动到 "未分类"。`,
    }),
    REIMPORT: {
      title: '确认覆盖列表',
      message: '警告：重新导入将彻底删除该列表下的所有现有频道和分组排序，并替换为新内容。此操作不可撤销！确定要继续吗？',
    },
  },
  ERROR: {
    IMPORT_FAILED: '操作失败',
    RENAME_FAILED: '修改失败',
    NO_NAME: '请输入列表名称',
    ADD_CHANNEL_FAILED: '添加频道失败',
  },
  PROMPT: {
    NEW_GROUP: '输入新分组名称:',
    RENAME_GROUP: (oldName: string) => `将分组 "${oldName}" 重命名为:`,
  },
} as const;

// File Types
export const ACCEPTED_FILE_TYPES = '.m3u,.m3u8,.txt';

// Timeouts
export const TIMEOUTS = {
  COPY_FEEDBACK: 2000, // milliseconds
} as const;
