import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Chip, Spinner } from '@nextui-org/react';
import { UserIcon, CreditCardIcon, CloudIcon, LinkIcon, XCircleIcon, ExclamationTriangleIcon, XMarkIcon, CalendarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
// Componente StatusBadge elegante
const StatusBadge = ({ status, vencimento }) => {
    var _a;
    const config = {
        'ATIVO': { bg: 'bg-green-100', text: 'text-green-800', label: 'Ativo' },
        'ACTIVE': { bg: 'bg-green-100', text: 'text-green-800', label: 'Ativo' },
        'PENDENTE': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
        'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
        'CANCELADA': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' },
        'CANCELLED': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' },
        'SUSPENSA': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Suspensa' },
        'SUSPENDED': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Suspensa' },
        'ATRASADO': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Atrasado' },
        'OVERDUE': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Atrasado' }
    };
    const upper = (_a = status === null || status === void 0 ? void 0 : status.toUpperCase) === null || _a === void 0 ? void 0 : _a.call(status);
    if (upper === 'CANCELADA' || upper === 'CANCELLED') {
        return (<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800`}>
        Cancelada, válido até {vencimento ? new Date(vencimento).toLocaleDateString('pt-BR') : '-'}
      </span>);
    }
    const { bg, text, label } = config[upper] || config['PENDENTE'];
    return (<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>);
};
// Componente para botão de cancelar assinatura
const BotaoCancelar = ({ assinante, onUpdate, onClose, statusAtual }) => {
    var _a, _b;
    const [loading, setLoading] = useState(false);
    const [confirmacao, setConfirmacao] = useState(false);
    // Só renderiza se não estiver cancelada
    const isCancelada = (((_a = statusAtual === null || statusAtual === void 0 ? void 0 : statusAtual.toUpperCase) === null || _a === void 0 ? void 0 : _a.call(statusAtual)) === 'CANCELADA' || ((_b = statusAtual === null || statusAtual === void 0 ? void 0 : statusAtual.toUpperCase) === null || _b === void 0 ? void 0 : _b.call(statusAtual)) === 'CANCELLED');
    if (isCancelada)
        return null;
    const handleCancelar = async () => {
        if (!confirmacao) {
            setConfirmacao(true);
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('/api/asaas/cancelar-assinatura', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId: assinante.asaas_subscription_id })
            });
            const result = await response.json();
            if (result.success) {
                toast.success('Assinatura cancelada com sucesso!');
                setConfirmacao(false);
                onUpdate === null || onUpdate === void 0 ? void 0 : onUpdate(); // Atualizar lista/tabela
                onClose(); // Fechar modal
            }
            else {
                toast.error(result.error || 'Erro ao cancelar assinatura');
            }
        }
        catch (error) {
            toast.error('Erro ao cancelar assinatura');
        }
        finally {
            setLoading(false);
        }
    };
    if (confirmacao) {
        return (<div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600"/>
          <span className="font-semibold text-red-800">Confirmar Cancelamento</span>
        </div>
        <p className="text-red-700 text-sm mb-3">
          Esta ação cancelará todos os pagamentos futuros desta assinatura. Não é possível desfazer.
        </p>
        <div className="flex gap-2">
          <button onClick={handleCancelar} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Spinner size="sm"/>}
            Sim, Cancelar
          </button>
          <button onClick={() => setConfirmacao(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-300">
            Cancelar
          </button>
        </div>
      </div>);
    }
    return (<button onClick={handleCancelar} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm">
      <XCircleIcon className="w-4 h-4"/>
      Cancelar Assinatura
    </button>);
};
// Componente para botão de link de pagamento
const BotaoLinkPagamento = ({ assinante }) => {
    const [loading, setLoading] = useState(false);
    const handleAbrirLink = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/asaas/link-pagamento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId: assinante.asaas_subscription_id })
            });
            const result = await response.json();
            if (result.success && result.linkPagamento) {
                window.open(result.linkPagamento, '_blank');
                toast.success('Link de pagamento aberto em nova aba');
            }
            else {
                toast.info(result.error || 'Nenhum pagamento pendente encontrado');
            }
        }
        catch (error) {
            toast.error('Erro ao obter link de pagamento');
        }
        finally {
            setLoading(false);
        }
    };
    return (<button onClick={handleAbrirLink} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm disabled:opacity-50">
      {loading ? (<Spinner size="sm"/>) : (<LinkIcon className="w-4 h-4"/>)}
      Link de Pagamento
    </button>);
};
export default function AssinanteDetalhesModal({ open, onClose, assinante, onCancelar, onConfirmarPagamento, confirmandoPagamento = false, cancelandoAssinatura = false, onUpdate }) {
    var _a, _b, _c, _d, _e;
    if (!assinante)
        return null;
    // Fallback para diferentes nomes de campos
    let nome = assinante.customerName || assinante.nome || 'Não informado';
    const email = assinante.customerEmail || assinante.email || 'Não informado';
    const telefone = assinante.telefone || assinante.mobilePhone || 'Não informado';
    const valor = Number((_c = (_b = (_a = assinante.plan_value) !== null && _a !== void 0 ? _a : assinante.value) !== null && _b !== void 0 ? _b : assinante.price) !== null && _c !== void 0 ? _c : 0).toFixed(2);
    const vencimento = assinante.nextDueDate || assinante.vencimento || assinante.current_period_end || assinante.plan_next_due_date || 'Não informado';
    const origem = assinante.source || assinante.payment_method || 'Não informado';
    const status = assinante.status || assinante.plan_status || 'Não informado';
    const plano = assinante.plan_name || assinante.plan || assinante.plano || assinante.description || 'Não informado';
    const createdAt = assinante.plan_created_at || assinante.created_at || 'Não informado';
    // Checar se é pagamento externo
    const isPagamentoExterno = origem === 'EXTERNAL' || origem === 'externo' || origem === 'EXTERNO';
    // Checar se é pagamento Asaas (tem IDs do Asaas)
    const isPagamentoAsaas = assinante.asaas_subscription_id && assinante.asaas_customer_id;
    // Se assinatura cancelada, exibir aviso no nome
    const isCancelada = (((_d = status === null || status === void 0 ? void 0 : status.toUpperCase) === null || _d === void 0 ? void 0 : _d.call(status)) === 'CANCELADA' || ((_e = status === null || status === void 0 ? void 0 : status.toUpperCase) === null || _e === void 0 ? void 0 : _e.call(status)) === 'CANCELLED');
    if (isCancelada) {
        nome = `Assinatura Cancelada. permitido agendar ate o dia: ${vencimento}`;
    }
    // Só habilita o botão de confirmar pagamento se hoje >= vencimento (apenas para pagamentos externos)
    const hoje = new Date();
    const dataVenc = vencimento && vencimento !== 'Não informado' ? new Date(vencimento) : null;
    const podeConfirmarPagamento = isPagamentoExterno &&
        dataVenc &&
        hoje >= new Date(dataVenc.getFullYear(), dataVenc.getMonth(), dataVenc.getDate());
    // Formatar data
    const formatarData = (data) => {
        if (data === 'Não informado')
            return data;
        try {
            return new Date(data).toLocaleDateString('pt-BR');
        }
        catch (_a) {
            return data;
        }
    };
    // Formatar valor
    const formatarValor = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(Number(valor));
    };
    return (<Modal isOpen={open} onOpenChange={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent className="max-w-4xl">
        {/* Header com gradiente */}
        <ModalHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6"/>
              </div>
              <div>
                <h2 className="text-xl font-bold">Detalhes da Assinatura</h2>
                <p className="text-blue-100 text-sm">{nome}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
              <XMarkIcon className="w-5 h-5"/>
            </button>
          </div>
        </ModalHeader>

        <ModalBody className="p-6 space-y-6">
          {/* Cards de informação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card Cliente */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-blue-600"/>
                </div>
                <h3 className="font-semibold text-gray-800">Informações do Cliente</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nome:</span>
                  <span className="font-medium">{nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Telefone:</span>
                  <span className="font-medium">{telefone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-xs break-all">{email}</span>
                </div>
              </div>
            </div>

            {/* Card Plano */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCardIcon className="w-4 h-4 text-green-600"/>
                </div>
                <h3 className="font-semibold text-gray-800">Detalhes do Plano</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plano:</span>
                  <span className="font-medium">{plano}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-bold text-green-600">{formatarValor(valor)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <StatusBadge status={status} vencimento={vencimento}/>
                </div>
              </div>
            </div>

          </div>

          {/* Card de Informações Adicionais */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-purple-600"/>
              </div>
              <h3 className="font-semibold text-gray-800">Informações de Pagamento</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Fonte:</span>
                <Chip size="sm" variant="flat" color={origem === 'ASAAS_TRATO' ? 'primary' :
            origem === 'ASAAS_ANDREY' ? 'success' :
                isPagamentoExterno ? 'secondary' : 'default'}>
                  {origem}
                </Chip>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Próx. Vencimento:</span>
                <span className="font-medium">{formatarData(vencimento)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Criado em:</span>
                <span className="font-medium">{formatarData(createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Seção de Opções Asaas */}
          {isPagamentoAsaas && (<div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CloudIcon className="w-4 h-4 text-blue-600"/>
                </div>
                <h3 className="font-semibold text-blue-800">Opções Asaas</h3>
              </div>
              <div className="flex gap-3">
                <BotaoLinkPagamento assinante={assinante}/>
                <BotaoCancelar assinante={assinante} onUpdate={onUpdate} onClose={onClose} statusAtual={status}/>
              </div>
            </div>)}

          {/* Seção de Pagamentos Externos */}
          {isPagamentoExterno && (<div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="w-4 h-4 text-orange-600"/>
                </div>
                <h3 className="font-semibold text-orange-800">Pagamento Externo</h3>
              </div>
              <div className="flex gap-3">
                <Button color="danger" variant="bordered" onPress={() => onCancelar(assinante)} isLoading={cancelandoAssinatura} startContent={<XCircleIcon className="w-4 h-4"/>}>
                  Cancelar Assinatura
                </Button>
                <Button color="primary" onPress={() => onConfirmarPagamento(assinante)} disabled={!podeConfirmarPagamento} isLoading={confirmandoPagamento} startContent={<CurrencyDollarIcon className="w-4 h-4"/>} title={!podeConfirmarPagamento
                ? 'Só pode confirmar no dia do vencimento ou depois.'
                : ''}>
                  Confirmar Pagamento
                </Button>
              </div>
            </div>)}

        </ModalBody>

        <ModalFooter className="border-t bg-gray-50 p-6">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-600">
              <span>Assinatura criada em: {formatarData(createdAt)}</span>
            </div>
            <Button variant="light" onPress={onClose}>
              Fechar
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>);
}
