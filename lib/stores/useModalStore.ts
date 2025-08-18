import { create } from 'zustand';

export interface ModalConfig {
  id: string;
  title?: string;
  content: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'success' | 'warning';
}

interface ModalState {
  modals: ModalConfig[];
  activeModalId: string | null;
  addModal: (modal: ModalConfig) => void;
  removeModal: (id: string) => void;
  updateModal: (id: string, updates: Partial<ModalConfig>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  setActiveModal: (id: string | null) => void;
}

export const useModalStore = create<ModalState>((set, get) => ({
  modals: [],
  activeModalId: null,
  
  addModal: (modal) => {
    set((state) => ({
      modals: [...state.modals, modal],
      activeModalId: modal.id,
    }));
  },
  
  removeModal: (id) => {
    set((state) => ({
      modals: state.modals.filter((modal) => modal.id !== id),
      activeModalId: state.activeModalId === id ? null : state.activeModalId,
    }));
  },
  
  updateModal: (id, updates) => {
    set((state) => ({
      modals: state.modals.map((modal) =>
        modal.id === id ? { ...modal, ...updates } : modal
      ),
    }));
  },
  
  closeModal: (id) => {
    const modal = get().modals.find((m) => m.id === id);
    if (modal?.onClose) {
      modal.onClose();
    }
    get().removeModal(id);
  },
  
  closeAllModals: () => {
    set({ modals: [], activeModalId: null });
  },
  
  setActiveModal: (id) => {
    set({ activeModalId: id });
  },
}));

// Hook para facilitar o uso de modais
export const useModal = () => {
  const store = useModalStore();
  
  const showModal = (config: Omit<ModalConfig, 'id'>) => {
    const id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    store.addModal({ ...config, id });
    return id;
  };
  
  const showConfirmModal = (config: {
    title: string;
    content: React.ReactNode;
    onConfirm: () => void;
    onCancel?: () => void;
    variant?: 'danger' | 'success' | 'warning';
    confirmText?: string;
    cancelText?: string;
  }) => {
    return showModal({
      ...config,
      closable: true,
      onClose: config.onCancel,
      confirmText: config.confirmText || 'Confirmar',
      cancelText: config.cancelText || 'Cancelar',
    });
  };
  
  const showAlertModal = (config: {
    title: string;
    content: React.ReactNode;
    variant?: 'success' | 'warning' | 'error';
    onClose?: () => void;
  }) => {
    return showModal({
      ...config,
      closable: true,
      onClose: config.onClose,
      confirmText: 'OK',
    });
  };
  
  return {
    ...store,
    showModal,
    showConfirmModal,
    showAlertModal,
  };
};
