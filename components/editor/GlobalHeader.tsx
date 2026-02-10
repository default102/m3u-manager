'use client';

import Link from 'next/link';
import { ArrowLeft, Download, Plus } from 'lucide-react';
import { usePlaylist } from '@/components/editor/PlaylistContext';

export function GlobalHeader({ playlistName }: { playlistName: string }) {
  const { stats, setIsAddingChannel, playlistId } = usePlaylist();

  return (
    <header className="bg-white px-4 py-3 flex items-center justify-between shrink-0 z-30 shadow-xl shadow-slate-200/50 relative">
       {/* Left Side: Back + Title + Stats */}
       <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
         <Link href="/" className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors shrink-0">
            <ArrowLeft size={20} />
         </Link>
         <div className="min-w-0 flex flex-col">
            <h1 className="text-base md:text-lg font-bold text-slate-900 truncate pr-2">{playlistName}</h1>
            
            {/* Stats moved here */}
            <div className="flex items-center gap-2 mt-0.5 text-[10px] md:text-xs overflow-x-auto no-scrollbar whitespace-nowrap">
                <span className="text-slate-400 font-bold uppercase tracking-tighter">
                    共 {stats.totalGroups} 分类 / {stats.totalChannels} 频道
                </span>
                <span className="text-slate-300 font-bold">|</span>
                <span className="text-blue-600 font-bold uppercase tracking-tighter">
                    有效: {stats.totalGroups - stats.hiddenGroupsCount} 分类 / {stats.totalChannels - stats.hiddenChannelsCount} 频道
                </span>
                {(stats.hiddenGroupsCount > 0 || stats.hiddenChannelsCount > 0) && (
                    <>
                        <span className="text-slate-300 font-bold">|</span>
                        <span className="text-amber-500 font-bold uppercase tracking-tighter">
                            隐藏: {stats.hiddenGroupsCount} 组 / {stats.hiddenChannelsCount} 台
                        </span>
                    </>
                )}
            </div>
         </div>
       </div>

       {/* Right Side: Actions */}
       <div className="flex items-center gap-2 pl-2">
         <button 
           onClick={() => setIsAddingChannel(true)}
           className="flex items-center gap-1.5 bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shrink-0 shadow-md whitespace-nowrap"
         >
            <Plus size={16} /> <span className="hidden sm:inline">添加频道</span>
         </button>
         
         <a 
           href={`/api/export/${playlistId}`} 
           target="_blank" 
           className="flex items-center gap-1.5 bg-slate-900 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shrink-0 shadow-md whitespace-nowrap"
         >
            <Download size={16} /> <span className="hidden sm:inline">导出</span>
         </a>
       </div>
    </header>
  );
}
