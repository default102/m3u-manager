import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const playlistId = parseInt(id);

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: {
      channels: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!playlist) {
    return new NextResponse('Playlist not found', { status: 404 });
  }

  const hiddenGroups = playlist.hiddenGroups ? JSON.parse(playlist.hiddenGroups) as string[] : [];

  // Sort channels by groupOrder first, then by channel order
  let sortedChannels = playlist.channels.filter(c => !hiddenGroups.includes(c.groupTitle || '未分类'));
  if (playlist.groupOrder) {
    const groupOrder = JSON.parse(playlist.groupOrder) as string[];
    sortedChannels.sort((a, b) => {
      const groupA = a.groupTitle || '未分类';
      const groupB = b.groupTitle || '未分类';
      const idxA = groupOrder.indexOf(groupA);
      const idxB = groupOrder.indexOf(groupB);
      
      // If both groups have an explicit order
      if (idxA !== -1 && idxB !== -1) {
        if (idxA !== idxB) return idxA - idxB;
        return a.order - b.order;
      }
      // Groups not in groupOrder go to the end
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      
      // If same group or both not in groupOrder, fallback to channel order
      if (groupA !== groupB) return groupA.localeCompare(groupB);
      return a.order - b.order;
    });
  }

  let m3u = '#EXTM3U\r\n';
  
  for (const channel of sortedChannels) {
    const attributes = [];
    if (channel.tvgId && channel.tvgId.trim() !== '') attributes.push(`tvg-id="${channel.tvgId}"`);
    if (channel.tvgName && channel.tvgName !== channel.name) attributes.push(`tvg-name="${channel.tvgName}"`);
    if (channel.tvgLogo) attributes.push(`tvg-logo="${channel.tvgLogo}"`);
    if (channel.groupTitle) attributes.push(`group-title="${channel.groupTitle}"`);
    
    const attrString = attributes.length > 0 ? ' ' + attributes.join(' ') : '';
    const duration = channel.duration ?? -1;
    
    m3u += `#EXTINF:${duration}${attrString},${channel.name}\r\n`;
    m3u += `${channel.url}\r\n`;
  }

  return new NextResponse(m3u, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    }
  });
}