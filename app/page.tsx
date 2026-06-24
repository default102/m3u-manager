'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Download, Plus, FileText, Check, Copy, RefreshCw, Database, Edit3, SlidersHorizontal } from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { CustomPrefixModal } from '@/components/CustomPrefixModal';
import { ImportModal } from '@/components/ImportModal';
import { RenameModal } from '@/components/RenameModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useClipboard } from '@/lib/hooks/useClipboard';
import { useConfirmModal } from '@/lib/hooks/useConfirmModal';
import { useClickOutside } from '@/lib/hooks/useClickOutside';
import { getExportUrl, formatDate } from '@/lib/utils/helpers';
import { API_ENDPOINTS, MESSAGES } from '@/lib/constants';
import type { PlaylistWithCount } from '@/types';

export default function Home() {
  const [playlists, setPlaylists] = useState<PlaylistWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [showRename, setShowRename] = useState<{ id: number; name: string } | null>(null);
  const [openDownloadMenu, setOpenDownloadMenu] = useState<number | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [customPrefixPlaylist, setCustomPrefixPlaylist] = useState<{ id: number; name: string } | null>(null);
  const [updateTarget, setUpdateTarget] = useState<{ id: number; name: string; url?: string } | undefined>(undefined);

  const { copiedId, copyToClipboard } = useClipboard();
  const { confirmModal, showConfirm, closeConfirm } = useConfirmModal();

  // 下载菜单的点击外部关闭
  const downloadMenuRef = useClickOutside(
    () => setOpenDownloadMenu(null),
    'download-menu-container',
    openDownloadMenu !== null,
  );

  useEffect(() => {
    fetchPlaylists();
    setBaseUrl(window.location.origin);
  }, []);

  const fetchPlaylists = () => {
    fetch(API_ENDPOINTS.PLAYLISTS)
      .then(res => res.json())
      .then((data: PlaylistWithCount[]) => {
        setPlaylists(data);
        setLoading(false);
      });
  };

  const handleCopy = (id: number) => {
    const fullUrl = getExportUrl(baseUrl, id);
    copyToClipboard(fullUrl, id);
  };

  const openImportModal = () => {
    setUpdateTarget(undefined);
    setShowImport(true);
  };

  const openUpdateModal = (playlist: PlaylistWithCount) => {
    setUpdateTarget({ id: playlist.id, name: playlist.name, url: playlist.url || undefined });
    setShowImport(true);
  };

  const handleDelete = (id: number) => {
    showConfirm({
      ...MESSAGES.CONFIRM.DELETE_PLAYLIST,
      isDangerous: true,
      onConfirm: async () => {
        closeConfirm();
        await fetch(API_ENDPOINTS.PLAYLIST(id), { method: 'DELETE' });
        setPlaylists(prev => prev.filter(p => p.id !== id));
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              M3U 订阅管理器
            </h1>
            <p className="text-slate-500 text-sm mt-1">高效管理、编辑并导出您的直播源列表</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/backups"
              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm active:scale-95"
              title="数据备份与恢复"
            >
              <Database size={20} />
            </Link>
            <button
              onClick={openImportModal}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm active:scale-95"
            >
              <Plus size={18} /> 导入列表
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p>正在获取列表...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {playlists.map(playlist => (
              <div key={playlist.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:shadow-md dark:hover:shadow-slate-950/20 hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left - Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <Link href={`/editor/${playlist.id}`} className="text-lg font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate">
                        {playlist.name}
                      </Link>
                      <button
                        onClick={() => setShowRename({ id: playlist.id, name: playlist.name })}
                        className="p-1 text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all"
                        title="重命名列表"
                      >
                        <Edit3 size={14} />
                      </button>
                      <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full font-bold">
                        {playlist._count?.channels || 0} CH
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-3 py-1.5 rounded-lg flex items-center justify-between min-w-0 max-w-md">
                        <code className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 truncate font-mono">
                          {baseUrl}/api/export/{playlist.id}
                        </code>
                        <div className="flex items-center gap-1.5 ml-2">
                          <button onClick={() => handleCopy(playlist.id)} className="p-1 text-slate-400 hover:text-blue-600 transition-colors" title="复制订阅地址">
                            {copiedId === playlist.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                          </button>
                          <button onClick={() => setCustomPrefixPlaylist({ id: playlist.id, name: playlist.name })} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors" title="自定义前缀复制">
                            <SlidersHorizontal size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-3">
                      <span>创建于 {formatDate(playlist.createdAt)}</span>
                      {playlist.url && <span className="truncate max-w-[200px] hidden sm:inline">来源: {playlist.url}</span>}
                    </div>
                  </div>

                  {/* Right - Actions */}
                  <div className="flex items-center justify-end gap-1 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-50 dark:border-slate-800">
                    <Link href={`/editor/${playlist.id}`} className="inline-flex items-center justify-center p-2.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all active:scale-95" title="编辑频道">
                      <FileText size={20} />
                    </Link>
                    <button onClick={() => openUpdateModal(playlist)} className="inline-flex items-center justify-center p-2.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-xl transition-all active:scale-95" title="更新/重新导入">
                      <RefreshCw size={20} />
                    </button>

                    {/* Download Dropdown */}
                    <div className="relative download-menu-container" ref={downloadMenuRef}>
                      <button
                        onClick={() => setOpenDownloadMenu(openDownloadMenu === playlist.id ? null : playlist.id)}
                        className="inline-flex items-center justify-center p-2.5 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-xl transition-all active:scale-95"
                        title="下载 M3U 文件"
                      >
                        <Download size={20} />
                      </button>
                      {openDownloadMenu === playlist.id && (
                        <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50">
                          <a href={`/api/export/${playlist.id}?full=false&download=true`} className="block px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => setOpenDownloadMenu(null)}>
                            <div className="flex items-center gap-2"><Download className="w-3.5 h-3.5" /><span>当前版本</span></div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 ml-5">排除隐藏内容</div>
                          </a>
                          <a href={`/api/export/${playlist.id}?full=true&download=true`} className="block px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => setOpenDownloadMenu(null)}>
                            <div className="flex items-center gap-2"><Download className="w-3.5 h-3.5" /><span>完整版</span></div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 ml-5">包含隐藏内容</div>
                          </a>
                        </div>
                      )}
                    </div>

                    <button onClick={() => handleDelete(playlist.id)} className="inline-flex items-center justify-center p-2.5 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all active:scale-95" title="删除列表">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {playlists.length === 0 && (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
                  <FileText size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">暂无订阅列表</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 px-4">导入您的第一个 M3U 直播源文件开始管理</p>
                <button onClick={openImportModal} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-blue-950/30 hover:bg-blue-700 transition-all active:scale-95">
                  立即导入
                </button>
              </div>
            )}
          </div>
        )}

        <footer className="mt-20 text-center text-slate-400 dark:text-slate-500 text-xs">
          <p>© 2026 M3U 订阅管理器 • 轻量化直播源管理方案</p>
        </footer>

        {/* Modals */}
        <ImportModal
          isOpen={showImport}
          onClose={() => setShowImport(false)}
          onSuccess={fetchPlaylists}
          updateTarget={updateTarget}
        />

        {showRename && (
          <RenameModal
            isOpen={true}
            playlistId={showRename.id}
            currentName={showRename.name}
            onClose={() => setShowRename(null)}
            onRenamed={(newName) => {
              setPlaylists(prev => prev.map(p => p.id === showRename.id ? { ...p, name: newName } : p));
              setShowRename(null);
            }}
          />
        )}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          isDangerous={confirmModal.isDangerous}
          onConfirm={confirmModal.onConfirm}
          onCancel={closeConfirm}
        />

        {customPrefixPlaylist && (
          <CustomPrefixModal
            isOpen={true}
            onClose={() => setCustomPrefixPlaylist(null)}
            playlistId={customPrefixPlaylist.id}
            playlistName={customPrefixPlaylist.name}
            baseUrl={baseUrl}
          />
        )}
      </div>
    </div>
  );
}
