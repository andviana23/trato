'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, VStack, HStack, Text, IconButton, Select, Tooltip, Spinner } from '@chakra-ui/react';
import { BarChart3, Download, RefreshCw, Settings, Minimize2, X } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useFinancial } from '@/lib/query/hooks/useFinancial';

// Registrar componentes do Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);

interface RevenueChartProps {
  title: string;
  type: 'revenue' | 'appointments' | 'services';
  period: 'week' | 'month' | 'quarter' | 'year';
  unidadeId: string;
  onRemove: () => void;
  onMinimize: () => void;
  size: 'small' | 'medium' | 'large';
}

export function RevenueChart({
  title,
  type,
  period,
  unidadeId,
  onRemove,
  onMinimize,
  size,
}: RevenueChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'doughnut'>('bar');
  const [isLoading, setIsLoading] = useState(false);
  
  // Hook para dados financeiros
  const { data: financialData, isLoading: isDataLoading, refetch } = useFinancial({
    period: selectedPeriod,
    unidade_id: unidadeId,
  });
  
  // Ref para o canvas do gráfico
  const chartRef = useRef<ChartJS>(null);
  
  // Função para atualizar dados
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refetch();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para exportar gráfico
  const handleExport = () => {
    if (chartRef.current) {
      const canvas = chartRef.current.canvas;
      const link = document.createElement('a');
      link.download = `${title}-${selectedPeriod}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };
  
  // Preparar dados para o gráfico
  const prepareChartData = () => {
    if (!financialData?.success || !financialData.data) {
      return {
        labels: [],
        datasets: [],
      };
    }
    
    const data = financialData.data;
    
    // Exemplo de estrutura de dados (ajustar conforme a API real)
    const labels = data.periods || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const revenueData = data.revenue || [0, 0, 0, 0, 0, 0];
    const appointmentsData = data.appointments || [0, 0, 0, 0, 0, 0];
    
    return {
      labels,
      datasets: [
        {
          label: 'Receita (R$)',
          data: revenueData,
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Agendamentos',
          data: appointmentsData,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  };
  
  // Configurações do gráfico
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (label.includes('Receita')) {
                label += new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(context.parsed.y);
              } else {
                label += context.parsed.y.toLocaleString('pt-BR');
              }
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          borderDash: [5, 5],
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: function(value: any) {
            if (type === 'revenue') {
              return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value);
            }
            return value.toLocaleString('pt-BR');
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart',
    },
  };
  
  // Calcular altura baseada no tamanho
  const getChartHeight = () => {
    switch (size) {
      case 'small':
        return '200px';
      case 'medium':
        return '300px';
      case 'large':
        return '400px';
      default:
        return '300px';
    }
  };
  
  const chartData = prepareChartData();
  
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="lg"
      p={4}
      h="full"
      position="relative"
    >
      {/* Cabeçalho do widget */}
      <HStack justify="space-between" align="center" mb={4}>
        <HStack spacing={2}>
          <BarChart3 size={20} color="var(--chakra-colors-blue-500)" />
          <Text fontSize="lg" fontWeight="semibold" color="gray.800">
            {title}
          </Text>
        </HStack>
        
        <HStack spacing={1}>
          {/* Seletor de período */}
          <Select
            size="sm"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            minW="100px"
            fontSize="xs"
          >
            <option value="week">Semana</option>
            <option value="month">Mês</option>
            <option value="quarter">Trimestre</option>
            <option value="year">Ano</option>
          </Select>
          
          {/* Seletor de tipo de gráfico */}
          <Select
            size="sm"
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
            minW="100px"
            fontSize="xs"
          >
            <option value="bar">Barras</option>
            <option value="line">Linha</option>
            <option value="doughnut">Rosca</option>
          </Select>
          
          {/* Botões de ação */}
          <Tooltip label="Atualizar dados">
            <IconButton
              icon={<RefreshCw size={14} />}
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              isLoading={isLoading}
              aria-label="Atualizar"
            />
          </Tooltip>
          
          <Tooltip label="Exportar gráfico">
            <IconButton
              icon={<Download size={14} />}
              size="sm"
              variant="ghost"
              onClick={handleExport}
              aria-label="Exportar"
            />
          </Tooltip>
          
          <Tooltip label="Configurações">
            <IconButton
              icon={<Settings size={14} />}
              size="sm"
              variant="ghost"
              aria-label="Configurações"
            />
          </Tooltip>
          
          <Tooltip label="Minimizar">
            <IconButton
              icon={<Minimize2 size={14} />}
              size="sm"
              variant="ghost"
              onClick={onMinimize}
              aria-label="Minimizar"
            />
          </Tooltip>
          
          <Tooltip label="Remover widget">
            <IconButton
              icon={<X size={14} />}
              size="sm"
              variant="ghost"
              onClick={onRemove}
              aria-label="Remover"
              colorScheme="red"
            />
          </Tooltip>
        </HStack>
      </HStack>
      
      {/* Conteúdo do widget */}
      <Box h={getChartHeight()} position="relative">
        {isDataLoading ? (
          <VStack justify="center" h="full" spacing={3}>
            <Spinner size="lg" color="blue.500" />
            <Text fontSize="sm" color="gray.500">
              Carregando dados...
            </Text>
          </VStack>
        ) : chartData.labels.length === 0 ? (
          <VStack justify="center" h="full" spacing={3}>
            <Text fontSize="lg" color="gray.500">
              Nenhum dado disponível
            </Text>
            <Text fontSize="sm" color="gray.400">
              Selecione um período diferente ou verifique os dados
            </Text>
          </VStack>
        ) : (
          <Bar
            ref={chartRef}
            data={chartData}
            options={chartOptions}
            height={getChartHeight()}
          />
        )}
      </Box>
      
      {/* Rodapé com informações adicionais */}
      <HStack justify="space-between" mt={4} fontSize="xs" color="gray.500">
        <Text>
          Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </Text>
        
        <HStack spacing={4}>
          <HStack spacing={1}>
            <Box w={3} h={3} bg="green.500" borderRadius="full" />
            <Text>Receita</Text>
          </HStack>
          <HStack spacing={1}>
            <Box w={3} h={3} bg="blue.500" borderRadius="full" />
            <Text>Agendamentos</Text>
          </HStack>
        </HStack>
      </HStack>
    </Box>
  );
}
