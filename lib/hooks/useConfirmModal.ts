import { useState, useCallback } from 'react';

export interface ConfirmModalState {
    isOpen: boolean;
    title: string;
    message: string;
    isDangerous: boolean;
    onConfirm: () => void;
}

interface UseConfirmModalReturn {
    confirmModal: ConfirmModalState;
    showConfirm: (config: Omit<ConfirmModalState, 'isOpen'>) => void;
    closeConfirm: () => void;
}

/**
 * Custom hook for managing confirmation modal state
 */
export function useConfirmModal(): UseConfirmModalReturn {
    const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDangerous: false,
    });

    const showConfirm = useCallback((config: Omit<ConfirmModalState, 'isOpen'>) => {
        setConfirmModal({
            ...config,
            isOpen: true,
        });
    }, []);

    const closeConfirm = useCallback(() => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }, []);

    return { confirmModal, showConfirm, closeConfirm };
}
