import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parse } from 'iptv-playlist-parser';

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
  const body = await request.json();
  const { content, url } = body;

  let m3uContent = content;

  if (url && !content) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch M3U URL');
        m3uContent = await res.text();
      } catch (e) {
          return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 });
      }
  }

  if (!m3uContent) {
      return NextResponse.json({ error: 'No content' }, { status: 400 });
  }

  const parsed = parse(m3uContent);

  try {
      // 使用事务：先删除旧频道，再插入新频道
      await prisma.$transaction([
          prisma.channel.deleteMany({ where: { playlistId } }),
          prisma.playlist.update({
              where: { id: playlistId },
              data: {
                  url: url || undefined,
                  groupOrder: null, // 关键：重置分组顺序
                  channels: {
                      create: parsed.items.map((item: any, index: number) => ({
                          name: item.name,
                          url: item.url,
                          tvgId: item.tvg?.id || '',
                          tvgName: item.tvg?.name || '',
                          tvgLogo: item.tvg?.logo || '',
                          groupTitle: item.group?.title || '',
                          duration: -1,
                          order: index
                      }))
                  }
              }
          })
      ]);
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

      data: { name }

    });

    return NextResponse.json(playlist);

  } catch (error) {

    return NextResponse.json({ error: 'Failed to rename' }, { status: 500 });

  }

}