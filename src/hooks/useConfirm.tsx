"use client";
import React, { useCallback, useMemo, useState } from "react";
import ConfirmDialog, { type ConfirmTone } from "@/components/ui/ConfirmDialog";

export interface ConfirmOptions {
  title: string;
  message?: string;
  tone?: ConfirmTone;
  confirmText?: string;
  cancelText?: string;
}

export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    setOpts(options);
    setOpen(true);
    return new Promise<boolean>((resolve) => setResolver(() => resolve));
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    resolver?.(true);
    setResolver(null);
  }, [resolver]);

  const handleCancel = useCallback(() => {
    setOpen(false);
    resolver?.(false);
    setResolver(null);
  }, [resolver]);

  const DialogPortal = useMemo(() => {
    return function DialogPortal() {
      if (!open || !opts) return null;
      return (
        <ConfirmDialog
          isOpen={open}
          title={opts.title}
          message={opts.message}
          tone={opts.tone}
          confirmText={opts.confirmText}
          cancelText={opts.cancelText}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      );
    };
  }, [open, opts, handleConfirm, handleCancel]);

  return { confirm, DialogPortal } as const;
}


