"use client";
import { DialogRoot, DialogBody, DialogContent, DialogFooter, DialogHeader, Button, Text } from "@chakra-ui/react";
import { useRef } from "react";

export type ConfirmTone = "destructive" | "warning" | "neutral";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  tone?: ConfirmTone;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  tone = "destructive",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  const confirmVariant =
    tone === "destructive" ? "solid"
      : tone === "warning" ? "accent"
      : "brand";

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => { if (!e.open) onCancel(); }}>
      <DialogContent bg="bg.surface" borderWidth="1px" borderColor="border.default" rounded="xl" boxShadow="elevation">
        <DialogHeader>{title}</DialogHeader>
        <DialogBody>
          <Text color="text.muted">{message}</Text>
        </DialogBody>
        <DialogFooter>
          <Button ref={cancelRef} variant="outline" onClick={onCancel}>{cancelText}</Button>
          <Button ml={3} onClick={onConfirm} variant={confirmVariant as any}>{confirmText}</Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}


