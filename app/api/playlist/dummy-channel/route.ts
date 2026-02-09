import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, url, groupTitle, playlistId, order } = body;

    const channel = await prisma.channel.create({
      data: {
        name,
        url,
        groupTitle,
        playlistId,
        order: order || 0,
      }
    });

    return NextResponse.json(channel);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
  }
}
