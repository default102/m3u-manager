import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { hiddenGroups } = await request.json();

    const playlist = await prisma.playlist.update({
      where: { id: parseInt(id) },
      data: {
        hiddenGroups: JSON.stringify(hiddenGroups)
      }
    });

    return NextResponse.json(playlist);
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
