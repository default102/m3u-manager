export interface Channel {
  id: number;
  name: string;
  url: string;
  groupTitle: string | null;
  tvgId: string | null;
  tvgName: string | null;
  tvgLogo: string | null;
  order: number;
}

export interface Playlist {
  id: number;
  name: string;
  url: string | null;
  groupOrder: string | null;
  hiddenGroups: string | null;
  channels: Channel[];
}
