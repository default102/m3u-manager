'use client';

import React, { useState, useEffect } from 'react';
import { Playlist } from '@/types';
import { PlaylistProvider, usePlaylist } from '@/components/editor/PlaylistContext';
import { CategorySidebar } from '@/components/editor/CategorySidebar';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { ChannelList } from '@/components/editor/ChannelList';
import { EditChannelModal } from '@/components/editor/EditChannelModal';
import { AddChannelModal } from '@/components/editor/AddChannelModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { GlobalHeader } from '@/components/editor/GlobalHeader';

function EditorContent() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  const { 
    editingChannel, 
    allExistingGroupNames, 
    setEditingChannel, 
    handleUpdateChannel,
    confirmModal,
    closeConfirmModal,
    isAddingChannel,
    setIsAddingChannel,
    handleAddChannel
  } = usePlaylist();

  useEffect(() => {
    setMounted(true);
    // On mobile, show sidebar by default if no group is selected or as a starting point
    // Actually, let's keep it simple: if mobile, sidebar is full screen.
  }, []);

  if (!mounted) return <div className="h-full flex items-center justify-center text-slate-400">正在加载编辑器...</div>;

  return (
    <div className="flex h-full text-slate-900 overflow-hidden bg-white relative">
      {showSidebar && <CategorySidebar onSelect={() => setShowSidebar(false)} />}

      <div className={`flex-1 flex flex-col overflow-hidden bg-slate-50/30 ${showSidebar ? 'hidden md:flex' : 'flex'}`}>
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

      {isAddingChannel && (
        <AddChannelModal 
            allGroups={allExistingGroupNames} 
            onClose={() => setIsAddingChannel(false)} 
            onAdd={handleAddChannel} 
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
      <div className="h-screen flex flex-col bg-white overflow-hidden">
         <GlobalHeader playlistName={playlist.name} />
         <main className="flex-1 overflow-hidden relative">
            <EditorContent />
         </main>
      </div>
    </PlaylistProvider>
  );
}