'use client';

import { useState } from 'react';
import { X, Plus, RefreshCw, Globe, FileText, Upload } from 'lucide-react';
import { API_ENDPOINTS, MESSAGES, ACCEPTED_FILE_TYPES } from '@/lib/constants';
import type { UpdatePlaylistRequest, ImportPlaylistRequest } from '@/types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** 如果提供，表示更新模式 */
  updateTarget?: { id: number; name: string; url?: string };
}

export function ImportModal({ isOpen, onClose, onSuccess, updateTarget }: ImportModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const isUpdate = !!updateTarget;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => setFileContent(ev.target?.result as string);
      reader.readAsText(file);
    }
  };

  const reset = () => {
    setName(''); setUrl(''); setFileContent(null); setFileName(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleImport = async () => {
    if (!isUpdate && !name) {
      alert(MESSAGES.ERROR.NO_NAME);
      return;
    }

    if (!url && !fileContent) return;

    setImporting(true);
    try {
      if (isUpdate) {
        const request: UpdatePlaylistRequest = { url, content: fileContent || undefined };
        const res = await fetch(API_ENDPOINTS.PLAYLIST(updateTarget!.id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });
        if (!res.ok) throw new Error('Update failed');
      } else {
        const request: ImportPlaylistRequest = { name, url, content: fileContent || undefined };
        const res = await fetch(API_ENDPOINTS.PLAYLISTS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });
        if (!res.ok) throw new Error('Import failed');
      }

      onSuccess();
      reset();
      onClose();
    } catch {
      alert(MESSAGES.ERROR.IMPORT_FAILED);
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            {isUpdate ? <RefreshCw className="text-blue-600" size={24} /> : <Plus className="text-blue-600" size={24} />}
            {isUpdate ? '更新/覆盖列表' : '导入新列表'}
          </h2>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          {isUpdate ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 rounded-xl text-sm border border-amber-100 dark:border-amber-800 flex gap-3">
              <RefreshCw size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">您正在更新: {updateTarget!.name}</p>
                <p className="mt-1 opacity-80 text-xs">注意：这将覆盖原有频道数据，但会保留您设置的分组排序。</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">列表名称</label>
              <input
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm focus:bg-white dark:focus:bg-slate-900"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="例如：家庭电视"
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">方式一：从 URL 导入</label>
              <div className="relative">
                <Globe size={18} className="absolute left-4 top-4 text-slate-400 dark:text-slate-500" />
                <input
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none transition-all text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-700 dark:text-slate-200"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="http://example.com/playlist.m3u"
                />
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <span className="bg-white dark:bg-slate-900 px-2 text-xs text-slate-300 dark:text-slate-600 font-bold uppercase relative z-10">OR</span>
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">方式二：上传文件</label>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-200 dark:border-slate-800 border-dashed rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-800 transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {fileName ? (
                    <>
                      <FileText className="w-8 h-8 text-blue-500 mb-2" />
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{fileName}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors mb-2" />
                      <p className="text-xs text-slate-400 dark:text-slate-500 group-hover:text-blue-500">点击上传 M3U 文件</p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" onChange={handleFileChange} accept={ACCEPTED_FILE_TYPES} />
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button onClick={handleClose} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all text-sm">取消</button>
            <button
              onClick={handleImport}
              disabled={importing || (!url && !fileContent)}
              className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 dark:hover:bg-slate-100 font-bold transition-all shadow-xl shadow-slate-200 dark:shadow-slate-950/30 active:scale-95 text-sm"
            >
              {importing ? '处理中...' : (isUpdate ? '确认更新' : '开始导入')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
