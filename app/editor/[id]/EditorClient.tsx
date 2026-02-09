'use client';

import React, { useState, useEffect } from 'react';
import { Playlist } from '@/types';
import { PlaylistProvider, usePlaylist } from '@/components/editor/PlaylistContext';
import { CategorySidebar } from '@/components/editor/CategorySidebar';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { ChannelList } from '@/components/editor/ChannelList';
import { EditChannelModal } from '@/components/editor/EditChannelModal';
import { ConfirmModal } from '@/components/ConfirmModal';

function EditorContent() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  const { 
    editingChannel, 
    allExistingGroupNames, 
    setEditingChannel, 
    handleUpdateChannel,
    confirmModal,
    closeConfirmModal
  } = usePlaylist();

  useEffect(() => {
    setMounted(true);
    if (window.innerWidth < 768) setShowSidebar(false);
  }, []);

  if (!mounted) return <div className="h-full flex items-center justify-center text-slate-400">正在加载编辑器...</div>;

  return (
    <div className="flex h-full text-slate-900 overflow-hidden bg-white relative">
      {showSidebar && <CategorySidebar />}

      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">
         <EditorHeader showSidebar={showSidebar} onToggleSidebar={() => setShowSidebar(!showSidebar)} />
         <ChannelList />
      </div>

      {editingChannel && (
        <EditChannelModal 
            channel={editingChannel} 
            allGroups={allExistingGroupNames} 
            onClose={() => setEditingChannel(null)} 
            onUpdate={handleUpdateChannel} 
        />
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDangerous={confirmModal.isDangerous}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />
    </div>
  );
}

export default function EditorClient({ playlist }: { playlist: Playlist }) {
  return (
    <PlaylistProvider initialPlaylist={playlist}>
      <EditorContent />
    </PlaylistProvider>
  );
}