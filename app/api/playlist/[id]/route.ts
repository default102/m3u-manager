import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parse } from 'iptv-playlist-parser';
import { fetchM3UFromUrl } from '@/lib/services/m3uParser';

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
        m3uContent = await fetchM3UFromUrl(url);
      } catch (e: any) {
          return NextResponse.json({ error: e.message || 'Failed to fetch URL' }, { status: 400 });
      }
  }

  if (!m3uContent) {
      return NextResponse.json({ error: 'No content' }, { status: 400 });
  }

  const parsed = parse(m3uContent);

  try {
      await prisma.$transaction(async (tx) => {
          // 1. 删除旧频道
          await tx.channel.deleteMany({ where: { playlistId } });
          
          // 2. 更新播放列表元数据并清空旧配置（url 有传则更新，否则 undefined 保持不变）
          await tx.playlist.update({
              where: { id: playlistId },
              data: {
                  url: url ? url : undefined,
                  groupOrder: null,
                  hiddenGroups: null,
                  hiddenChannels: null
              }
          });

          // 3. 构建新频道数据
          const channelsData = parsed.items.map((item: any, index: number) => {
              const name = item.name?.trim() || '';
              const tvgName = item.tvg?.name?.trim() || '';
              const tvgId = item.tvg?.id?.trim() || '';
              
              return {
                  name: name,
                  url: item.url?.trim() || '',
                  tvgId: tvgId === name ? null : (tvgId || null),
                  tvgName: tvgName === name ? null : (tvgName || null),
                  tvgLogo: item.tvg?.logo?.trim() || null,
                  groupTitle: item.group?.title?.trim() || null,
                  duration: -1,
                  order: index,
                  playlistId: playlistId
              };
          });

          // 4. 分批写入，每批 500 条
          const chunkSize = 500;
          for (let i = 0; i < channelsData.length; i += chunkSize) {
              const chunk = channelsData.slice(i, i + chunkSize);
              await tx.channel.createMany({
                  data: chunk
              });
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

      data: { name }

    });

    return NextResponse.json(playlist);

  } catch (error) {

    return NextResponse.json({ error: 'Failed to rename' }, { status: 500 });

  }

}