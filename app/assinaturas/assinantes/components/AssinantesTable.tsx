"use client";

import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button } from '@heroui/react';
import { useAssinantesData } from '../hooks/useAssinantesData';

export default function AssinantesTable() {
  const { allPayments, metrics } = useAssinantesData();
  const loading = metrics.asaasTrato.loading || metrics.asaasAndrey.loading || metrics.external.loading;

  return (
    <Table aria-label="Tabela de Assinantes">
      <TableHeader>
        <TableColumn>NOME</TableColumn>
        <TableColumn>EMAIL</TableColumn>
        <TableColumn>VALOR</TableColumn>
        <TableColumn>FONTE</TableColumn>
        <TableColumn>STATUS</TableColumn>
        <TableColumn>PRÓX. VENCIMENTO</TableColumn>
        <TableColumn>AÇÕES</TableColumn>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center">Carregando...</TableCell>
          </TableRow>
        ) : allPayments.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center">Nenhum assinante encontrado.</TableCell>
          </TableRow>
        ) : allPayments.map((assinante) => (
          <TableRow key={assinante.id}>
            <TableCell>{assinante.customerName}</TableCell>
            <TableCell>{assinante.customerEmail}</TableCell>
            <TableCell>R$ {assinante.value.toFixed(2)}</TableCell>
            <TableCell>
              <Chip
                size="sm"
                variant="flat"
                color={
                  assinante.source === 'ASAAS_TRATO' ? 'primary' :
                  assinante.source === 'ASAAS_ANDREY' ? 'success' : 'secondary'
                }
              >
                {assinante.source}
              </Chip>
            </TableCell>
            <TableCell>
              <Chip
                size="sm"
                variant="flat"
                color={assinante.status === 'ATIVO' ? 'success' : 'danger'}
              >
                {assinante.status}
              </Chip>
            </TableCell>
            <TableCell>{assinante.nextDueDate}</TableCell>
            <TableCell>
              <Button size="sm" variant="light">
                Ver Detalhes
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 