"use client";
import { DialogRoot, DialogContent, DialogHeader, DialogBody, DialogFooter, CloseButton } from "@chakra-ui/react";
import { ReactNode, useEffect, useRef } from "react";

export interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  initialFocusRef?: React.RefObject<any>;
  children: ReactNode;
  footer?: ReactNode;
  closeOnOverlayClick?: boolean;
}

export default function AppModal({
  isOpen,
  onClose,
  title,
  size = "md",
  initialFocusRef,
  children,
  footer,
  closeOnOverlayClick = true,
}: AppModalProps) {
  const fallbackRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!initialFocusRef?.current && fallbackRef.current) {
      fallbackRef.current.focus();
    }
  }, [isOpen, initialFocusRef]);

  // Chakra v3 namespace: usa Dialog* no lugar de Modal*
  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => { if (!e.open) onClose(); }}>
      <DialogContent bg="bg.surface" borderWidth="1px" borderColor="border.default" rounded="xl" boxShadow="elevation">
        {title && <DialogHeader>{title}</DialogHeader>}
        <CloseButton ref={fallbackRef} position="absolute" right={3} top={3} onClick={onClose} />
        <DialogBody>{children}</DialogBody>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </DialogRoot>
  );
}


