'use client';

import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = '确认', 
  cancelText = '取消', 
  isDangerous = false,
  onConfirm, 
  onCancel 
}: Props) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onCancel} 
      showCloseButton={false}
      maxWidth="max-w-sm"
      zIndex={100000}
    >
      <div className="p-8 text-center">
        <div className={`mx-auto w-16 h-16 rounded-3xl flex items-center justify-center mb-6 ${isDangerous ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          {message}
        </p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95 text-sm"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95 text-sm ${isDangerous ? 'bg-red-500 hover:bg-red-600 shadow-red-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
