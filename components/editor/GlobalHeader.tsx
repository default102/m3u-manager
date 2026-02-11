'use client';

import Link from 'next/link';
import { ArrowLeft, Download, Plus, Copy } from 'lucide-react';
import { usePlaylist } from '@/components/editor/PlaylistContext';
import { useState, useEffect } from 'react';

export function GlobalHeader({ playlistName }: { playlistName: string }) {
  const { stats, setIsAddingChannel, setIsDuplicateModalOpen, playlistId } = usePlaylist();
  const [openDownloadMenu, setOpenDownloadMenu] = useState(false);

  // 点击外部关闭下载菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDownloadMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.download-menu-container')) {
          setOpenDownloadMenu(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDownloadMenu]);

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
          onClick={() => setIsDuplicateModalOpen(true)}
          className="flex items-center gap-1.5 bg-orange-50 text-orange-600 border border-orange-100 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold hover:bg-orange-100 transition-all active:scale-95 shrink-0 shadow-sm whitespace-nowrap"
          title="检查重复频道"
        >
          <Copy size={16} /> <span className="hidden sm:inline">查重</span>
        </button>

        {/* 下载按钮（下拉菜单） */}
        <div className="relative download-menu-container">
          <button
            onClick={() => setOpenDownloadMenu(!openDownloadMenu)}
            className="flex items-center gap-1.5 bg-slate-900 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shrink-0 shadow-md whitespace-nowrap"
          >
            <Download size={16} /> <span className="hidden sm:inline">下载</span>
          </button>

          {/* 下拉选项 */}
          {openDownloadMenu && (
            <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50">
              <a
                href={`/api/export/${playlistId}?full=false&download=true`}
                className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors active:bg-slate-200"
                onClick={() => setOpenDownloadMenu(false)}
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" />
                  <span>当前版本</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 ml-5">排除隐藏内容</div>
              </a>
              <a
                href={`/api/export/${playlistId}?full=true&download=true`}
                className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors active:bg-slate-200"
                onClick={() => setOpenDownloadMenu(false)}
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" />
                  <span>完整版</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 ml-5">包含隐藏内容</div>
              </a>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsAddingChannel(true)}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shrink-0 shadow-md whitespace-nowrap"
        >
          <Plus size={16} /> <span className="hidden sm:inline">添加频道</span>
        </button>
      </div>
    </header>
  );
}