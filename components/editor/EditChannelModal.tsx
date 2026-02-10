'use client';

import { Channel } from '@/types';
import { Modal } from '../Modal';
import { ChannelForm } from './ChannelForm';

interface Props {
  isOpen: boolean;
  channel: Channel;
  allGroups: string[];
  onClose: () => void;
  onUpdate: (updatedChannel: Channel) => void;
}

export function EditChannelModal({ isOpen, channel, allGroups, onClose, onUpdate }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="频道设置">
      <ChannelForm 
        initialData={channel}
        allGroups={allGroups} 
        onSubmit={(data) => onUpdate({ ...channel, ...data })} 
        onCancel={onClose} 
        submitLabel="保存更改" 
      />
    </Modal>
  );
}