'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Download, Plus, FileText, Globe, Check, Copy, RefreshCw, Database, X, Upload, Edit3 } from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useClipboard } from '@/lib/hooks/useClipboard';
import { useConfirmModal } from '@/lib/hooks/useConfirmModal';
import { getExportUrl, formatDate } from '@/lib/utils/helpers';
import { API_ENDPOINTS, MESSAGES, DEFAULTS, ACCEPTED_FILE_TYPES } from '@/lib/constants';
import type { PlaylistWithCount, ImportPlaylistRequest, UpdatePlaylistRequest, RenamePlaylistRequest } from '@/types';

export default function Home() {
  const [playlists, setPlaylists] = useState<PlaylistWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [showRename, setShowRename] = useState<{ id: number, name: string } | null>(null);
  const [baseUrl, setBaseUrl] = useState('');

  // 导入/更新状态
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Custom hooks
  const { copiedId, copyToClipboard } = useClipboard();
  const { confirmModal, showConfirm, closeConfirm } = useConfirmModal();

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFileContent(ev.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const openImportModal = () => {
    setUpdatingId(null);
    setName(''); setUrl(''); setFileContent(null); setFileName(null);
    setShowImport(true);
  };

  const openUpdateModal = (playlist: PlaylistWithCount) => {
    setUpdatingId(playlist.id);
    setName(playlist.name);
    setUrl(playlist.url || '');
    setFileContent(null);
    setFileName(null);
    setShowImport(true);
  };

  const executeImportOrUpdate = async () => {
    if (!updatingId && !name) {
      alert(MESSAGES.ERROR.NO_NAME);
      return;
    }
    setImporting(true);
    try {
      if (updatingId) {
        const request: UpdatePlaylistRequest = { url, content: fileContent || undefined };
        const res = await fetch(API_ENDPOINTS.PLAYLIST(updatingId), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });
        if (!res.ok) throw new Error('Update failed');
      } else {
        const request: ImportPlaylistRequest = { name, url, content: fileContent || undefined };
        const res = await fetch(API_ENDPOINTS.PLAYLISTS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        });
        if (!res.ok) throw new Error('Import failed');
      }

      fetchPlaylists();
      setShowImport(false);
      setName(''); setUrl(''); setFileContent(null); setUpdatingId(null); setFileName(null);
    } catch (e) {
      alert(MESSAGES.ERROR.IMPORT_FAILED);
    } finally {
      setImporting(false);
    }
  };

  const handleRename = async () => {
    if (!showRename || !showRename.name.trim()) return;
    try {
      const request: RenamePlaylistRequest = { name: showRename.name };
      const res = await fetch(API_ENDPOINTS.PLAYLIST(showRename.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      if (res.ok) {
        setPlaylists(playlists.map(p => p.id === showRename.id ? { ...p, name: showRename.name } : p));
        setShowRename(null);
      }
    } catch (e) {
      alert(MESSAGES.ERROR.RENAME_FAILED);
    }
  };

  const handleImportClick = () => {
    if (updatingId) {
      showConfirm({
        ...MESSAGES.CONFIRM.REIMPORT,
        isDangerous: true,
        onConfirm: () => {
          closeConfirm();
          executeImportOrUpdate();
        }
      });
    } else {
      executeImportOrUpdate();
    }
  };

  const handleDelete = (id: number) => {
    showConfirm({
      ...MESSAGES.CONFIRM.DELETE_PLAYLIST,
      isDangerous: true,
      onConfirm: async () => {
        closeConfirm();
        await fetch(API_ENDPOINTS.PLAYLIST(id), { method: 'DELETE' });
        setPlaylists(prev => prev.filter(p => p.id !== id));
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              M3U 订阅管理器
            </h1>
            <p className="text-slate-500 text-sm mt-1">高效管理、编辑并导出您的直播源列表</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/backups"
              className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm active:scale-95"
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p>正在获取列表...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {playlists.map(playlist => (
              <div key={playlist.id} className="group bg-white border border-slate-200 p-5 rounded-2xl hover:shadow-md hover:border-blue-200 transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <Link href={`/editor/${playlist.id}`} className="text-lg font-bold text-slate-800 hover:text-blue-600 transition-colors truncate">
                        {playlist.name}
                      </Link>
                      <button
                        onClick={() => setShowRename({ id: playlist.id, name: playlist.name })}
                        className="p-1 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                        title="重命名列表"
                      >
                        <Edit3 size={14} />
                      </button>
                      <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold">
                        {playlist._count?.channels || 0} CH
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 group/url">
                      <div className="flex-1 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center justify-between min-w-0 max-w-md">
                        <code className="text-[11px] md:text-xs text-slate-500 truncate font-mono">
                          {baseUrl}/api/export/{playlist.id}
                        </code>
                        <button
                          onClick={() => handleCopy(playlist.id)}
                          className="ml-2 p-1 text-slate-400 hover:text-blue-600 transition-colors"
                          title="复制订阅地址"
                        >
                          {copiedId === playlist.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-3">
                      <span>创建于 {formatDate(playlist.createdAt)}</span>
                      {playlist.url && <span className="truncate max-w-[200px] hidden sm:inline">来源: {playlist.url}</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-50">
                    <Link
                      href={`/editor/${playlist.id}`}
                      className="inline-flex items-center justify-center p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all active:scale-95"
                      title="编辑频道"
                    >
                      <FileText size={20} />
                    </Link>
                    <button
                      onClick={() => openUpdateModal(playlist)}
                      className="inline-flex items-center justify-center p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all active:scale-95"
                      title="更新/重新导入"
                    >
                      <RefreshCw size={20} />
                    </button>
                    <a
                      href={`/api/export/${playlist.id}`}
                      target="_blank"
                      className="inline-flex items-center justify-center p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all active:scale-95"
                      title="下载 M3U 文件"
                    >
                      <Download size={20} />
                    </a>
                    <button
                      onClick={() => handleDelete(playlist.id)}
                      className="inline-flex items-center justify-center p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-xl transition-all active:scale-95"
                      title="删除列表"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {playlists.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <FileText size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">暂无订阅列表</h3>
                <p className="text-slate-500 text-sm mb-6 px-4">导入您的第一个 M3U 直播源文件开始管理</p>
                <button
                  onClick={openImportModal}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                >
                  立即导入
                </button>
              </div>
            )}
          </div>
        )}

        <footer className="mt-20 text-center text-slate-400 text-xs">
          <p>© 2026 M3U 订阅管理器 • 轻量化直播源管理方案</p>
        </footer>

        {/* Import/Update Modal */}
        {showImport && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="px-8 py-6 border-b flex justify-between items-center bg-white shrink-0">
                <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                  {updatingId ? <RefreshCw className="text-blue-600" size={24} /> : <Plus className="text-blue-600" size={24} />}
                  {updatingId ? '更新/覆盖列表' : '导入新列表'}
                </h2>
                <button onClick={() => setShowImport(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                {!updatingId && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">列表名称</label>
                    <input
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm focus:bg-white"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="例如：家庭电视"
                    />
                  </div>
                )}
                {updatingId && (
                  <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-sm border border-amber-100 flex gap-3">
                    <RefreshCw size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">您正在更新: {name}</p>
                      <p className="mt-1 opacity-80 text-xs">注意：这将覆盖原有频道数据，但会保留您设置的分组排序。</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">方式一：从 URL 导入</label>
                    <div className="relative">
                      <Globe size={18} className="absolute left-4 top-4 text-slate-400" />
                      <input
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none transition-all text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="http://example.com/playlist.m3u"
                      />
                    </div>
                  </div>

                  <div className="relative flex items-center justify-center">
                    <span className="bg-white px-2 text-xs text-slate-300 font-bold uppercase relative z-10">OR</span>
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">方式二：上传文件</label>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-all group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {fileName ? (
                          <>
                            <FileText className="w-8 h-8 text-blue-500 mb-2" />
                            <p className="text-sm text-slate-700 font-medium">{fileName}</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-slate-300 group-hover:text-blue-500 transition-colors mb-2" />
                            <p className="text-xs text-slate-400 group-hover:text-blue-500">点击上传 M3U 文件</p>
                          </>
                        )}
                      </div>
                      <input type="file" className="hidden" onChange={handleFileChange} accept={ACCEPTED_FILE_TYPES} />
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button onClick={() => setShowImport(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all text-sm">取消</button>
                  <button
                    onClick={handleImportClick}
                    disabled={importing || (!url && !fileContent)}
                    className="bg-slate-900 text-white px-8 py-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 font-bold transition-all shadow-xl shadow-slate-200 active:scale-95 text-sm"
                  >
                    {importing ? '处理中...' : (updatingId ? '确认更新' : '开始导入')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rename Modal */}
        {showRename && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
                <h3 className="font-bold text-slate-800">重命名列表</h3>
                <button onClick={() => setShowRename(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <input
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                  value={showRename.name}
                  onChange={e => setShowRename({ ...showRename, name: e.target.value })}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowRename(null)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all text-sm">取消</button>
                  <button onClick={handleRename} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 text-sm">保存</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          isDangerous={confirmModal.isDangerous}
          onConfirm={confirmModal.onConfirm}
          onCancel={closeConfirm}
        />
      </div>
    </div>
  );
}
