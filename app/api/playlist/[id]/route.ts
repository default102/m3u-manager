import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseM3UContent, fetchM3UFromUrl } from '@/lib/services/m3uParser';
import type { UpdatePlaylistRequest } from '@/types';

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

  if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(playlist);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const playlistId = parseInt(id);
  const body: UpdatePlaylistRequest = await request.json();
  const { content, url } = body;

  let m3uContent = content;

  if (url && !content) {
    try {
      m3uContent = await fetchM3UFromUrl(url);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch URL';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  if (!m3uContent) {
    return NextResponse.json({ error: 'No content' }, { status: 400 });
  }

  // 使用统一的 parseM3UContent 替代直接调用 parse()
  const channels = parseM3UContent(m3uContent);

  try {
    await prisma.$transaction(async (tx) => {
      // 删除旧频道
      await tx.channel.deleteMany({ where: { playlistId } });

      // 更新播放列表元数据
      await tx.playlist.update({
        where: { id: playlistId },
        data: {
          url: url || undefined,
          groupOrder: null,
          hiddenGroups: null,
          hiddenChannels: null,
        },
      });

      // 构建新频道数据
      const channelsData = channels.map((channel, index) => ({
        name: channel.name,
        url: channel.url,
        tvgId: channel.tvgId ?? null,
        tvgName: channel.tvgName ?? null,
        tvgLogo: channel.tvgLogo ?? null,
        groupTitle: channel.groupTitle ?? null,
        duration: -1,
        order: index,
        playlistId,
      }));

      // 分批写入
      const chunkSize = 500;
      for (let i = 0; i < channelsData.length; i += chunkSize) {
        const chunk = channelsData.slice(i, i + chunkSize);
        await tx.channel.createMany({ data: chunk });
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const playlistId = parseInt(id);
  await prisma.playlist.delete({ where: { id: playlistId } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const playlistId = parseInt(id);
  const { name } = await request.json();

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  try {
    const playlist = await prisma.playlist.update({
      where: { id: playlistId },
      data: { name },
    });
    return NextResponse.json(playlist);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to rename' }, { status: 500 });
  }
}
