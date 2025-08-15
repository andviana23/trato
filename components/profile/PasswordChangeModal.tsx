import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@/components/ui/chakra-adapters";
import PasswordChange from "./PasswordChange";

interface PasswordChangeModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ open, onClose, user }) => {
  return (
    <Modal isOpen={open} onOpenChange={(v: boolean) => !v && onClose()} size="sm" placement="center">
      <ModalContent>
        <ModalHeader className="text-lg font-bold">Alterar Senha</ModalHeader>
        <ModalBody>
          <PasswordChange user={user} />
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PasswordChangeModal; 

