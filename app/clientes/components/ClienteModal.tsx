"use client";
import React, { useEffect } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Textarea
} from "@/components/ui/chakra-adapters";
import { useForm } from "react-hook-form";
import { cadastrarCliente, atualizarCliente } from "@/lib/services/clients";

export default function ClienteModal({ open, onClose, onSuccess, cliente }: { open: boolean; onClose: () => void; onSuccess: () => void; cliente?: any }) {
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (cliente) {
      // Preenche o formulário com os dados do cliente para edição
      reset({
        nome: cliente.nome || "",
        email: cliente.email || "",
        telefone: cliente.telefone || "",
        cpf_cnpj: cliente.cpf_cnpj || "",
        endereco: cliente.endereco || "",
        data_nascimento: cliente.data_nascimento || "",
        observacoes: cliente.observacoes || "",
      });
    } else {
      reset();
    }
  }, [cliente, reset]);

  async function onSubmit(data: any) {
    try {
      const payload: any = {
        nome: data.nome,
        telefone: data.telefone,
      };
      if (data.email) payload.email = data.email;
      if (data.cpf_cnpj) payload.cpf_cnpj = data.cpf_cnpj;
      if (data.endereco) payload.endereco = data.endereco;
      if (data.observacoes) payload.observacoes = data.observacoes;
      if (data.data_nascimento && data.data_nascimento.length === 10) payload.data_nascimento = data.data_nascimento;
      if (cliente) {
        await atualizarCliente(cliente.id, payload);
      } else {
        await cadastrarCliente(payload);
      }
      onSuccess();
      reset();
    } catch (e: any) {
      console.error("Erro ao salvar cliente:", e);
      alert("Erro ao salvar cliente: " + JSON.stringify(e, null, 2));
    }
  }

  return (
    <Modal isOpen={open} onOpenChange={onClose} placement="center" size="lg">
      <ModalContent>
        <ModalHeader className="text-lg md:text-xl font-bold pb-0">{cliente ? "Editar Cliente" : "Cadastrar Cliente"}</ModalHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody className="space-y-3 md:space-y-4 py-2 md:py-4">
            <Input label="Nome completo" {...register("nome", { required: true })} isRequired errorMessage={errors.nome && "Nome obrigatório"} size="lg"/>
            <Input label="Email" {...register("email")} type="email" size="lg"/>
            <Input label="Telefone" {...register("telefone", { required: true })} isRequired errorMessage={errors.telefone && "Telefone obrigatório"} size="lg"/>
            <Input label="CPF/CNPJ" {...register("cpf_cnpj") } size="lg"/>
            <Input label="Endereço" {...register("endereco") } size="lg"/>
            <Input label="Data de nascimento" {...register("data_nascimento")} type="date" size="lg"/>
            <Textarea label="Observações" {...register("observacoes")} minRows={2} maxRows={4} size="lg"/>
          </ModalBody>
          <ModalFooter className="pt-0">
            <Button variant="light" onClick={onClose} size="lg">Cancelar</Button>
            <Button color="primary" type="submit" isLoading={isSubmitting} size="lg">Salvar</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
} 

