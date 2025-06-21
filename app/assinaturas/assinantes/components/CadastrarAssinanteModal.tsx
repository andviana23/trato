"use client";
import React, { useState, useEffect, useRef } from "react";
import { getClientes } from "@/lib/services/clients";
import { getPlanos } from "@/lib/services/plans";
import { criarAssinatura } from "@/lib/services/subscriptions";
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Input, 
  RadioGroup, 
  Radio,
  Card,
  CardBody,
  Chip,
  Spinner,
  Divider
} from "@nextui-org/react";
import { 
  UserIcon, 
  CreditCardIcon, 
  BanknotesIcon, 
  CalendarIcon, 
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cpf_cnpj?: string;
}

interface Plano {
  id: string;
  nome: string;
  valor: number;
  descricao?: string;
}

export default function CadastrarAssinanteModal({ open, onClose, onSuccess }: ModalProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [clienteBusca, setClienteBusca] = useState("");
  const [planoBusca, setPlanoBusca] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano | null>(null);
  const [showClientes, setShowClientes] = useState(false);
  const [showPlanos, setShowPlanos] = useState(false);
  const [vencimento, setVencimento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("cartao");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  
  // Estados para o modal de confirmação de pagamento externo
  const [showConfirmacaoPagamento, setShowConfirmacaoPagamento] = useState(false);
  const [confirmandoPagamento, setConfirmandoPagamento] = useState(false);

  const clienteInputRef = useRef<HTMLInputElement>(null);
  const planoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      getClientes().then(setClientes);
      setPlanos([]);
      setClienteBusca("");
      setPlanoBusca("");
      setClienteSelecionado(null);
      setPlanoSelecionado(null);
      setVencimento("");
      setFormaPagamento("cartao");
      setErro("");
      setShowConfirmacaoPagamento(false);
    }
  }, [open]);

  // Busca planos só quando o cliente for selecionado
  useEffect(() => {
    if (clienteSelecionado) {
      getPlanos().then(setPlanos);
    } else {
      setPlanos([]);
      setPlanoSelecionado(null);
      setPlanoBusca("");
    }
  }, [clienteSelecionado]);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.cliente-dropdown') && !target.closest('.plano-dropdown')) {
        setShowClientes(false);
        setShowPlanos(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const clientesFiltrados = clientes.filter((c) => {
    const busca = clienteBusca.toLowerCase();
    return (
      c.nome?.toLowerCase().includes(busca) ||
      c.email?.toLowerCase().includes(busca) ||
      c.telefone?.toLowerCase().includes(busca)
    );
  });

  const planosFiltrados = planos.filter((p) =>
    p.nome?.toLowerCase().includes(planoBusca.toLowerCase())
  );

  const hoje = new Date();
  const maxDate = new Date();
  maxDate.setDate(hoje.getDate() + 7);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  async function handleConfirmar() {
    if (!clienteSelecionado || !planoSelecionado || !vencimento) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    if (formaPagamento === "externo") {
      // Abrir modal de confirmação de pagamento externo
      setShowConfirmacaoPagamento(true);
      return;
    }

    // Fluxo normal para cartão de crédito
    await processarAssinatura();
  }

  async function processarAssinatura() {
    setErro("");
    setCarregando(true);
    try {
      // Chamada para integração ASAAS
      const dadosCliente = {
        id: clienteSelecionado!.id,
        nome: clienteSelecionado!.nome,
        email: clienteSelecionado!.email,
        telefone: clienteSelecionado!.telefone,
        cpf_cnpj: clienteSelecionado!.cpf_cnpj || ""
      };
      const dadosPlano = {
        nome: planoSelecionado!.nome,
        valor: planoSelecionado!.valor,
        dataVencimento: vencimento,
        barbearia: "Barbearia Trato",
        desconto: 0
      };
      const res = await fetch("/api/asaas/assinaturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dadosCliente, dadosPlano })
      });
      const resultado = await res.json();
      if (resultado.success) {
        if (resultado.linkPagamento) {
          window.open(resultado.linkPagamento, '_blank');
        }
        toast.success("Assinante cadastrado com sucesso!", {
          description: resultado.linkPagamento ? (
            <a href={resultado.linkPagamento} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">Ver link de pagamento</a>
          ) : undefined
        });
        onClose();
        onSuccess?.();
      } else {
        setErro("Erro ao cadastrar assinatura: " + (resultado.error || ""));
        toast.error("Erro ao cadastrar assinatura");
      }
    } catch (e: any) {
      setErro("Erro ao cadastrar assinatura: " + (e.message || e));
      toast.error("Erro ao cadastrar assinante");
    } finally {
      setCarregando(false);
    }
  }

  async function handleConfirmarPagamentoExterno() {
    setConfirmandoPagamento(true);
    try {
      await criarAssinatura({
        cliente_id: clienteSelecionado!.id,
        plano_id: planoSelecionado!.id,
        plan_name: planoSelecionado!.nome,
        price: planoSelecionado!.valor,
        vencimento,
        forma_pagamento: "externo"
      });
      
      toast.success("Assinante cadastrado com sucesso! Pagamento externo confirmado.");
      setShowConfirmacaoPagamento(false);
      onClose();
      onSuccess?.();
    } catch (e: any) {
      setErro("Erro ao confirmar pagamento: " + (e.message || e));
      toast.error("Erro ao confirmar pagamento");
    } finally {
      setConfirmandoPagamento(false);
    }
  }

  const handleClienteSelect = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setClienteBusca(cliente.nome);
    setShowClientes(false);
    // Focar no próximo campo
    setTimeout(() => planoInputRef.current?.focus(), 100);
  };

  const handlePlanoSelect = (plano: any) => {
    setPlanoSelecionado({
      ...plano,
      valor: Number(plano.valor ?? plano.preco ?? plano.price ?? 0)
    });
    setPlanoBusca(plano.nome);
    setShowPlanos(false);
  };

  return (
    <>
      {/* Modal Principal - Cadastrar Assinante */}
      <Modal 
        isOpen={open} 
        onOpenChange={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Cadastrar Assinante
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Preencha os dados para cadastrar um novo assinante
            </p>
          </ModalHeader>
          
          <ModalBody className="space-y-6">
            {/* Cliente */}
            <div className="relative">
              <Input
                ref={clienteInputRef}
                label="Nome do Cliente"
                placeholder="Buscar cliente..."
                value={clienteBusca}
                onFocus={() => setShowClientes(true)}
                onChange={(e) => {
                  setClienteBusca(e.target.value);
                  setShowClientes(true);
                  setClienteSelecionado(null);
                }}
                startContent={<UserIcon className="w-4 h-4 text-gray-400" />}
                endContent={
                  clienteSelecionado && (
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  )
                }
                color={clienteSelecionado ? "success" : "default"}
                className="cliente-dropdown"
              />
              
              {/* Dropdown de Clientes */}
              {showClientes && (
                <div 
                  className="absolute top-full left-0 right-0 z-[9999] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto cliente-dropdown"
                  style={{ position: 'absolute', zIndex: 9999 }}
                >
                  {clientesFiltrados.length > 0 ? (
                    clientesFiltrados.map((cliente) => (
                      <div
                        key={cliente.id}
                        onClick={() => handleClienteSelect(cliente)}
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {cliente.nome}
                        </div>
                        {cliente.email && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {cliente.email}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                      {clienteBusca ? 'Nenhum cliente encontrado' : 'Digite para buscar clientes'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Plano */}
            <div className="relative">
              <Input
                ref={planoInputRef}
                label="Plano"
                placeholder={clienteSelecionado ? "Buscar plano..." : "Selecione um cliente primeiro"}
                value={planoBusca}
                disabled={!clienteSelecionado}
                onFocus={() => setShowPlanos(true)}
                onChange={(e) => {
                  setPlanoBusca(e.target.value);
                  setShowPlanos(true);
                  setPlanoSelecionado(null);
                }}
                startContent={<CreditCardIcon className="w-4 h-4 text-gray-400" />}
                endContent={
                  planoSelecionado && (
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  )
                }
                color={planoSelecionado ? "success" : "default"}
                className="plano-dropdown"
              />
              
              {/* Dropdown de Planos */}
              {showPlanos && clienteSelecionado && planosFiltrados.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto plano-dropdown">
                  {planosFiltrados.map((plano) => (
                    <div
                      key={plano.id}
                      onClick={() => handlePlanoSelect(plano)}
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {plano.nome}
                          </div>
                          {plano.descricao && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {plano.descricao}
                            </div>
                          )}
                        </div>
                        <Chip size="sm" color="primary" variant="flat">
                          {formatCurrency(plano.valor)}
                        </Chip>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Data do Vencimento */}
            <Input
              label="Data do Vencimento"
              type="date"
              value={vencimento}
              min={hoje.toISOString().split("T")[0]}
              max={maxDate.toISOString().split("T")[0]}
              onChange={(e) => setVencimento(e.target.value)}
              startContent={<CalendarIcon className="w-4 h-4 text-gray-400" />}
            />

            {/* Forma de Pagamento */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                Forma de Pagamento
              </label>
              <RadioGroup
                value={formaPagamento}
                onValueChange={setFormaPagamento}
                orientation="horizontal"
                classNames={{
                  wrapper: "gap-6"
                }}
              >
                <Radio value="cartao" description="Pagamento via cartão de crédito">
                  <div className="flex items-center gap-2">
                    <CreditCardIcon className="w-4 h-4" />
                    Cartão de Crédito
                  </div>
                </Radio>
                <Radio value="externo" description="Pagamento recebido externamente">
                  <div className="flex items-center gap-2">
                    <BanknotesIcon className="w-4 h-4" />
                    Pagamento Externo
                  </div>
                </Radio>
              </RadioGroup>
            </div>

            {/* Resumo da Seleção */}
            {(clienteSelecionado || planoSelecionado) && (
              <Card className="bg-gray-50 dark:bg-gray-800">
                <CardBody className="p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Resumo da Seleção</h4>
                  <div className="space-y-2 text-sm">
                    {clienteSelecionado && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Cliente:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{clienteSelecionado.nome}</span>
                      </div>
                    )}
                    {planoSelecionado && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Plano:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{planoSelecionado.nome}</span>
                      </div>
                    )}
                    {planoSelecionado && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Valor:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(planoSelecionado.valor)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Mensagem de Erro */}
            {erro && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-400 text-sm">{erro}</p>
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button 
              color="primary" 
              onPress={handleConfirmar}
              isLoading={carregando}
              disabled={!clienteSelecionado || !planoSelecionado || !vencimento}
            >
              {carregando ? "Salvando..." : "Confirmar"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Secundário - Confirmar Pagamento Externo */}
      <Modal 
        isOpen={showConfirmacaoPagamento} 
        onOpenChange={setShowConfirmacaoPagamento}
        size="md"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Confirmar Pagamento
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Confirme que o pagamento foi recebido
            </p>
          </ModalHeader>
          
          <ModalBody>
            <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <CardBody className="p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
                  Resumo do Assinante
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">Cliente:</span>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {clienteSelecionado?.nome}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">Plano:</span>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {planoSelecionado?.nome}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">Valor:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {planoSelecionado ? formatCurrency(planoSelecionado.valor) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">Vencimento:</span>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {vencimento}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                Confirmar que o pagamento foi recebido?
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                O cliente será marcado como "Assinatura Ativa" e adicionado à lista de Pagamentos Externos.
              </p>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button 
              variant="light" 
              onPress={() => setShowConfirmacaoPagamento(false)}
              disabled={confirmandoPagamento}
            >
              Cancelar
            </Button>
            <Button 
              color="success" 
              onPress={handleConfirmarPagamentoExterno}
              isLoading={confirmandoPagamento}
              startContent={<CheckCircleIcon className="w-4 h-4" />}
            >
              {confirmandoPagamento ? "Confirmando..." : "Confirmar Pagamento"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
} 
