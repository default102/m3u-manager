import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseM3UContent, fetchM3UFromUrl } from '@/lib/services/m3uParser';
import type { ImportPlaylistRequest } from '@/types';

export async function POST(request: Request) {
  try {
    const body: ImportPlaylistRequest = await request.json();
    const { name, content, url } = body;

    let m3uContent = content;

    // Fetch from URL if provided and no content
    if (url && !content) {
      m3uContent = await fetchM3UFromUrl(url);
    }

    if (!m3uContent) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    // Parse M3U content
    const channels = parseM3UContent(m3uContent);

    // Create Playlist and Channels in database
    const playlist = await prisma.$transaction(async (tx) => {
      const newPlaylist = await tx.playlist.create({
        data: {
          name: name || 'Untitled Playlist',
          url: url || null
        }
      });

      const channelsData = channels.map((channel, index) => ({
        name: channel.name,
        url: channel.url,
        tvgId: channel.tvgId ?? null,
        tvgName: channel.tvgName ?? null,
        tvgLogo: channel.tvgLogo ?? null,
        groupTitle: channel.groupTitle ?? null,
        duration: -1,
        order: index,
        playlistId: newPlaylist.id
      }));

      const chunkSize = 500;
      for (let i = 0; i < channelsData.length; i += chunkSize) {
        const chunk = channelsData.slice(i, i + chunkSize);
        await tx.channel.createMany({
          data: chunk
        });
      }

      return newPlaylist;
    });

    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Import Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const playlists = await prisma.playlist.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { channels: true } } }
  });
  return NextResponse.json(playlists);
}
