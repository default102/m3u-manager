import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parse } from 'iptv-playlist-parser';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, content, url } = body;

    let m3uContent = content;

    if (url && !content) {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch M3U URL');
      m3uContent = await res.text();
    }

    if (!m3uContent) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    const parsed = parse(m3uContent);
    
    // Create Playlist and Channels
    // Using a transaction is better if strict, but simple create is fine here.
    const playlist = await prisma.playlist.create({
      data: {
        name: name || 'Untitled Playlist',
        url: url || null,
        channels: {
          create: parsed.items.map((item: any, index: number) => {
            const tvgName = item.tvg?.name || '';
            return {
              name: item.name,
              url: item.url,
              tvgId: item.tvg?.id || '',
              tvgName: tvgName === item.name ? '' : tvgName, // Don't store if identical to name
              tvgLogo: item.tvg?.logo || '',
              groupTitle: item.group?.title || '',
              duration: -1,
              order: index
            };
          })
        }
      }
    });

    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Import Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  const playlists = await prisma.playlist.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { channels: true } } }
  });
  return NextResponse.json(playlists);
}
