'use client';

import { Channel } from '@/types';
import { Modal } from '../Modal';
import { ChannelForm } from './ChannelForm';

interface Props {
  isOpen: boolean;
  allGroups: string[];
  onClose: () => void;
  onAdd: (channel: Omit<Channel, 'id' | 'playlistId' | 'order' | 'createdAt' | 'updatedAt' | 'duration'>) => void;
}

export function AddChannelModal({ isOpen, allGroups, onClose, onAdd }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="添加新频道">
      <ChannelForm 
        allGroups={allGroups} 
        onSubmit={onAdd} 
        onCancel={onClose} 
        submitLabel="确认添加" 
      />
    </Modal>
  );
}
