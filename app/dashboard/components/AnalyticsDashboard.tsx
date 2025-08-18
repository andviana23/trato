'use client';

import React, { useState, useEffect } from 'react';
import { Box, Grid, GridItem, VStack, HStack, Text, Button, IconButton, Tooltip, useToast } from '@chakra-ui/react';
import { Plus, Settings, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { KPICard } from './KPICard';
import { AppointmentHeatmap } from './AppointmentHeatmap';
import { RevenueChart } from './RevenueChart';
import { QueueMetrics } from './QueueMetrics';
import { ProfessionalPerformance } from './ProfessionalPerformance';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useModal } from '@/lib/stores/useModalStore';
import { useUnidadeStore } from '@/lib/stores/useUnidadeStore';

interface Widget {
  id: string;
  type: 'kpi' | 'chart' | 'heatmap' | 'metrics' | 'performance';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  config: any;
  isMinimized: boolean;
}

export function AnalyticsDashboard() {
  const { unidade } = useUnidadeStore();
  const { showModal } = useModal();
  const toast = useToast();
  
  // Estado dos widgets
  const [widgets, setWidgets] = useState<Widget[]>([
    {
      id: 'kpi-1',
      type: 'kpi',
      title: 'Agendamentos Hoje',
      size: 'small',
      position: { x: 0, y: 0 },
      config: { metric: 'appointments_today', color: 'blue' },
      isMinimized: false,
    },
    {
      id: 'kpi-2',
      type: 'kpi',
      title: 'Receita Mensal',
      size: 'small',
      position: { x: 1, y: 0 },
      config: { metric: 'monthly_revenue', color: 'green' },
      isMinimized: false,
    },
    {
      id: 'kpi-3',
      type: 'kpi',
      title: 'Clientes na Fila',
      size: 'small',
      position: { x: 2, y: 0 },
      config: { metric: 'queue_length', color: 'orange' },
      isMinimized: false,
    },
    {
      id: 'kpi-4',
      type: 'kpi',
      title: 'Taxa de Ocupação',
      size: 'small',
      position: { x: 3, y: 0 },
      config: { metric: 'occupancy_rate', color: 'purple' },
      isMinimized: false,
    },
    {
      id: 'heatmap-1',
      type: 'heatmap',
      title: 'Heatmap de Agendamentos',
      size: 'large',
      position: { x: 0, y: 1 },
      config: { period: 'month', unidadeId: unidade },
      isMinimized: false,
    },
    {
      id: 'chart-1',
      type: 'chart',
      title: 'Receita por Período',
      size: 'medium',
      position: { x: 2, y: 1 },
      config: { type: 'revenue', period: 'month', unidadeId: unidade },
      isMinimized: false,
    },
    {
      id: 'metrics-1',
      type: 'metrics',
      title: 'Métricas da Fila',
      size: 'medium',
      position: { x: 0, y: 3 },
      config: { unidadeId: unidade },
      isMinimized: false,
    },
    {
      id: 'performance-1',
      type: 'performance',
      title: 'Performance dos Profissionais',
      size: 'large',
      position: { x: 2, y: 3 },
      config: { unidadeId: unidade, period: 'month' },
      isMinimized: false,
    },
  ]);
  
  // WebSocket para atualizações em tempo real
  const { isConnected, lastMessage } = useWebSocket('/api/analytics/ws');
  
  // Atualizar dados quando receber mensagem do WebSocket
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        
        // Atualizar widgets baseado no tipo de mensagem
        switch (data.type) {
          case 'appointment_update':
            // Atualizar KPIs relacionados a agendamentos
            updateWidgetData('kpi-1', data.value);
            break;
          case 'revenue_update':
            // Atualizar KPIs relacionados a receita
            updateWidgetData('kpi-2', data.value);
            break;
          case 'queue_update':
            // Atualizar KPIs relacionados à fila
            updateWidgetData('kpi-3', data.value);
            break;
          case 'occupancy_update':
            // Atualizar taxa de ocupação
            updateWidgetData('kpi-4', data.value);
            break;
        }
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    }
  }, [lastMessage]);
  
  // Função para atualizar dados de um widget
  const updateWidgetData = (widgetId: string, data: any) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, config: { ...widget.config, data } }
        : widget
    ));
  };
  
  // Função para adicionar novo widget
  const handleAddWidget = () => {
    showModal({
      title: 'Adicionar Widget',
      content: (
        <Box>
          <Text>Selecione o tipo de widget para adicionar:</Text>
          <VStack spacing={3} mt={4}>
            <Button
              w="full"
              onClick={() => {
                // Adicionar widget KPI
                const newWidget: Widget = {
                  id: `kpi-${Date.now()}`,
                  type: 'kpi',
                  title: 'Novo KPI',
                  size: 'small',
                  position: { x: 0, y: widgets.length },
                  config: { metric: 'custom', color: 'blue' },
                  isMinimized: false,
                };
                setWidgets(prev => [...prev, newWidget]);
                // Fechar modal
              }}
            >
              KPI Card
            </Button>
            <Button
              w="full"
              onClick={() => {
                // Adicionar widget de gráfico
                const newWidget: Widget = {
                  id: `chart-${Date.now()}`,
                  type: 'chart',
                  title: 'Novo Gráfico',
                  size: 'medium',
                  position: { x: 0, y: widgets.length },
                  config: { type: 'custom', period: 'month' },
                  isMinimized: false,
                };
                setWidgets(prev => [...prev, newWidget]);
                // Fechar modal
              }}
            >
              Gráfico
            </Button>
            <Button
              w="full"
              onClick={() => {
                // Adicionar widget de heatmap
                const newWidget: Widget = {
                  id: `heatmap-${Date.now()}`,
                  type: 'heatmap',
                  title: 'Novo Heatmap',
                  size: 'large',
                  position: { x: 0, y: widgets.length },
                  config: { period: 'month' },
                  isMinimized: false,
                };
                setWidgets(prev => [...prev, newWidget]);
                // Fechar modal
              }}
            >
              Heatmap
            </Button>
          </VStack>
        </Box>
      ),
      size: 'md',
    });
  };
  
  // Função para remover widget
  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== widgetId));
    toast({
      title: 'Widget removido',
      description: 'O widget foi removido do dashboard',
      status: 'info',
      duration: 3000,
    });
  };
  
  // Função para minimizar/maximizar widget
  const handleToggleWidget = (widgetId: string) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, isMinimized: !widget.isMinimized }
        : widget
    ));
  };
  
  // Função para atualizar todos os widgets
  const handleRefreshAll = () => {
    toast({
      title: 'Atualizando dados',
      description: 'Todos os widgets estão sendo atualizados',
      status: 'info',
      duration: 2000,
    });
    
    // Forçar atualização de todos os widgets
    setWidgets(prev => [...prev]);
  };
  
  // Função para renderizar widget baseado no tipo
  const renderWidget = (widget: Widget) => {
    if (widget.isMinimized) {
      return (
        <Box
          key={widget.id}
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          p={3}
          cursor="pointer"
          onClick={() => handleToggleWidget(widget.id)}
          _hover={{ bg: "gray.50" }}
        >
          <HStack justify="space-between">
            <Text fontSize="sm" fontWeight="medium" color="gray.600">
              {widget.title}
            </Text>
            <IconButton
              icon={<Maximize2 size={16} />}
              size="sm"
              variant="ghost"
              aria-label="Expandir widget"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleWidget(widget.id);
              }}
            />
          </HStack>
        </Box>
      );
    }
    
    const commonProps = {
      key: widget.id,
      title: widget.title,
      onRemove: () => handleRemoveWidget(widget.id),
      onMinimize: () => handleToggleWidget(widget.id),
      size: widget.size,
    };
    
    switch (widget.type) {
      case 'kpi':
        return (
          <KPICard
            {...commonProps}
            metric={widget.config.metric}
            color={widget.config.color}
            data={widget.config.data}
          />
        );
      
      case 'heatmap':
        return (
          <AppointmentHeatmap
            {...commonProps}
            period={widget.config.period}
            unidadeId={widget.config.unidadeId}
          />
        );
      
      case 'chart':
        return (
          <RevenueChart
            {...commonProps}
            type={widget.config.type}
            period={widget.config.period}
            unidadeId={widget.config.unidadeId}
          />
        );
      
      case 'metrics':
        return (
          <QueueMetrics
            {...commonProps}
            unidadeId={widget.config.unidadeId}
          />
        );
      
      case 'performance':
        return (
          <ProfessionalPerformance
            {...commonProps}
            unidadeId={widget.config.unidadeId}
            period={widget.config.period}
          />
        );
      
      default:
        return null;
    }
  };
  
  // Calcular grid baseado no tamanho dos widgets
  const getGridSize = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small':
        return { cols: 1, rows: 1 };
      case 'medium':
        return { cols: 2, rows: 1 };
      case 'large':
        return { cols: 4, rows: 2 };
      default:
        return { cols: 1, rows: 1 };
    }
  };
  
  if (!unidade) {
    return (
      <Box p={8} textAlign="center">
        <Text color="gray.500">Selecione uma unidade para visualizar o dashboard</Text>
      </Box>
    );
  }
  
  return (
    <Box p={6}>
      {/* Cabeçalho do Dashboard */}
      <Box
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        p={4}
        mb={6}
        borderRadius="lg"
      >
        <HStack justify="space-between" align="center">
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              Dashboard Analytics
            </Text>
            <Text fontSize="sm" color="gray.600">
              {unidade} - Métricas e insights em tempo real
            </Text>
          </VStack>
          
          <HStack spacing={3}>
            {/* Status da conexão WebSocket */}
            <HStack spacing={2}>
              <Box
                w={3}
                h={3}
                borderRadius="full"
                bg={isConnected ? "green.500" : "red.500"}
              />
              <Text fontSize="xs" color="gray.500">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </Text>
            </HStack>
            
            <Button
              leftIcon={<RefreshCw size={16} />}
              variant="outline"
              onClick={handleRefreshAll}
              size="sm"
            >
              Atualizar
            </Button>
            
            <Button
              leftIcon={<Plus size={16} />}
              colorScheme="blue"
              onClick={handleAddWidget}
              size="sm"
            >
              Adicionar Widget
            </Button>
            
            <Tooltip label="Configurações do Dashboard">
              <IconButton
                icon={<Settings size={16} />}
                variant="ghost"
                size="sm"
                aria-label="Configurações"
                onClick={() => {
                  // Implementar configurações do dashboard
                  console.log('Abrir configurações');
                }}
              />
            </Tooltip>
          </HStack>
        </HStack>
      </Box>
      
      {/* Grid de Widgets */}
      <Grid
        templateColumns="repeat(12, 1fr)"
        gap={6}
        autoRows="minmax(200px, auto)"
      >
        {widgets.map((widget) => {
          const gridSize = getGridSize(widget.size);
          
          return (
            <GridItem
              key={widget.id}
              colSpan={gridSize.cols}
              rowSpan={gridSize.rows}
            >
              {renderWidget(widget)}
            </GridItem>
          );
        })}
      </Grid>
      
      {/* Indicador de widgets vazios */}
      {widgets.length === 0 && (
        <Box
          textAlign="center"
          py={16}
          bg="gray.50"
          borderRadius="lg"
          border="2px dashed"
          borderColor="gray.300"
        >
          <Text fontSize="lg" color="gray.500" mb={4}>
            Nenhum widget configurado
          </Text>
          <Text fontSize="sm" color="gray.400" mb={6}>
            Adicione widgets para começar a visualizar suas métricas
          </Text>
          <Button
            leftIcon={<Plus size={16} />}
            colorScheme="blue"
            onClick={handleAddWidget}
            size="lg"
          >
            Adicionar Primeiro Widget
          </Button>
        </Box>
      )}
    </Box>
  );
}
