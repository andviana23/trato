'use client';

import React, { useState, useMemo } from 'react';
import { Box, VStack, HStack, Text, Button, IconButton, Badge, Progress, useColorModeValue, useToast } from '@chakra-ui/react';
import { BarChart3, TrendingUp, Users, Clock, DollarSign, Calendar, RefreshCw, Plus, Eye } from 'lucide-react';
import { useUnidadeStore } from '@/lib/stores/useUnidadeStore';
import { useModal } from '@/lib/stores/useModalStore';

interface DashboardMobileViewProps {
  onRefresh: () => void;
  onAddWidget: () => void;
}

// Mock data - substituir por dados reais
const mockStats = {
  totalAppointments: 24,
  completedToday: 18,
  pendingToday: 6,
  totalRevenue: 1250.00,
  averageWaitTime: 15,
  clientsInQueue: 3,
  topServices: [
    { name: 'Corte + Barba', count: 8, revenue: 320.00 },
    { name: 'Corte', count: 6, revenue: 180.00 },
    { name: 'Design de Sobrancelha', count: 4, revenue: 120.00 },
  ],
  recentActivity: [
    { type: 'appointment', message: 'João Silva confirmou agendamento para 14:00', time: '2 min atrás' },
    { type: 'queue', message: 'Maria Santos entrou na fila', time: '5 min atrás' },
    { type: 'payment', message: 'Pedro Costa pagou R$ 45,00', time: '8 min atrás' },
  ],
};

