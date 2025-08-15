"use client";
import { DialogRoot, DialogContent, DialogHeader, DialogBody, DialogFooter, CloseButton } from "@chakra-ui/react";
import { ReactNode } from "react";

export interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  placement?: "left" | "right";
  footer?: ReactNode;
  children: ReactNode;
}

export default function AppDrawer({ isOpen, onClose, title, footer, children }: AppDrawerProps) {
  // Fallback com DialogRoot para compatibilidade total
  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => { if (!e.open) onClose(); }}>
      <DialogContent bg="bg.surface" borderWidth="1px" borderColor="border.default" rounded="none">
        <CloseButton position="absolute" right={3} top={3} onClick={onClose} />
        {title && <DialogHeader>{title}</DialogHeader>}
        <DialogBody>{children}</DialogBody>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </DialogRoot>
  );
}


