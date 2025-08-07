"use client";
import React, { useState, useEffect, useRef } from "react";
import { getClientes } from "@/lib/services/clients";
import { getPlanos } from "@/lib/services/plans";
import { criarAssinatura } from "@/lib/services/subscriptions";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@nextui-org/react";
import { toast } from "sonner";
import dayjs from 'dayjs';
export default function CadastrarAssinanteModal({ open, onClose, onSuccess }) {
    const [clientes, setClientes] = useState([]);
    const [planos, setPlanos] = useState([]);
    const [clienteBusca, setClienteBusca] = useState("");
    const [planoBusca, setPlanoBusca] = useState("");
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [planoSelecionado, setPlanoSelecionado] = useState(null);
    const [showClientes, setShowClientes] = useState(false);
    const [showPlanos, setShowPlanos] = useState(false);
    const [vencimento, setVencimento] = useState("");
    const [formaPagamento, setFormaPagamento] = useState("cartao");
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);
    // Estados para o modal de confirmação de pagamento externo
    const [showConfirmacaoPagamento, setShowConfirmacaoPagamento] = useState(false);
    const [confirmandoPagamento, setConfirmandoPagamento] = useState(false);
    // Wizard multi-etapas
    const [etapa, setEtapa] = useState(1);
    const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
    const [planosCategoria, setPlanosCategoria] = useState([]);
    const [observacao, setObservacao] = useState('');
    const [notificando, setNotificando] = useState(false);
    const [categorias, setCategorias] = useState([]);
    const clienteInputRef = useRef(null);
    const planoInputRef = useRef(null);
    // Logar o array de planos completo ao carregar
    useEffect(() => {
        if (open) {
            getClientes().then(setClientes);
            getPlanos().then((planos) => {
                setPlanos(planos);
                setCategorias(Array.from(new Set(planos.map((p) => p.categoria).filter(Boolean))));
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
        }
    }, [open]);
    // Busca planos só quando o cliente for selecionado
    useEffect(() => {
        if (clienteSelecionado) {
            getPlanos().then(setPlanos);
        }
        else {
            setPlanos([]);
            setPlanoSelecionado(null);
            setPlanoBusca("");
        }
    }, [clienteSelecionado]);
    // Fechar dropdowns ao clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            const target = event.target;
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
    const clientesFiltrados = clientes.filter((c) => {
        var _a, _b, _c;
        const busca = clienteBusca.toLowerCase();
        return (((_a = c.nome) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(busca)) ||
            ((_b = c.email) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(busca)) ||
            ((_c = c.telefone) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(busca)));
    });
    const planosFiltrados = planos.filter((p) => { var _a; return (_a = p.nome) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(planoBusca.toLowerCase()); });
    const hoje = new Date();
    const maxDate = new Date();
    maxDate.setDate(hoje.getDate() + 7);
    const formatCurrency = (value) => {
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
                id: clienteSelecionado.id,
                nome: clienteSelecionado.nome,
                email: clienteSelecionado.email,
                telefone: clienteSelecionado.telefone,
                cpf_cnpj: clienteSelecionado.cpf_cnpj || ""
            };
            const dadosPlano = {
                nome: planoSelecionado.nome,
                valor: planoSelecionado.valor,
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
                    description: resultado.linkPagamento ? (<a href={resultado.linkPagamento} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">Ver link de pagamento</a>) : undefined
                });
                onClose();
                onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess();
            }
            else {
                setErro("Erro ao cadastrar assinatura: " + (resultado.error || ""));
                toast.error("Erro ao cadastrar assinatura");
            }
        }
        catch (e) {
            setErro("Erro ao cadastrar assinatura: " + (e.message || e));
            toast.error("Erro ao cadastrar assinante");
        }
        finally {
            setCarregando(false);
        }
    }
    async function handleConfirmarPagamentoExterno() {
        setConfirmandoPagamento(true);
        try {
            await criarAssinatura({
                cliente_id: clienteSelecionado.id,
                plano_id: planoSelecionado.id,
                plan_name: planoSelecionado.nome,
                price: planoSelecionado.valor,
                vencimento,
                forma_pagamento: "externo"
            });
            toast.success("Assinante cadastrado com sucesso! Pagamento externo confirmado.");
            setShowConfirmacaoPagamento(false);
            onClose();
            onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess();
        }
        catch (e) {
            setErro("Erro ao confirmar pagamento: " + (e.message || e));
            toast.error("Erro ao confirmar pagamento");
        }
        finally {
            setConfirmandoPagamento(false);
        }
    }
    const handleClienteSelect = (cliente) => {
        setClienteSelecionado(cliente);
        setClienteBusca(cliente.nome);
        setShowClientes(false);
        // Focar no próximo campo
        setTimeout(() => { var _a; return (_a = planoInputRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }, 100);
    };
    const handlePlanoSelect = (plano) => {
        var _a, _b, _c;
        setPlanoSelecionado(Object.assign(Object.assign({}, plano), { valor: Number((_c = (_b = (_a = plano.valor) !== null && _a !== void 0 ? _a : plano.preco) !== null && _b !== void 0 ? _b : plano.price) !== null && _c !== void 0 ? _c : 0) }));
        setPlanoBusca(plano.nome);
        setShowPlanos(false);
    };
    // Ao selecionar cliente:
    const handleSelecionarCliente = (cliente) => {
        setClienteSelecionado(cliente);
        setEtapa(2); // Avança para forma de pagamento
    };
    // Ao selecionar categoria:
    function renderPasso2() {
        return (<div className="flex flex-col items-center gap-6">
        <h3 className="text-lg font-bold">Escolha a forma de pagamento:</h3>
        <div className="flex gap-6">
          <button onClick={() => { setFormaPagamento('link'); setEtapa(5); }} className="px-6 py-4 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-lg shadow transition-all">Link</button>
          <button onClick={() => { setFormaPagamento('dinheiro'); setEtapa(3); }} className="px-6 py-4 rounded-xl bg-green-100 hover:bg-green-200 text-green-700 font-semibold text-lg shadow transition-all">Dinheiro</button>
        </div>
        <button onClick={() => setEtapa(1)} className="mt-4 text-sm text-gray-500 hover:underline">Voltar</button>
      </div>);
    }
    // Passo 3: Seleção de plano
    function renderPasso3() {
        console.log('planosCategoria:', planosCategoria);
        return (<div className="flex flex-col items-center gap-6">
        <h3 className="text-lg font-bold">Selecione o plano:</h3>
        <div className="flex flex-wrap gap-4 justify-center">
          {planosCategoria.length === 0 ? (<span className="text-gray-400 text-sm">Nenhum plano encontrado para esta categoria.</span>) : (planosCategoria.map(plano => (<button key={plano.id} onClick={() => { setPlanoSelecionado(plano); setEtapa(5); }} className={`px-6 py-4 rounded-xl border-2 font-semibold text-lg shadow transition-all ${(planoSelecionado === null || planoSelecionado === void 0 ? void 0 : planoSelecionado.id) === plano.id ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>
              <div>{plano.nome}</div>
              <div className="text-sm text-gray-500">{plano.descricao}</div>
              <div className="text-base font-bold mt-2">R$ {Number(plano.preco).toFixed(2)}</div>
            </button>)))}
        </div>
        <button onClick={() => setEtapa(2)} className="mt-4 text-sm text-gray-500 hover:underline">Voltar</button>
      </div>);
    }
    // Passo 4: Confirmação e observação
    function renderPasso4() {
        var _a;
        return (<div className="flex flex-col items-center gap-6">
        <h3 className="text-lg font-bold">Confirmação</h3>
        <div className="w-full max-w-xs bg-gray-50 rounded-xl p-4 shadow flex flex-col gap-2">
          <div><b>Forma de pagamento:</b> {formaPagamento === 'link' ? 'Link' : 'Dinheiro'}</div>
          {formaPagamento === 'dinheiro' && planoSelecionado && (<>
              <div><b>Categoria:</b> {categoriaSelecionada}</div>
              <div><b>Plano:</b> {planoSelecionado.nome}</div>
              <div><b>Valor:</b> R$ {(_a = planoSelecionado.valor) === null || _a === void 0 ? void 0 : _a.toFixed(2)}</div>
            </>)}
          <div className="text-sm text-gray-500 mt-2">Observação: <b>Aguardando pagamento</b></div>
        </div>
        <div className="flex gap-4 mt-4">
          <button onClick={() => setEtapa(formaPagamento === 'dinheiro' ? 3 : 1)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">Voltar</button>
          <button onClick={async () => {
                setNotificando(true);
                try {
                    await criarAssinatura({
                        // Adicione todos os campos obrigatórios
                        cliente_id: clienteSelecionado === null || clienteSelecionado === void 0 ? void 0 : clienteSelecionado.id,
                        plano_id: planoSelecionado === null || planoSelecionado === void 0 ? void 0 : planoSelecionado.id,
                        plan_name: planoSelecionado === null || planoSelecionado === void 0 ? void 0 : planoSelecionado.nome,
                        price: Number(planoSelecionado === null || planoSelecionado === void 0 ? void 0 : planoSelecionado.preco),
                        status: 'AGUARDANDO_PAGAMENTO',
                        observacao: 'Aguardando pagamento',
                        categoria: categoriaSelecionada,
                        forma_pagamento: formaPagamento
                    });
                    toast.success('Cliente adicionado com sucesso e aguardando pagamento!');
                    onClose();
                }
                catch (err) {
                    const msg = (err === null || err === void 0 ? void 0 : err.message) || (typeof err === 'string' ? err : JSON.stringify(err));
                    toast.error('Erro ao adicionar assinante: ' + msg);
                }
                finally {
                    setNotificando(false);
                }
            }} className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all" disabled={notificando}>
            {notificando ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>);
    }
    // Novo fluxo multi-etapas: 1) Seleção de cliente, 2) Forma de pagamento, 3) Categoria, 4) Plano, 5) Confirmação
    function renderPasso1Cliente() {
        const clientesFiltrados = clientes.filter((c) => {
            var _a, _b, _c;
            return ((_a = c.nome) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(clienteBusca.toLowerCase())) ||
                ((_b = c.email) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(clienteBusca.toLowerCase())) ||
                ((_c = c.telefone) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(clienteBusca.toLowerCase()));
        });
        return (<div className="flex flex-col items-center gap-6">
        <h3 className="text-lg font-bold">Selecione o cliente:</h3>
        <input type="text" placeholder="Buscar cliente por nome, email ou telefone" value={clienteBusca} onChange={e => setClienteBusca(e.target.value)} className="w-72 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto w-full">
          {clientesFiltrados.map(cliente => (<button key={cliente.id} onClick={() => handleSelecionarCliente(cliente)} className={`px-4 py-2 rounded-lg border text-left ${(clienteSelecionado === null || clienteSelecionado === void 0 ? void 0 : clienteSelecionado.id) === cliente.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>{cliente.nome} {cliente.email && <span className="text-xs text-gray-400 ml-2">{cliente.email}</span>}</button>))}
          {clientesFiltrados.length === 0 && <span className="text-gray-400 text-sm">Nenhum cliente encontrado</span>}
        </div>
      </div>);
    }
    // Novo passo: seleção de categoria
    function renderPassoCategoria() {
        return (<div className="flex flex-col items-center gap-6">
        <h3 className="text-lg font-bold">Selecione a categoria:</h3>
        <div className="flex flex-wrap gap-4 justify-center">
          {categorias.length === 0 ? (<span className="text-gray-400 text-sm">Nenhuma categoria cadastrada.</span>) : (categorias.map(cat => (<button key={cat} onClick={() => {
                    setCategoriaSelecionada(cat);
                    setPlanosCategoria(planos.filter(p => (p.categoria || '').toLowerCase() === cat.toLowerCase()));
                    setEtapa(4);
                }} className={`px-6 py-4 rounded-xl border-2 font-semibold text-lg shadow transition-all ${categoriaSelecionada === cat ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>{cat}</button>)))}
        </div>
        <button onClick={() => setEtapa(2)} className="mt-4 text-sm text-gray-500 hover:underline">Voltar</button>
      </div>);
    }
    return (<Modal isOpen={open} onClose={onClose} placement="top-center">
      <ModalContent>
        {(onClose) => {
            var _a;
            return (<>
            <ModalHeader className="flex flex-col gap-1">Cadastrar Assinante</ModalHeader>
            <ModalBody>
              {etapa === 1 && renderPasso1Cliente()}
              {etapa === 2 && renderPasso2()}
              {etapa === 3 && renderPassoCategoria()}
              {etapa === 4 && renderPasso3()}
              {etapa === 5 && (<div className="flex flex-col items-center gap-6">
                  <h3 className="text-lg font-bold">Confirmação</h3>
                  <div className="w-full max-w-xs bg-gray-50 rounded-xl p-4 shadow flex flex-col gap-2">
                    <div><b>Forma de pagamento:</b> {formaPagamento === 'link' ? 'Link' : 'Dinheiro'}</div>
                    {formaPagamento === 'dinheiro' && planoSelecionado && (<>
                        <div><b>Categoria:</b> {categoriaSelecionada}</div>
                        <div><b>Plano:</b> {planoSelecionado.nome}</div>
                        <div><b>Valor:</b> R$ {(_a = planoSelecionado.valor) === null || _a === void 0 ? void 0 : _a.toFixed(2)}</div>
                      </>)}
                    <div className="text-sm text-gray-500 mt-2">Observação: <b>Aguardando pagamento</b></div>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <button onClick={() => setEtapa(formaPagamento === 'dinheiro' ? 3 : 1)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">Voltar</button>
                    <button onClick={async () => {
                        setNotificando(true);
                        try {
                            const dataPagamento = dayjs();
                            const dataVencimento = dataPagamento.add(30, 'day').format('YYYY-MM-DD');
                            await criarAssinatura({
                                // Adicione todos os campos obrigatórios
                                cliente_id: clienteSelecionado === null || clienteSelecionado === void 0 ? void 0 : clienteSelecionado.id,
                                nome_cliente: clienteSelecionado === null || clienteSelecionado === void 0 ? void 0 : clienteSelecionado.nome,
                                plano_id: planoSelecionado === null || planoSelecionado === void 0 ? void 0 : planoSelecionado.id,
                                plan_name: planoSelecionado === null || planoSelecionado === void 0 ? void 0 : planoSelecionado.nome,
                                price: Number(planoSelecionado === null || planoSelecionado === void 0 ? void 0 : planoSelecionado.preco),
                                status: 'AGUARDANDO_PAGAMENTO',
                                observacao: 'Aguardando pagamento',
                                categoria: categoriaSelecionada,
                                forma_pagamento: formaPagamento,
                                data_vencimento: dataVencimento
                            });
                            toast.success('Cliente adicionado com sucesso e aguardando pagamento!');
                            onClose();
                        }
                        catch (err) {
                            const msg = (err === null || err === void 0 ? void 0 : err.message) || (typeof err === 'string' ? err : JSON.stringify(err));
                            toast.error('Erro ao adicionar assinante: ' + msg);
                        }
                        finally {
                            setNotificando(false);
                        }
                    }} className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all" disabled={notificando}>
                      {notificando ? 'Salvando...' : 'Confirmar'}
                    </button>
                  </div>
                </div>)}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="flat" onPress={onClose}>
                Fechar
              </Button>
            </ModalFooter>
          </>);
        }}
      </ModalContent>
    </Modal>);
}
