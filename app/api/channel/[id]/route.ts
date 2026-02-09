import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const channelId = parseInt(id);
  const body = await request.json();

  try {
    const updated = await prisma.channel.update({
      where: { id: channelId },
      data: {
        name: body.name,
        tvgId: body.tvgId,
        tvgName: body.tvgName,
        tvgLogo: body.tvgLogo,
        groupTitle: body.groupTitle,
        url: body.url
      }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const channelId = parseInt(id);

  try {
    await prisma.channel.delete({ where: { id: channelId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 });
  }
}
