import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const playlistId = parseInt(id);
  const { channelIds } = await request.json();

  if (!Array.isArray(channelIds)) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  try {
    // Transaction to update all orders
    await prisma.$transaction(
      channelIds.map((cId: number, index: number) => 
        prisma.channel.update({
          where: { id: cId, playlistId }, // ensure it belongs to playlist
          data: { order: index }
        })
      )
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to sort' }, { status: 500 });
  }
}
