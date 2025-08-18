'use client';

import React, { useState, useEffect } from 'react';
import { Box, VStack, HStack, Text, Button, IconButton, Tooltip, Badge, Avatar, Progress } from '@chakra-ui/react';
import { Plus, User, Clock, Phone, Mail, Star, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQueue } from '@/lib/query/hooks/useQueue';
import { useQueueStats } from '@/lib/query/hooks/useQueueStats';
import { QueueItemCard } from './QueueItemCard';
import { QueueStats } from './QueueStats';
import { AddToQueueModal } from './AddToQueueModal';
import { useModal } from '@/lib/stores/useModalStore';
import { useUnidadeStore } from '@/lib/stores/useUnidadeStore';

export function QueueInterface() {
  const { unidade } = useUnidadeStore();
  const { showModal } = useModal();
  
  // Estados locais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  
  // Hooks para dados da fila
  const { data: queueItems, isLoading, refetch } = useQueue({ unidadeId: unidade });
  const { data: stats } = useQueueStats({ unidadeId: unidade });
  
  // Atualizar dados a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refetch]);
  
  // Função para abrir modal de adicionar à fila
  const handleAddToQueue = () => {
    setIsAddModalOpen(true);
  };
  
  // Função para fechar modal
  const handleCloseModal = () => {
    setIsAddModalOpen(false);
  };
  
  // Função para mostrar detalhes do cliente
  const handleShowClientDetails = (clientId: string) => {
    // Implementar modal com detalhes do cliente
    showModal({
      title: 'Detalhes do Cliente',
      content: <Text>Detalhes do cliente {clientId}</Text>,
      size: 'md',
    });
  };
  
  // Função para atender próximo cliente
  const handleAttendNext = () => {
    // Implementar lógica para atender próximo cliente
    console.log('Atendendo próximo cliente');
  };
  
  // Função para reorganizar fila
  const handleReorganizeQueue = () => {
    // Implementar lógica para reorganizar fila
    console.log('Reorganizando fila');
  };
  
  if (!unidade) {
    return (
      <Box p={8} textAlign="center">
        <Text color="gray.500">Selecione uma unidade para visualizar a fila</Text>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Cabeçalho da fila */}
      <Box
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        p={4}
        position="sticky"
        top={0}
        zIndex={10}
      >
        <HStack justify="space-between" align="center">
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              Fila de Atendimento
            </Text>
            <Text fontSize="sm" color="gray.600">
              {unidade} - Gerencie a fila de clientes
            </Text>
          </VStack>
          
          <HStack spacing={3}>
            <Button
              leftIcon={<Plus size={16} />}
              colorScheme="blue"
              onClick={handleAddToQueue}
              size="sm"
            >
              Adicionar à Fila
            </Button>
            
            <Button
              leftIcon={<CheckCircle size={16} />}
              colorScheme="green"
              onClick={handleAttendNext}
              size="sm"
            >
              Atender Próximo
            </Button>
            
            <Button
              variant="outline"
              onClick={handleReorganizeQueue}
              size="sm"
            >
              Reorganizar
            </Button>
          </HStack>
        </HStack>
      </Box>
      
      {/* Estatísticas da fila */}
      {stats && (
        <Box p={4} bg="gray.50" borderBottom="1px solid" borderColor="gray.200">
          <QueueStats stats={stats} />
        </Box>
      )}
      
      {/* Lista de clientes na fila */}
      <Box p={4}>
        {isLoading ? (
          <Box textAlign="center" py={8}>
            <Text color="gray.500">Carregando fila...</Text>
          </Box>
        ) : !queueItems || queueItems.length === 0 ? (
          <Box textAlign="center" py={12}>
            <User size={48} color="gray.300" style={{ margin: '0 auto 16px' }} />
            <Text fontSize="lg" color="gray.500" mb={2}>
              Fila vazia
            </Text>
            <Text fontSize="sm" color="gray.400" mb={4}>
              Não há clientes aguardando atendimento
            </Text>
            <Button
              leftIcon={<Plus size={16} />}
              colorScheme="blue"
              onClick={handleAddToQueue}
              size="sm"
            >
              Adicionar Primeiro Cliente
            </Button>
          </Box>
        ) : (
          <VStack spacing={3} align="stretch">
            {queueItems.map((item, index) => (
              <QueueItemCard
                key={item.id}
                item={item}
                position={index + 1}
                isSelected={selectedItem === item.id}
                onSelect={() => setSelectedItem(item.id)}
                onShowDetails={() => handleShowClientDetails(item.clientId)}
                onAttend={() => {
                  // Implementar lógica para atender cliente
                  console.log('Atendendo cliente:', item.id);
                }}
                onSkip={() => {
                  // Implementar lógica para pular cliente
                  console.log('Pulando cliente:', item.id);
                }}
                onRemove={() => {
                  // Implementar lógica para remover cliente
                  console.log('Removendo cliente:', item.id);
                }}
              />
            ))}
          </VStack>
        )}
      </Box>
      
      {/* Modal para adicionar à fila */}
      {isAddModalOpen && (
        <AddToQueueModal
          isOpen={isAddModalOpen}
          onClose={handleCloseModal}
          unidadeId={unidade}
          onSuccess={() => {
            handleCloseModal();
            refetch();
          }}
        />
      )}
    </Box>
  );
}
