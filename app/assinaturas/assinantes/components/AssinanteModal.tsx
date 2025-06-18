// Função para decidir status visual no modal
const getStatusModal = (assinante: any) => {
  const status = (assinante.status || '').toUpperCase();
  const vencimento = assinante.nextDueDate;
  const diasParaVencer = getDiasParaVencer(vencimento);
  if ((status === 'CANCELADA' || status === 'CANCELLED') && diasParaVencer !== null && diasParaVencer >= 0) {
    return {
      color: 'warning',
      label: `Cancelada, válido até ${formatarData(vencimento)}`,
    };
  }
  if ((status === 'CANCELADA' || status === 'CANCELLED' || status === 'INACTIVE' || status === 'INATIVO') && diasParaVencer !== null && diasParaVencer < 0) {
    return {
      color: 'danger',
      label: 'Cancelada',
    };
  }
  if (status === 'ATIVO' || status === 'ACTIVE') {
    return { color: 'success', label: 'Ativo' };
  }
  if (status === 'PENDENTE' || status === 'PENDING') {
    return { color: 'warning', label: 'Pendente' };
  }
  if (status === 'ATRASADO' || status === 'OVERDUE') {
    return { color: 'danger', label: 'Atrasado' };
  }
  return { color: 'default', label: status };
}; 