import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const playlistId = parseInt(id);
  const { groupOrder } = await request.json();

  try {
    await prisma.playlist.update({
      where: { id: playlistId },
      data: { groupOrder: JSON.stringify(groupOrder) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update group order' }, { status: 500 });
  }
}
