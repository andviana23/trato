import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@nextui-org/react";
import PasswordChange from "./PasswordChange";
const PasswordChangeModal = ({ open, onClose, user }) => {
    return (<Modal isOpen={open} onClose={onClose} size="sm" placement="center">
      <ModalContent>
        <ModalHeader className="text-lg font-bold">Alterar Senha</ModalHeader>
        <ModalBody>
          <PasswordChange user={user}/>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onClick={onClose}>Fechar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>);
};
export default PasswordChangeModal;
