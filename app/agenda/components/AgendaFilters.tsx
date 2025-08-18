'use client';

import React from 'react';
import { Box, Flex, Select, Text, IconButton, Tooltip } from '@chakra-ui/react';
import { Filter, X } from 'lucide-react';

interface AgendaFiltersProps {
  filters: {
    status: string;
    professional: string;
    service: string;
  };
  onFiltersChange: (filters: { status: string; professional: string; service: string }) => void;
  resources: Array<{
    resourceId: string;
    resourceTitle: string;
    color: string;
  }>;
}

export function AgendaFilters({ filters, onFiltersChange, resources }: AgendaFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      professional: 'all',
      service: 'all',
    });
  };

  const hasActiveFilters = filters.status !== 'all' || filters.professional !== 'all' || filters.service !== 'all';

  return (
    <Flex align="center" gap={3}>
      {/* Filtro de Status */}
      <Box>
        <Text fontSize="xs" color="gray.500" mb={1}>
          Status
        </Text>
        <Select
          size="sm"
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          minW="120px"
        >
          <option value="all">Todos</option>
          <option value="agendado">Agendado</option>
          <option value="confirmado">Confirmado</option>
          <option value="atendido">Atendido</option>
          <option value="cancelado">Cancelado</option>
          <option value="no_show">Não Compareceu</option>
          <option value="bloqueado">Bloqueado</option>
        </Select>
      </Box>

      {/* Filtro de Profissional */}
      <Box>
        <Text fontSize="xs" color="gray.500" mb={1}>
          Profissional
        </Text>
        <Select
          size="sm"
          value={filters.professional}
          onChange={(e) => handleFilterChange('professional', e.target.value)}
          minW="140px"
        >
          <option value="all">Todos</option>
          {resources.map((resource) => (
            <option key={resource.resourceId} value={resource.resourceId}>
              {resource.resourceTitle}
            </option>
          ))}
        </Select>
      </Box>

      {/* Filtro de Serviço */}
      <Box>
        <Text fontSize="xs" color="gray.500" mb={1}>
          Serviço
        </Text>
        <Select
          size="sm"
          value={filters.service}
          onChange={(e) => handleFilterChange('service', e.target.value)}
          minW="140px"
        >
          <option value="all">Todos</option>
          <option value="corte">Corte</option>
          <option value="barba">Barba</option>
          <option value="corte_barba">Corte + Barba</option>
          <option value="tratamento">Tratamento</option>
          <option value="sobrancelha">Sobrancelha</option>
        </Select>
      </Box>

      {/* Botão para limpar filtros */}
      {hasActiveFilters && (
        <Tooltip label="Limpar filtros">
          <IconButton
            aria-label="Limpar filtros"
            icon={<X size={14} />}
            size="sm"
            variant="ghost"
            onClick={clearFilters}
            colorScheme="gray"
          />
        </Tooltip>
      )}

      {/* Indicador de filtros ativos */}
      {hasActiveFilters && (
        <Box
          bg="blue.100"
          color="blue.800"
          px={2}
          py={1}
          borderRadius="full"
          fontSize="xs"
          fontWeight="medium"
        >
          Filtros ativos
        </Box>
      )}
    </Flex>
  );
}
