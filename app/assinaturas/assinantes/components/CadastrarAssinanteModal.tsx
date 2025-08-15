"use client";
import React, { useState, useEffect, useRef } from "react";
import { getClientes } from "@/lib/services/clients";
import { getPlanos } from "@/lib/services/plans";
import { criarAssinatura } from "@/lib/services/subscriptions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import dayjs from 'dayjs';
import { supabase } from '@/lib/supabase/client';

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
  preco: number;
  descricao?: string;
  categoria?: string; // Adicionado para categorizar os planos
}

export default function CadastrarAssinanteModal({ open, onClose, onSuccess }: ModalProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [clienteBusca, setClienteBusca] = useState("");
  const [planoBusca, setPlanoBusca] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano | null>(null);
  const [, setShowClientes] = useState(false);
  const [, setShowPlanos] = useState(false);
  const [vencimento, setVencimento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("cartao");
  const [, setErro] = useState("");
  const [, setCarregando] = useState(false);
  
  // Estados para o modal de confirmação de pagamento externo
  const [, setShowConfirmacaoPagamento] = useState(false);
  const [, setConfirmandoPagamento] = useState(false);

  // Wizard multi-etapas
  const [etapa, setEtapa] = useState(1);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const [planosCategoria, setPlanosCategoria] = useState<Plano[]>([]);
  
  const [notificando, setNotificando] = useState(false);
  const [, setObservacao] = useState("");
  const [categorias, setCategorias] = useState<string[]>([]);

  // Adicione o estado para a data de cadastro
  const [dataCadastro, setDataCadastro] = useState<string>(dayjs().format('YYYY-MM-DD'));

  // Adicione estados para o mini-formulário de novo cliente
  const [showNovoCliente, setShowNovoCliente] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
  const [salvandoNovoCliente, setSalvandoNovoCliente] = useState(false);

  const planoInputRef = useRef<HTMLInputElement>(null);

  // Logar o array de planos completo ao carregar
  useEffect(() => {
    if (open) {
      getClientes().then(setClientes);
      getPlanos().then((planos) => {
        setPlanos(planos);
        setCategorias(Array.from(new Set(planos.map((p: any) => p.categoria).filter(Boolean))));
        console.log('planos carregados:', planos);
      });
      setClienteBusca("");
      setPlanoBusca("");
      setClienteSelecionado(null);
      setPlanoSelecionado(null);
      setVencimento("");
      setFormaPagamento("");
       setErro("");
       setShowConfirmacaoPagamento(false);
      setEtapa(1);
      setCategoriaSelecionada(null);
      setPlanosCategoria([]);
       setObservacao("");
      setDataCadastro(dayjs().format('YYYY-MM-DD'));
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

  // Adicionar log de debug no componente
  useEffect(() => {
    console.log('etapa:', etapa, 'formaPagamento:', formaPagamento, 'categoriaSelecionada:', categoriaSelecionada, 'planosCategoria:', planosCategoria);
  }, [etapa, formaPagamento, categoriaSelecionada, planosCategoria]);

  const hoje = new Date();
  const maxDate = new Date();
  maxDate.setDate(hoje.getDate() + 7);

  // Fluxo para cartão (mantido para integração futura se necessário)
  async function handleConfirmar() {}

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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErro("Erro ao cadastrar assinatura: " + msg);
      toast.error("Erro ao cadastrar assinante");
    } finally {
      setCarregando(false);
    }
  }

  async function handleConfirmarPagamentoExterno() {}

  

  

  // Ao selecionar cliente:
  const handleSelecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setEtapa(2); // Avança para forma de pagamento
  };

  // Ao selecionar categoria:
  function renderPasso2() {
    return (
      <div className="flex flex-col items-center gap-6">
        <h3 className="text-lg font-bold">Escolha a forma de pagamento:</h3>
        <div className="flex gap-6">
          <button onClick={() => { setFormaPagamento('link'); setEtapa(5); }} className="px-6 py-4 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-lg shadow transition-all">Link</button>
          <button onClick={() => { setFormaPagamento('dinheiro'); setEtapa(3); }} className="px-6 py-4 rounded-xl bg-green-100 hover:bg-green-200 text-green-700 font-semibold text-lg shadow transition-all">Dinheiro</button>
          <button onClick={() => { setFormaPagamento('pix'); setEtapa(3); }} className="px-6 py-4 rounded-xl bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-semibold text-lg shadow transition-all">PIX</button>
        </div>
        <button onClick={() => setEtapa(1)} className="mt-4 text-sm text-gray-500 hover:underline">Voltar</button>
      </div>
    );
  }

  // Passo 3: Seleção de plano
  function renderPasso3() {
    console.log('planosCategoria:', planosCategoria);
    return (
      <div className="flex flex-col items-center gap-6">
        <h3 className="text-lg font-bold">Selecione o plano:</h3>
        <div className="flex flex-wrap gap-4 justify-center">
          {planosCategoria.length === 0 ? (
            <span className="text-gray-400 text-sm">Nenhum plano encontrado para esta categoria.</span>
          ) : (
            planosCategoria.map(plano => (
              <button key={plano.id} onClick={() => { setPlanoSelecionado(plano); setEtapa(5); }} className={`px-6 py-4 rounded-xl border-2 font-semibold text-lg shadow transition-all ${planoSelecionado?.id === plano.id ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>
              <div>{plano.nome}</div>
              <div className="text-sm text-gray-500">{plano.descricao}</div>
              <div className="text-base font-bold mt-2">R$ {Number(plano.preco).toFixed(2)}</div>
            </button>
            ))
          )}
        </div>
        <button onClick={() => setEtapa(2)} className="mt-4 text-sm text-gray-500 hover:underline">Voltar</button>
      </div>
    );
  }

  // Passo 4: Confirmação e observação
  function _renderPasso4() {
    return (
      <div className="flex flex-col items-center gap-6">
        <h3 className="text-lg font-bold">Confirmação</h3>
        <div className="w-full max-w-xs bg-gray-50 rounded-xl p-4 shadow flex flex-col gap-2">
          <div><b>Forma de pagamento:</b> {formaPagamento === 'link' ? 'Link' : formaPagamento === 'pix' ? 'PIX' : 'Dinheiro'}</div>
          {(formaPagamento === 'dinheiro' || formaPagamento === 'pix') && planoSelecionado && (
            <>
              <div><b>Categoria:</b> {categoriaSelecionada}</div>
              <div><b>Plano:</b> {planoSelecionado.nome}</div>
              <div><b>Valor:</b> R$ {planoSelecionado.valor?.toFixed(2)}</div>
            </>
          )}
          <div className="text-sm text-gray-500 mt-2">Observação: <b>Aguardando pagamento</b></div>
        </div>
        <div className="flex gap-4 mt-4">
          <button onClick={() => setEtapa(formaPagamento === 'dinheiro' ? 3 : 1)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">Voltar</button>
          <button onClick={async () => {
            setNotificando(true);
            try {
              await criarAssinatura({
                // Adicione todos os campos obrigatórios
                cliente_id: clienteSelecionado?.id,
                plano_id: planoSelecionado?.id,
                plan_name: planoSelecionado?.nome,
                price: Number(planoSelecionado?.preco),
                status: 'AGUARDANDO_PAGAMENTO',
                observacao: 'Aguardando pagamento',
                categoria: categoriaSelecionada,
                forma_pagamento: formaPagamento
              });
              toast.success('Cliente adicionado com sucesso e aguardando pagamento!');
              onClose();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : JSON.stringify(err);
              toast.error('Erro ao adicionar assinante: ' + msg);
            } finally {
              setNotificando(false);
            }
          }} className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all" disabled={notificando}>
            {notificando ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    );
  }

  // Novo fluxo multi-etapas: 1) Seleção de cliente, 2) Forma de pagamento, 3) Categoria, 4) Plano, 5) Confirmação
  function renderPasso1Cliente() {
    const clientesFiltrados = clientes.filter((c) =>
      c.nome?.toLowerCase().includes(clienteBusca.toLowerCase()) ||
      c.email?.toLowerCase().includes(clienteBusca.toLowerCase()) ||
      c.telefone?.toLowerCase().includes(clienteBusca.toLowerCase())
    );
    return (
      <div className="flex flex-col items-center gap-6">
        <h3 className="text-lg font-bold">Selecione o cliente:</h3>
        <div className="flex w-72 gap-2 items-center">
          <input
            type="text"
            placeholder="Buscar cliente por nome, email ou telefone"
            value={clienteBusca}
            onChange={e => setClienteBusca(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            className="bg-green-500 hover:bg-green-600 text-white rounded px-3 py-2 font-bold text-lg flex items-center justify-center"
            title="Cadastrar novo cliente"
            onClick={() => setShowNovoCliente(v => !v)}
          >+
          </button>
        </div>
        {showNovoCliente && (
          <div className="w-72 bg-gray-50 border rounded p-4 flex flex-col gap-2 mt-2 animate-fade-in">
            <input
              type="text"
              placeholder="Nome do cliente"
              value={novoClienteNome}
              onChange={e => setNovoClienteNome(e.target.value)}
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Telefone"
              value={novoClienteTelefone}
              onChange={e => setNovoClienteTelefone(e.target.value)}
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 mt-2">
              <button
                className="bg-gray-200 text-gray-700 rounded px-3 py-1"
                onClick={() => setShowNovoCliente(false)}
              >Cancelar</button>
              <button
                className="bg-green-600 text-white rounded px-3 py-1 font-semibold"
                disabled={salvandoNovoCliente || !novoClienteNome || !novoClienteTelefone}
                onClick={async () => {
                  setSalvandoNovoCliente(true);
                  try {
                    // Salvar no Supabase
                    const { data, error } = await supabase
                      .from('clientes')
                      .insert({ nome: novoClienteNome, telefone: novoClienteTelefone })
                      .select();
                    if (error) throw error;
                    if (data && data[0]) {
                      setClientes([data[0], ...clientes]);
                      setClienteSelecionado(data[0]);
                      setShowNovoCliente(false);
                      setNovoClienteNome('');
                      setNovoClienteTelefone('');
                    }
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err);
                    toast.error('Erro ao cadastrar cliente: ' + msg);
                  } finally {
                    setSalvandoNovoCliente(false);
                  }
                }}
              >Salvar</button>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto w-full">
          {clientesFiltrados.map(cliente => (
            <button key={cliente.id} onClick={() => handleSelecionarCliente(cliente)} className={`px-4 py-2 rounded-lg border text-left ${clienteSelecionado?.id === cliente.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>{cliente.nome} {cliente.email && <span className="text-xs text-gray-400 ml-2">{cliente.email}</span>}</button>
          ))}
          {clientesFiltrados.length === 0 && <span className="text-gray-400 text-sm">Nenhum cliente encontrado</span>}
        </div>
      </div>
    );
  }

  // Novo passo: seleção de categoria
  function renderPassoCategoria() {
    return (
      <div className="flex flex-col items-center gap-6">
        <h3 className="text-lg font-bold">Selecione a categoria:</h3>
        <div className="flex flex-wrap gap-4 justify-center">
          {categorias.length === 0 ? (
            <span className="text-gray-400 text-sm">Nenhuma categoria cadastrada.</span>
          ) : (
            categorias.map(cat => (
              <button key={cat} onClick={() => {
                setCategoriaSelecionada(cat);
                setPlanosCategoria(planos.filter(p => (p.categoria || '').toLowerCase() === cat.toLowerCase()));
                setEtapa(4);
              }} className={`px-6 py-4 rounded-xl border-2 font-semibold text-lg shadow transition-all ${categoriaSelecionada === cat ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>{cat}</button>
            ))
          )}
        </div>
        <button onClick={() => setEtapa(2)} className="mt-4 text-sm text-gray-500 hover:underline">Voltar</button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar Assinante</DialogTitle>
        </DialogHeader>
        <div>
            {etapa === 1 && renderPasso1Cliente()}
            {etapa === 2 && renderPasso2()}
            {etapa === 3 && renderPassoCategoria()}
            {etapa === 4 && renderPasso3()}
            {etapa === 5 && (
              <div className="flex flex-col items-center gap-6">
                <h3 className="text-lg font-bold">Confirmação</h3>
                <div className="w-full max-w-xs bg-gray-50 rounded-xl p-4 shadow flex flex-col gap-2">
                  <div><b>Forma de pagamento:</b> {formaPagamento === 'link' ? 'Link' : formaPagamento === 'pix' ? 'PIX' : 'Dinheiro'}</div>
                  {(formaPagamento === 'dinheiro' || formaPagamento === 'pix') && planoSelecionado && (
                    <>
                      <div><b>Categoria:</b> {categoriaSelecionada}</div>
                      <div><b>Plano:</b> {planoSelecionado.nome}</div>
                      <div><b>Valor:</b> R$ {(planoSelecionado?.preco ?? planoSelecionado?.price ?? planoSelecionado?.valor ?? 0).toFixed(2)}</div>
                    </>
                  )}
                  <div className="flex flex-col gap-1 mt-2">
                    <label className="text-sm font-semibold">Data de cadastro:</label>
                    <input
                      type="date"
                      className="border rounded px-2 py-1"
                      value={dataCadastro}
                      min={dayjs().startOf('month').format('YYYY-MM-DD')}
                      max={dayjs().endOf('month').format('YYYY-MM-DD')}
                      onChange={e => setDataCadastro(e.target.value)}
                    />
                  </div>
                  <div className="text-sm text-gray-500 mt-2">Observação: <b>Aguardando pagamento</b></div>
                </div>
                <div className="flex gap-4 mt-4">
                  <button onClick={() => setEtapa(formaPagamento === 'dinheiro' ? 3 : 1)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">Voltar</button>
                  <button onClick={async () => {
                    setNotificando(true);
                    try {
                      let vencimentoISO = '';
                      if (formaPagamento === 'dinheiro' || formaPagamento === 'pix') {
                        const data = dayjs(dataCadastro);
                        vencimentoISO = data.add(1, 'month').format('YYYY-MM-DD');
                      } else {
                        vencimentoISO = vencimento;
                      }
                      await criarAssinatura({
                        cliente_id: clienteSelecionado?.id,
                        nome_cliente: clienteSelecionado?.nome,
                        plano_id: planoSelecionado?.id,
                        plan_name: planoSelecionado?.nome,
                        price: Number(planoSelecionado?.preco ?? planoSelecionado?.price ?? planoSelecionado?.valor ?? 0),
                        status: 'AGUARDANDO_PAGAMENTO',
                        observacao: 'Aguardando pagamento',
                        categoria: categoriaSelecionada,
                        forma_pagamento: formaPagamento,
                        data_cadastro: dataCadastro,
                        data_vencimento: vencimentoISO,
                      });
                      toast.success('Cliente adicionado com sucesso e aguardando pagamento!');
                      onClose();
                    } catch (err: any) {
                      const msg = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
                      toast.error('Erro ao adicionar assinante: ' + msg);
                    } finally {
                      setNotificando(false);
                    }
                  }} className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all" disabled={notificando}>
                    {notificando ? 'Salvando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
