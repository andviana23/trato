'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useModalStore, type ModalConfig } from '@/lib/stores/useModalStore';

interface ModalProps {
  modal: ModalConfig;
  onClose: () => void;
}

const ModalComponent: React.FC<ModalProps> = ({ modal, onClose }) => {
  const { size = 'md', variant = 'default' } = modal;

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modal.closable !== false) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [modal.closable, onClose]);

  // Prevenir scroll do body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  const variantIcons = {
    default: Info,
    danger: AlertTriangle,
    success: CheckCircle,
    warning: AlertTriangle,
  };

  const variantColors = {
    default: 'text-blue-600',
    danger: 'text-red-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
  };

  const Icon = variantIcons[variant];

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && modal.closable !== false) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (modal.onConfirm) {
      modal.onConfirm();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div
        className={cn(
          'relative w-full bg-white dark:bg-neutral-800 rounded-lg shadow-xl',
          'border border-neutral-200 dark:border-neutral-700',
          sizeClasses[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(modal.title || modal.closable !== false) && (
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              {Icon && (
                <Icon className={cn('h-5 w-5', variantColors[variant])} />
              )}
              {modal.title && (
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {modal.title}
                </h2>
              )}
            </div>
            
            {modal.closable !== false && (
              <button
                onClick={onClose}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {modal.content}
        </div>
        
        {/* Footer */}
        {(modal.onConfirm || modal.onClose) && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-700">
            {modal.onClose && (
              <Button
                variant="outline"
                onClick={onClose}
                className="min-w-[80px]"
              >
                {modal.cancelText || 'Cancelar'}
              </Button>
            )}
            
            {modal.onConfirm && (
              <Button
                onClick={handleConfirm}
                variant={variant === 'danger' ? 'destructive' : 'default'}
                className="min-w-[80px]"
              >
                {modal.confirmText || 'Confirmar'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Componente principal que renderiza todos os modais
export const ModalContainer: React.FC = () => {
  const { modals, closeModal } = useModalStore();

  if (modals.length === 0) return null;

  return (
    <>
      {modals.map((modal) => (
        <ModalComponent
          key={modal.id}
          modal={modal}
          onClose={() => closeModal(modal.id)}
        />
      ))}
    </>
  );
};

// Hook para usar modais em componentes
export const useModalActions = () => {
  const { showModal, showConfirmModal, showAlertModal } = useModalStore();
  
  return {
    showModal,
    showConfirmModal,
    showAlertModal,
  };
};

export default ModalContainer;
