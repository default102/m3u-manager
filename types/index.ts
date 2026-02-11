export interface Channel {
  id: number;
  name: string;
  url: string;
  groupTitle: string | null;
  tvgId: string | null;
  tvgName: string | null;
  tvgLogo: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Playlist {
  id: number;
  name: string;
  url: string | null;
  groupOrder: string | null;
  hiddenGroups: string | null;
  hiddenChannels: string | null;
  channels: Channel[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    channels: number;
  };
}

export interface PlaylistWithCount extends Playlist {
  _count: {
    channels: number;
  };
}

// API Request/Response Types
export interface ImportPlaylistRequest {
  name: string;
  url?: string;
  content?: string;
}

export interface UpdatePlaylistRequest {
  url?: string;
  content?: string;
}

export interface RenamePlaylistRequest {
  name: string;
}

export interface CreateChannelRequest {
  name: string;
  url: string;
  groupTitle?: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
}

export interface UpdateChannelRequest {
  name?: string;
  url?: string;
  groupTitle?: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
}

export interface BatchChannelRequest {
  action: 'delete' | 'move';
  ids: number[];
  data?: {
    groupTitle?: string;
  };
}

export interface SortChannelsRequest {
  channelIds: number[];
}

export interface GroupOrderRequest {
  groupOrder: string[];
}

export interface HiddenGroupsRequest {
  hiddenGroups: string[];
}

export interface HiddenChannelsRequest {
  hiddenChannels: number[];
}

// Backup Types
export interface Backup {
  name: string;
  createdAt: Date;
  size: number;
}

export interface BackupResponse {
  name: string;
}
