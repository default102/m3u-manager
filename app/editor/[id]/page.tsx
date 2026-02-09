import prisma from '@/lib/prisma';
import EditorClient from './EditorClient';
import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';

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

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
       {/* 头部导航 */}
       <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
             <Link href="/" className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors shrink-0">
                <ArrowLeft size={20} />
             </Link>
             <div className="min-w-0">
                <h1 className="text-base md:text-lg font-bold text-slate-900 truncate pr-2">{playlist.name}</h1>
                <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-400">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-500 shrink-0">
                    {playlist.channels.length} 频道
                  </span>
                  <span className="truncate hidden md:inline">ID: {playlist.id}</span>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2">
             <a 
               href={`/api/export/${playlist.id}`} 
               target="_blank" 
               className="flex items-center gap-1.5 bg-slate-900 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shrink-0 shadow-md"
             >
                <Download size={16} /> <span className="hidden sm:inline">导出</span>
             </a>
          </div>
       </header>
       
       {/* 编辑器主区域 */}
       <main className="flex-1 overflow-hidden relative">
          <EditorClient playlist={playlist} />
       </main>
    </div>
  );
}
