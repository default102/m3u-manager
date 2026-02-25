import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const playlistId = parseInt(id);
    const body = await req.json();
    const { name, url, groupTitle, tvgId, tvgName, tvgLogo } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      );
    }

    // Get the current highest order to append to the end
    const [lastChannel, playlist] = await Promise.all([
      prisma.channel.findFirst({
        where: { playlistId },
        orderBy: { order: 'desc' },
        select: { order: true }
      }),
      prisma.playlist.findUnique({
        where: { id: playlistId },
        select: { groupOrder: true }
      })
    ]);

    const newOrder = (lastChannel?.order ?? -1) + 1;

    const channel = await prisma.channel.create({
      data: {
        name,
        url,
        groupTitle: groupTitle || '',
        tvgId,
        tvgName,
        tvgLogo,
        order: newOrder,
        playlistId
      }
    });

    // 如果新频道的分组不在 groupOrder 中，则追加
    if (groupTitle) {
      const currentGroupOrder: string[] = playlist?.groupOrder
        ? JSON.parse(playlist.groupOrder)
        : [];

      if (!currentGroupOrder.includes(groupTitle)) {
        const newGroupOrder = [...currentGroupOrder, groupTitle];
        await prisma.playlist.update({
          where: { id: playlistId },
          data: { groupOrder: JSON.stringify(newGroupOrder) }
        });
      }
    }

    return NextResponse.json(channel);
  } catch (error) {
    console.error('Error creating channel:', error);
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    );
  }
}