"use client";

import { Input, Select, SelectItem, Button, Chip } from "@heroui/react";
import { MagnifyingGlassIcon, XMarkIcon, FunnelIcon } from "@heroicons/react/24/outline";

interface Filtros {
  nome: string;
  tipo: string;
  vencimento: string;
  ordenacao: string;
}

interface FiltrosAssinantesProps {
  filtros: Filtros;
  setFiltros: (filtros: Filtros) => void;
  limparFiltros: () => void;
  totalAssinantes: number;
  assinantesFiltrados: number;
}

export default function FiltrosAssinantes({ 
  filtros, 
  setFiltros, 
  limparFiltros, 
  totalAssinantes, 
  assinantesFiltrados 
}: FiltrosAssinantesProps) {
  
  const temFiltrosAtivos = filtros.nome || filtros.tipo || filtros.vencimento;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
        {/* Busca por Nome */}
        <div className="flex-1 min-w-0">
          <Input
            label="Buscar por nome, email ou telefone"
            placeholder="Digite para buscar..."
            value={filtros.nome}
            onChange={(e) => setFiltros({ ...filtros, nome: e.target.value })}
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
            className="w-full"
            size="sm"
          />
        </div>

        {/* Filtro por Tipo */}
        <div className="w-full lg:w-48">
          <Select
            label="Tipo de Pagamento"
            placeholder="Todos os tipos"
            selectedKeys={filtros.tipo ? [filtros.tipo] : []}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
            size="sm"
          >
            <SelectItem key="" value="">Todos os tipos</SelectItem>
            <SelectItem key="ASAAS_TRATO" value="ASAAS_TRATO">ASAAS Trato</SelectItem>
            <SelectItem key="ASAAS_ANDREY" value="ASAAS_ANDREY">ASAAS Andrey</SelectItem>
            <SelectItem key="EXTERNAL" value="EXTERNAL">Pagamento Externo</SelectItem>
          </Select>
        </div>

        {/* Filtro por Vencimento */}
        <div className="w-full lg:w-48">
          <Select
            label="Status de Vencimento"
            placeholder="Todos"
            selectedKeys={filtros.vencimento ? [filtros.vencimento] : []}
            onChange={(e) => setFiltros({ ...filtros, vencimento: e.target.value })}
            size="sm"
          >
            <SelectItem key="" value="">Todos</SelectItem>
            <SelectItem key="PROXIMOS_VENCER" value="PROXIMOS_VENCER">
              Próximos de Vencer (≤ 7 dias)
            </SelectItem>
            <SelectItem key="VENCIDO" value="VENCIDO">
              Vencidos
            </SelectItem>
            <SelectItem key="NOVOS_ASSINANTES" value="NOVOS_ASSINANTES">
              Novos (≤ 30 dias)
            </SelectItem>
            <SelectItem key="ATIVOS" value="ATIVOS">
              Ativos
            </SelectItem>
          </Select>
        </div>

        {/* Ordenação */}
        <div className="w-full lg:w-48">
          <Select
            label="Ordenar por"
            selectedKeys={[filtros.ordenacao]}
            onChange={(e) => setFiltros({ ...filtros, ordenacao: e.target.value })}
            size="sm"
          >
            <SelectItem key="NOME_ASC" value="NOME_ASC">Nome A-Z</SelectItem>
            <SelectItem key="NOME_DESC" value="NOME_DESC">Nome Z-A</SelectItem>
            <SelectItem key="VENCIMENTO_ASC" value="VENCIMENTO_ASC">Vencimento (próximo)</SelectItem>
            <SelectItem key="VENCIMENTO_DESC" value="VENCIMENTO_DESC">Vencimento (último)</SelectItem>
            <SelectItem key="CRIADO_DESC" value="CRIADO_DESC">Mais Recentes</SelectItem>
            <SelectItem key="CRIADO_ASC" value="CRIADO_ASC">Mais Antigos</SelectItem>
            <SelectItem key="VALOR_ASC" value="VALOR_ASC">Menor Valor</SelectItem>
            <SelectItem key="VALOR_DESC" value="VALOR_DESC">Maior Valor</SelectItem>
          </Select>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2">
          {temFiltrosAtivos && (
            <Button
              color="danger"
              variant="flat"
              size="sm"
              onPress={limparFiltros}
              startContent={<XMarkIcon className="w-4 h-4" />}
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Informações dos Filtros */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            Mostrando {assinantesFiltrados} de {totalAssinantes} assinantes
          </span>
        </div>
        
        {temFiltrosAtivos && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Filtros ativos:</span>
            {filtros.nome && (
              <Chip size="sm" variant="flat" color="primary">
                Nome: {filtros.nome}
              </Chip>
            )}
            {filtros.tipo && (
              <Chip size="sm" variant="flat" color="secondary">
                Tipo: {filtros.tipo.replace('_', ' ')}
              </Chip>
            )}
            {filtros.vencimento && (
              <Chip size="sm" variant="flat" color="warning">
                {filtros.vencimento === 'PROXIMOS_VENCER' && 'Próximos de Vencer'}
                {filtros.vencimento === 'VENCIDO' && 'Vencidos'}
                {filtros.vencimento === 'NOVOS_ASSINANTES' && 'Novos Assinantes'}
                {filtros.vencimento === 'ATIVOS' && 'Ativos'}
              </Chip>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 