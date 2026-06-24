'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { API_ENDPOINTS, MESSAGES } from '@/lib/constants';
import type { RenamePlaylistRequest } from '@/types';

interface RenameModalProps {
  isOpen: boolean;
  playlistId: number;
  currentName: string;
  onClose: () => void;
  onRenamed: (newName: string) => void;
}

export function RenameModal({ isOpen, playlistId, currentName, onClose, onRenamed }: RenameModalProps) {
  const [name, setName] = useState(currentName);

  // Sync name when opening with different playlist
  if (isOpen && name !== currentName) {
    // Use a microtask to avoid setState during render
    queueMicrotask(() => setName(currentName));
  }

  const handleRename = async () => {
    if (!name.trim()) return;
    try {
      const request: RenamePlaylistRequest = { name };
      const res = await fetch(API_ENDPOINTS.PLAYLIST(playlistId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (res.ok) {
        onRenamed(name);
        onClose();
      }
    } catch {
      alert(MESSAGES.ERROR.RENAME_FAILED);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">重命名列表</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <input
            className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-sm">取消</button>
            <button onClick={handleRename} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 text-sm">保存</button>
          </div>
        </div>
      </div>
    </div>
  );
}
