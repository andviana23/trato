'use client';

import React from 'react';
import { Box, HStack, VStack, Text, Stat, StatLabel, StatNumber, StatHelpText, Icon, Progress, Badge } from '@chakra-ui/react';
import { Users, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { QueueStats as QueueStatsType } from '@/app/actions/queue';

interface QueueStatsProps {
  stats: QueueStatsType;
}

export function QueueStats({ stats }: QueueStatsProps) {
  // Calcular tempo médio de espera
  const getAverageWaitTime = () => {
    if (!stats.averageWaitTime) return 'N/A';
    
    const minutes = Math.round(stats.averageWaitTime);
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    }
  };
  
  // Calcular tempo estimado de conclusão
  const getEstimatedCompletionTime = () => {
    if (!stats.estimatedCompletionTime) return 'N/A';
    
    const date = new Date(stats.estimatedCompletionTime);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Calcular taxa de ocupação
  const getOccupancyRate = () => {
    if (!stats.occupancyRate) return 0;
    return Math.round(stats.occupancyRate * 100);
  };
  
  // Obter cor da taxa de ocupação
  const getOccupancyColor = (rate: number) => {
    if (rate < 50) return 'green';
    if (rate < 80) return 'yellow';
    return 'red';
  };
  
  return (
    <HStack spacing={8} justify="space-between" align="flex-start">
      {/* Total de clientes na fila */}
      <Stat>
        <StatLabel color="gray.600" fontSize="sm">
          <HStack spacing={1}>
            <Icon as={Users} boxSize={4} />
            <Text>Total na Fila</Text>
          </HStack>
        </StatLabel>
        <StatNumber color="blue.600" fontSize="3xl" fontWeight="bold">
          {stats.totalInQueue}
        </StatNumber>
        <StatHelpText color="gray.500">
          Clientes aguardando atendimento
        </StatHelpText>
      </Stat>
      
      {/* Clientes atendidos hoje */}
      <Stat>
        <StatLabel color="gray.600" fontSize="sm">
          <HStack spacing={1}>
            <Icon as={CheckCircle} boxSize={4} />
            <Text>Atendidos Hoje</Text>
          </HStack>
        </StatLabel>
        <StatNumber color="green.600" fontSize="3xl" fontWeight="bold">
          {stats.totalServedToday}
        </StatNumber>
        <StatHelpText color="gray.500">
          Desde o início do dia
        </StatHelpText>
      </Stat>
      
      {/* Tempo médio de espera */}
      <Stat>
        <StatLabel color="gray.600" fontSize="sm">
          <HStack spacing={1}>
            <Icon as={Clock} boxSize={4} />
            <Text>Tempo Médio</Text>
          </HStack>
        </StatLabel>
        <StatNumber color="orange.600" fontSize="3xl" fontWeight="bold">
          {getAverageWaitTime()}
        </StatNumber>
        <StatHelpText color="gray.500">
          Tempo médio de espera
        </StatHelpText>
      </Stat>
      
      {/* Tempo estimado de conclusão */}
      <Stat>
        <StatLabel color="gray.600" fontSize="sm">
          <HStack spacing={1}>
            <Icon as={TrendingUp} boxSize={4} />
            <Text>Conclusão</Text>
          </HStack>
        </StatLabel>
        <StatNumber color="purple.600" fontSize="3xl" fontWeight="bold">
          {getEstimatedCompletionTime()}
        </StatNumber>
        <StatHelpText color="gray.500">
          Horário estimado de conclusão
        </StatHelpText>
      </Stat>
      
      {/* Taxa de ocupação */}
      <Stat>
        <StatLabel color="gray.600" fontSize="sm">
          <HStack spacing={1}>
            <Icon as={AlertTriangle} boxSize={4} />
            <Text>Ocupação</Text>
          </HStack>
        </StatLabel>
        <StatNumber color={getOccupancyColor(getOccupancyRate())} fontSize="3xl" fontWeight="bold">
          {getOccupancyRate()}%
        </StatNumber>
        <StatHelpText color="gray.500">
          Taxa de ocupação atual
        </StatHelpText>
        
        {/* Barra de progresso da ocupação */}
        <Box mt={2}>
          <Progress
            value={getOccupancyRate()}
            colorScheme={getOccupancyColor(getOccupancyRate())}
            size="sm"
            borderRadius="full"
          />
        </Box>
      </Stat>
      
      {/* Breakdown por status */}
      <VStack align="flex-start" spacing={2} minW="200px">
        <Text fontSize="sm" fontWeight="semibold" color="gray.700">
          Status da Fila
        </Text>
        
        <VStack spacing={2} align="stretch" w="full">
          {/* Aguardando */}
          <HStack justify="space-between">
            <Text fontSize="xs" color="gray.600">
              Aguardando
            </Text>
            <Badge colorScheme="blue" variant="subtle" fontSize="xs">
              {stats.statusBreakdown.aguardando || 0}
            </Badge>
          </HStack>
          
          {/* Chamado */}
          <HStack justify="space-between">
            <Text fontSize="xs" color="gray.600">
              Chamado
            </Text>
            <Badge colorScheme="orange" variant="subtle" fontSize="xs">
              {stats.statusBreakdown.chamado || 0}
            </Badge>
          </HStack>
          
          {/* Em atendimento */}
          <HStack justify="space-between">
            <Text fontSize="xs" color="gray.600">
              Em Atendimento
            </Text>
            <Badge colorScheme="green" variant="subtle" fontSize="xs">
              {stats.statusBreakdown.em_atendimento || 0}
            </Badge>
          </HStack>
        </VStack>
      </VStack>
    </HStack>
  );
}
