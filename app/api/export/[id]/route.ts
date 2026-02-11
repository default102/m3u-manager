import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getM3UFilename } from '@/lib/utils/helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const playlistId = parseInt(id);

  // 获取查询参数
  const { searchParams } = new URL(request.url);
  const isFull = searchParams.get('full') === 'true';
  const isDownload = searchParams.get('download') === 'true'; // 是否触发下载

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

  // 根据 isFull 参数决定是否过滤隐藏内容
  let sortedChannels = playlist.channels;

  if (!isFull) {
    // 当前版本：过滤隐藏的分组和频道
    const hiddenGroups = playlist.hiddenGroups ? JSON.parse(playlist.hiddenGroups) as string[] : [];
    const hiddenChannels = playlist.hiddenChannels ? JSON.parse(playlist.hiddenChannels) as (string | number)[] : [];
    const hiddenChannelIds = new Set(hiddenChannels.map(id => id.toString()));

    sortedChannels = playlist.channels.filter(c =>
      !hiddenGroups.includes(c.groupTitle || '未分类') &&
      !hiddenChannelIds.has(c.id.toString())
    );
  }

  // 按分组顺序排序
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

  // 生成 M3U 内容
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

  // 根据是否下载，设置不同的响应头
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  };

  if (isDownload) {
    // 下载模式：触发浏览器下载
    const filename = getM3UFilename(playlist.name, isFull);
    headers['Content-Type'] = 'application/vnd.apple.mpegurl; charset=utf-8';
    headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(filename)}"`;
  } else {
    // 访问模式：浏览器显示 / IPTV 应用读取
    headers['Content-Type'] = 'text/plain; charset=utf-8';
  }

  return new NextResponse(m3u, { headers });
}