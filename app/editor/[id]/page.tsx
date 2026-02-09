import prisma from '@/lib/prisma';
import EditorClient from './EditorClient';
import Link from 'next/link';

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playlist = await prisma.playlist.findUnique({
     where: { id: parseInt(id) },
     include: { 
       channels: { 
         orderBy: { order: 'asc' } 
       } 
     }
  });

  if (!playlist) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-slate-500">
      <p className="mb-4">未找到播放列表</p>
      <Link href="/" className="text-blue-600 hover:underline">返回首页</Link>
    </div>
  );

  return <EditorClient playlist={JSON.parse(JSON.stringify(playlist))} />;
}
