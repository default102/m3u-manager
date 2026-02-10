'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
  zIndex?: number;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  header,
  footer,
  children, 
  maxWidth = 'max-w-lg',
  showCloseButton = true,
  zIndex = 9999
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in"
      style={{ zIndex }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className={`bg-white rounded-[2rem] shadow-2xl w-full ${maxWidth} overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {header ? header : (title || showCloseButton) && (
          <div className="px-8 py-6 border-b flex justify-between items-center bg-white shrink-0">
            {title ? (
              <h3 className="text-xl font-extrabold text-slate-800">{title}</h3>
            ) : <div />}
            {showCloseButton && (
              <button 
                onClick={onClose} 
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t bg-slate-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
