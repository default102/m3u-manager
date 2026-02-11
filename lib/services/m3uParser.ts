import { parse } from 'iptv-playlist-parser';
import type { CreateChannelRequest } from '@/types';

/**
 * M3U Parser Service
 * 负责解析 M3U 文件并转换为数据库格式
 */

interface M3UItem {
    name: string;
    url: string;
    tvg?: {
        id?: string;
        name?: string;
        logo?: string;
    };
    group?: {
        title?: string;
    };
}

interface ParsedM3U {
    items: M3UItem[];
}

/**
 * Parse M3U content and convert to channel data
 */
export function parseM3UContent(content: string): Omit<CreateChannelRequest, 'duration' | 'order'>[] {
    const parsed: ParsedM3U = parse(content);

    return parsed.items.map((item: M3UItem) => {
        const name = item.name?.trim() || '';
        const tvgName = item.tvg?.name?.trim() || '';
        const tvgId = item.tvg?.id?.trim() || '';

        return {
            name: name,
            url: item.url?.trim() || '',
            // Only store tvgId if it's different from name to save space
            tvgId: tvgId === name ? undefined : tvgId,
            // Only store tvgName if it's different from name
            tvgName: tvgName === name ? undefined : tvgName,
            tvgLogo: item.tvg?.logo?.trim() || undefined,
            groupTitle: item.group?.title?.trim() || undefined,
        };
    });
}

/**
 * Fetch M3U content from URL
 */
export async function fetchM3UFromUrl(url: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch M3U from URL: ${url}`);
    }
    return res.text();
}