export function DashboardMobileView({
  onRefresh,
  onAddWidget,
}: DashboardMobileViewProps) {
  const { unidade } = useUnidadeStore();
  const { showModal } = useModal();
  const toast = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const primaryColor = useColorModeValue('blue.500', 'blue.400');

  // Função para atualizar dados
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast({
        title: 'Dashboard atualizado',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Tente novamente em alguns instantes',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Função para mostrar detalhes dos serviços
  const showServicesDetails = () => {
    showModal({
      title: 'Serviços Mais Populares',
      content: (
        <VStack spacing={4} align="stretch">
          {mockStats.topServices.map((service, index) => (
            <Box
              key={index}
              p={3}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="md"
            >
              <HStack justify="space-between" align="center">
                <VStack align="flex-start" spacing={1}>
                  <Text fontWeight="medium">{service.name}</Text>
                  <Text fontSize="sm" color={mutedTextColor}>
                    {service.count} agendamentos
                  </Text>
                </VStack>
                <Text fontWeight="bold" color="green.500">
                  R$ {service.revenue.toFixed(2)}
                </Text>
              </HStack>
            </Box>
          ))}
        </VStack>
      ),
      size: 'md',
      actions: [
        {
          label: 'Ver Relatório Completo',
          variant: 'outline',
          onClick: () => {
            // Navegar para relatório de serviços
            showModal.close();
          },
        },
        {
          label: 'Fechar',
          variant: 'ghost',
          onClick: () => showModal.close(),
        },
      ],
    });
  };

  // Função para mostrar detalhes da fila
  const showQueueDetails = () => {
    showModal({
      title: 'Status da Fila',
      content: (
        <VStack spacing={4} align="stretch">
          <Box textAlign="center" p={4}>
            <Text fontSize="2xl" fontWeight="bold" color={primaryColor}>
              {mockStats.clientsInQueue}
            </Text>
            <Text fontSize="sm" color={mutedTextColor}>
              Clientes na fila
            </Text>
          </Box>
          
          <Box>
            <Text fontWeight="medium" mb={2}>Tempo médio de espera:</Text>
            <Text fontSize="lg" color="orange.500">
              {mockStats.averageWaitTime} minutos
            </Text>
          </Box>
          
          <Button
            colorScheme="blue"
            variant="outline"
            onClick={() => {
              // Navegar para página da fila
              showModal.close();
            }}
          >
            Gerenciar Fila
          </Button>
        </VStack>
      ),
      size: 'md',
      actions: [
        {
          label: 'Fechar',
          variant: 'ghost',
          onClick: () => showModal.close(),
        },
      ],
    });
  };

  // Função para mostrar atividade recente
  const showRecentActivity = () => {
    showModal({
      title: 'Atividade Recente',
      content: (
        <VStack spacing={3} align="stretch">
          {mockStats.recentActivity.map((activity, index) => (
            <Box
              key={index}
              p={3}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="md"
            >
              <HStack justify="space-between" align="flex-start">
                <VStack align="flex-start" spacing={1} flex={1}>
                  <Text fontSize="sm">{activity.message}</Text>
                  <Text fontSize="xs" color={mutedTextColor}>
                    {activity.time}
                  </Text>
                </VStack>
                <Badge
                  size="sm"
                  colorScheme={
                    activity.type === 'appointment' ? 'blue' :
                    activity.type === 'queue' ? 'orange' : 'green'
                  }
                >
                  {activity.type === 'appointment' ? 'Agendamento' :
                   activity.type === 'queue' ? 'Fila' : 'Pagamento'}
                </Badge>
              </HStack>
            </Box>
          ))}
        </VStack>
      ),
      size: 'md',
      actions: [
        {
          label: 'Ver Todas',
          variant: 'outline',
          onClick: () => {
            // Navegar para página de atividades
            showModal.close();
          },
        },
        {
          label: 'Fechar',
          variant: 'ghost',
          onClick: () => showModal.close(),
        },
      ],
    });
  };

  return (
    <Box className="desktop-hidden" p={4}>
      {/* Cabeçalho */}
      <Box
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={4}
        mb={4}
      >
        <HStack justify="space-between" align="center" mb={3}>
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="xl" fontWeight="bold" color={textColor}>
              Dashboard
            </Text>
            <Text fontSize="sm" color={mutedTextColor}>
              {unidade || 'Unidade não selecionada'}
            </Text>
          </VStack>
          
          <HStack spacing={2}>
            <IconButton
              aria-label="Atualizar dashboard"
              icon={<RefreshCw size={16} />}
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
            />
            <IconButton
              aria-label="Adicionar widget"
              icon={<Plus size={16} />}
              variant="ghost"
              size="sm"
              onClick={onAddWidget}
            />
          </HStack>
        </HStack>

        {/* Data e hora atual */}
        <Text fontSize="sm" color={mutedTextColor}>
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </Box>

      {/* KPIs principais */}
      <VStack spacing={4} align="stretch" mb={6}>
        {/* Agendamentos */}
        <Box
          bg={bgColor}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          p={4}
        >
          <HStack justify="space-between" align="center" mb={3}>
            <HStack spacing={2}>
              <Calendar size={20} color="#3b82f6" />
              <Text fontWeight="medium" color={textColor}>
                Agendamentos Hoje
              </Text>
            </HStack>
            <Badge colorScheme="blue" size="lg">
              {mockStats.totalAppointments}
            </Badge>
          </HStack>
          
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="sm" color={mutedTextColor}>
                Concluídos
              </Text>
              <Text fontSize="sm" fontWeight="medium" color="green.500">
                {mockStats.completedToday}
              </Text>
            </HStack>
            
            <HStack justify="space-between">
              <Text fontSize="sm" color={mutedTextColor}>
                Pendentes
              </Text>
              <Text fontSize="sm" fontWeight="medium" color="orange.500">
                {mockStats.pendingToday}
              </Text>
            </HStack>
            
            <Progress
              value={(mockStats.completedToday / mockStats.totalAppointments) * 100}
              colorScheme="green"
              size="sm"
              borderRadius="full"
            />
          </VStack>
        </Box>

        {/* Receita */}
        <Box
          bg={bgColor}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          p={4}
        >
          <HStack justify="space-between" align="center" mb={3}>
            <HStack spacing={2}>
              <DollarSign size={20} color="#22c55e" />
              <Text fontWeight="medium" color={textColor}>
                Receita Hoje
              </Text>
            </HStack>
            <Text fontSize="xl" fontWeight="bold" color="green.500">
              R$ {mockStats.totalRevenue.toFixed(2)}
            </Text>
          </HStack>
          
          <HStack spacing={2} align="center">
            <TrendingUp size={16} color="#22c55e" />
            <Text fontSize="sm" color="green.500">
              +12% em relação a ontem
            </Text>
          </HStack>
        </Box>

        {/* Fila de atendimento */}
        <Box
          bg={bgColor}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          p={4}
          cursor="pointer"
          onClick={showQueueDetails}
          _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
          transition="all 0.2s"
        >
          <HStack justify="space-between" align="center" mb={3}>
            <HStack spacing={2}>
              <Users size={20} color="#f59e0b" />
              <Text fontWeight="medium" color={textColor}>
                Fila de Atendimento
              </Text>
            </HStack>
            <Badge colorScheme="orange" size="lg">
              {mockStats.clientsInQueue}
            </Badge>
          </HStack>
          
          <HStack spacing={2} align="center">
            <Clock size={16} color="#f59e0b" />
            <Text fontSize="sm" color="orange.500">
              Tempo médio: {mockStats.averageWaitTime} min
            </Text>
          </HStack>
          
          <HStack justify="flex-end" mt={2}>
            <Text fontSize="xs" color={mutedTextColor}>
              Toque para ver detalhes
            </Text>
            <Eye size={14} color="#6b7280" />
          </HStack>
        </Box>
      </VStack>

      {/* Serviços populares */}
      <Box
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={4}
        mb={6}
        cursor="pointer"
        onClick={showServicesDetails}
        _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
        transition="all 0.2s"
      >
        <HStack justify="space-between" align="center" mb={4}>
          <HStack spacing={2}>
            <BarChart3 size={20} color="#8b5cf6" />
            <Text fontWeight="medium" color={textColor}>
              Serviços Mais Populares
            </Text>
          </HStack>
          <Eye size={16} color="#6b7280" />
        </HStack>
        
        <VStack spacing={3} align="stretch">
          {mockStats.topServices.slice(0, 3).map((service, index) => (
            <HStack key={index} justify="space-between" align="center">
              <VStack align="flex-start" spacing={1} flex={1}>
                <Text fontSize="sm" fontWeight="medium">
                  {service.name}
                </Text>
                <Text fontSize="xs" color={mutedTextColor}>
                  {service.count} agendamentos
                </Text>
              </VStack>
              <Text fontSize="sm" fontWeight="bold" color="green.500">
                R$ {service.revenue.toFixed(2)}
              </Text>
            </HStack>
          ))}
        </VStack>
      </Box>

      {/* Atividade recente */}
      <Box
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={4}
        cursor="pointer"
        onClick={showRecentActivity}
        _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
        transition="all 0.2s"
      >
        <HStack justify="space-between" align="center" mb={4}>
          <HStack spacing={2}>
            <Clock size={20} color="#06b6d4" />
            <Text fontWeight="medium" color={textColor}>
              Atividade Recente
            </Text>
          </HStack>
          <Eye size={16} color="#6b7280" />
        </HStack>
        
        <VStack spacing={3} align="stretch">
          {mockStats.recentActivity.slice(0, 2).map((activity, index) => (
            <HStack key={index} justify="space-between" align="flex-start">
              <VStack align="flex-start" spacing={1} flex={1}>
                <Text fontSize="sm" noOfLines={2}>
                  {activity.message}
                </Text>
                <Text fontSize="xs" color={mutedTextColor}>
                  {activity.time}
                </Text>
              </VStack>
              <Badge
                size="sm"
                colorScheme={
                  activity.type === 'appointment' ? 'blue' :
                  activity.type === 'queue' ? 'orange' : 'green'
                }
              >
                {activity.type === 'appointment' ? 'Agendamento' :
                 activity.type === 'queue' ? 'Fila' : 'Pagamento'}
              </Badge>
            </HStack>
          ))}
        </VStack>
        
        <HStack justify="flex-end" mt={3}>
          <Text fontSize="xs" color={mutedTextColor}>
            Toque para ver todas
          </Text>
        </HStack>
      </Box>

      {/* Ações rápidas */}
      <Box
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={4}
      >
        <Text fontWeight="medium" color={textColor} mb={3}>
          Ações Rápidas
        </Text>
        
        <VStack spacing={3} align="stretch">
          <Button
            leftIcon={<Plus size={16} />}
            colorScheme="blue"
            variant="solid"
            size="lg"
            onClick={() => {
              // Navegar para criar agendamento
            }}
          >
            Novo Agendamento
          </Button>
          
          <Button
            leftIcon={<Users size={16} />}
            variant="outline"
            size="lg"
            onClick={() => {
              // Navegar para fila
            }}
          >
            Gerenciar Fila
          </Button>
          
          <Button
            leftIcon={<BarChart3 size={16} />}
            variant="outline"
            size="lg"
            onClick={() => {
              // Navegar para relatórios
            }}
          >
            Ver Relatórios
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
