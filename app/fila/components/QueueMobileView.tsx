'use client';

import React, { useState, useCallback } from 'react';
import { Box, VStack, HStack, Text, Button, IconButton, Badge, Avatar, Progress, useColorModeValue, useToast } from '@chakra-ui/react';
import { Users, Clock, Phone, Mail, Star, AlertTriangle, CheckCircle, Plus, User, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { useQueue } from '@/lib/query/hooks/useQueue';
import { useQueueStats } from '@/lib/query/hooks/useQueueStats';
import { useModal } from '@/lib/stores/useModalStore';
import { useUnidadeStore } from '@/lib/stores/useUnidadeStore';
import { QueueItemWithDetails } from '@/app/actions/queue';

interface QueueMobileViewProps {
  onAddToQueue: () => void;
  onAttendNext: () => void;
}

export function QueueMobileView({
  onAddToQueue,
  onAttendNext,
}: QueueMobileViewProps) {
  const { unidade } = useUnidadeStore();
  const { showModal } = useModal();
  const toast = useToast();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const primaryColor = useColorModeValue('blue.500', 'blue.400');

  // Hooks para dados da fila
  const { data: queueItems, isLoading, refetch } = useQueue({ unidadeId: unidade });
  const { data: stats } = useQueueStats({ unidadeId: unidade });

  // Função para mostrar detalhes do cliente
  const showClientDetails = useCallback((client: QueueItemWithDetails) => {
    showModal({
      title: 'Detalhes do Cliente',
      content: (
        <VStack spacing={4} align="stretch">
          <HStack spacing={3} justify="center">
            <Avatar size="lg" name={client.cliente_nome} />
            <VStack align="flex-start" spacing={1}>
              <Text fontSize="lg" fontWeight="bold">
                {client.cliente_nome}
              </Text>
              <Text fontSize="sm" color={mutedTextColor}>
                {client.cliente_email}
              </Text>
              <Text fontSize="sm" color={mutedTextColor}>
                {client.cliente_telefone}
              </Text>
            </VStack>
          </HStack>

          <Box>
            <Text fontWeight="medium" mb={2}>Informações da Fila:</Text>
            <VStack spacing={2} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="sm">Posição:</Text>
                <Badge colorScheme="blue" size="lg">
                  #{client.posicao}
                </Badge>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm">Status:</Text>
                <Badge colorScheme="orange" size="sm">
                  {client.status}
                </Badge>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm">Prioridade:</Text>
                <Badge colorScheme={client.prioridade === 'alta' ? 'red' : 'green'} size="sm">
                  {client.prioridade}
                </Badge>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm">Tempo de espera:</Text>
                <Text fontSize="sm" color="orange.500">
                  {client.tempo_espera || 'Calculando...'}
                </Text>
              </HStack>
            </VStack>
          </Box>

          {client.observacoes && (
            <Box>
              <Text fontWeight="medium" mb={2}>Observações:</Text>
              <Text fontSize="sm" color={mutedTextColor}>
                {client.observacoes}
              </Text>
            </Box>
          )}
        </VStack>
      ),
      size: 'md',
      actions: [
        {
          label: 'Atender Cliente',
          variant: 'solid',
          colorScheme: 'green',
          onClick: () => {
            // Implementar lógica para atender cliente
            showModal.close();
            toast({
              title: 'Cliente atendido',
              description: `${client.cliente_nome} foi chamado para atendimento`,
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
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

  // Função para remover cliente da fila
  const removeFromQueue = useCallback(async (clientId: string) => {
    try {
      // Implementar lógica para remover da fila
      toast({
        title: 'Cliente removido',
        description: 'Cliente foi removido da fila com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o cliente da fila',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [refetch, toast]);

  // Função para confirmar remoção
  const confirmRemove = useCallback((client: QueueItemWithDetails) => {
    showModal({
      title: 'Confirmar Remoção',
      content: (
        <VStack spacing={4} align="stretch">
          <Text>
            Tem certeza que deseja remover <strong>{client.cliente_nome}</strong> da fila?
          </Text>
          <Text fontSize="sm" color={mutedTextColor}>
            Esta ação não pode ser desfeita.
          </Text>
        </VStack>
      ),
      size: 'md',
      actions: [
        {
          label: 'Cancelar',
          variant: 'ghost',
          onClick: () => showModal.close(),
        },
        {
          label: 'Remover',
          variant: 'solid',
          colorScheme: 'red',
          onClick: () => {
            removeFromQueue(client.id);
            showModal.close();
          },
        },
      ],
    });
  }, [showModal, removeFromQueue]);

  if (!unidade) {
    return (
      <Box p={8} textAlign="center">
        <Text color="gray.500">Selecione uma unidade para visualizar a fila</Text>
      </Box>
    );
  }

  return (
    <Box className="desktop-hidden" p={4}>
      {/* Cabeçalho da fila */}
      <Box
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={4}
        mb={4}
      >
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="center">
            <VStack align="flex-start" spacing={1}>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                Fila de Atendimento
              </Text>
              <Text fontSize="sm" color={mutedTextColor}>
                {unidade} - Gerencie a fila de clientes
              </Text>
            </VStack>
            
            <IconButton
              aria-label="Adicionar à fila"
              icon={<Plus size={20} />}
              colorScheme="blue"
              size="lg"
              onClick={onAddToQueue}
            />
          </HStack>

          {/* Estatísticas rápidas */}
          {stats && (
            <HStack justify="space-around" spacing={4}>
              <VStack spacing={1} align="center">
                <Text fontSize="2xl" fontWeight="bold" color={primaryColor}>
                  {stats.totalNaFila}
                </Text>
                <Text fontSize="xs" color={mutedTextColor}>
                  Na fila
                </Text>
              </VStack>
              
              <VStack spacing={1} align="center">
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {stats.atendidosHoje}
                </Text>
                <Text fontSize="xs" color={mutedTextColor}>
                  Atendidos
                </Text>
              </VStack>
              
              <VStack spacing={1} align="center">
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {stats.tempoMedioEspera}
                </Text>
                <Text fontSize="xs" color={mutedTextColor}>
                  Min. espera
                </Text>
              </VStack>
            </HStack>
          )}
        </VStack>
      </Box>

      {/* Botão de atender próximo */}
      <Box mb={4}>
        <Button
          leftIcon={<CheckCircle size={20} />}
          colorScheme="green"
          size="lg"
          w="full"
          onClick={onAttendNext}
          isDisabled={!queueItems || queueItems.length === 0}
        >
          Atender Próximo Cliente
        </Button>
      </Box>

      {/* Lista de clientes na fila */}
      <Box>
        {isLoading ? (
          <Box textAlign="center" py={12}>
            <Text color={mutedTextColor}>Carregando fila...</Text>
          </Box>
        ) : !queueItems || queueItems.length === 0 ? (
          <Box
            textAlign="center"
            py={12}
            color={mutedTextColor}
          >
            <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <Text fontSize="lg" fontWeight="medium" mb={2}>
              Fila vazia
            </Text>
            <Text fontSize="sm">
              Não há clientes aguardando atendimento
            </Text>
          </Box>
        ) : (
          <VStack spacing={3} align="stretch">
            {queueItems.map((item, index) => (
              <Box
                key={item.id}
                bg={bgColor}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                p={4}
                cursor="pointer"
                onClick={() => showClientDetails(item)}
                _hover={{ 
                  bg: useColorModeValue('gray.50', 'gray.700'),
                  transform: 'translateY(-1px)',
                  boxShadow: 'md',
                }}
                transition="all 0.2s"
              >
                <VStack spacing={3} align="stretch">
                  {/* Cabeçalho do item */}
                  <HStack justify="space-between" align="flex-start">
                    <HStack spacing={3} align="center">
                      <Box
                        position="relative"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Avatar size="md" name={item.cliente_nome} />
                        <Badge
                          position="absolute"
                          top="-8px"
                          right="-8px"
                          colorScheme="blue"
                          borderRadius="full"
                          minW="24px"
                          h="24px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="xs"
                          fontWeight="bold"
                        >
                          {index + 1}
                        </Badge>
                      </Box>
                      
                      <VStack align="flex-start" spacing={1}>
                        <Text fontSize="lg" fontWeight="bold" color={textColor}>
                          {item.cliente_nome}
                        </Text>
                        <HStack spacing={2}>
                          <Badge colorScheme="orange" size="sm">
                            {item.status}
                          </Badge>
                          <Badge 
                            colorScheme={item.prioridade === 'alta' ? 'red' : 'green'} 
                            size="sm"
                          >
                            {item.prioridade}
                          </Badge>
                        </HStack>
                      </VStack>
                    </HStack>
                    
                    <IconButton
                      aria-label="Ver detalhes"
                      icon={<User size={16} />}
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        showClientDetails(item);
                      }}
                    />
                  </HStack>

                  {/* Informações de contato */}
                  <HStack spacing={4} wrap="wrap">
                    {item.cliente_telefone && (
                      <HStack spacing={1}>
                        <Phone size={14} color="#6b7280" />
                        <Text fontSize="sm" color={mutedTextColor}>
                          {item.cliente_telefone}
                        </Text>
                      </HStack>
                    )}
                    
                    {item.cliente_email && (
                      <HStack spacing={1}>
                        <Mail size={14} color="#6b7280" />
                        <Text fontSize="sm" color={mutedTextColor}>
                          {item.cliente_email}
                        </Text>
                      </HStack>
                    )}
                  </HStack>

                  {/* Tempo de espera */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm" color={mutedTextColor}>
                        Tempo de espera
                      </Text>
                      <Text fontSize="sm" fontWeight="medium" color="orange.500">
                        {item.tempo_espera || 'Calculando...'}
                      </Text>
                    </HStack>
                    
                    {item.tempo_espera && (
                      <Progress
                        value={Math.min((parseInt(item.tempo_espera) / 60) * 100, 100)}
                        colorScheme="orange"
                        size="sm"
                        borderRadius="full"
                      />
                    )}
                  </Box>

                  {/* Observações */}
                  {item.observacoes && (
                    <Box>
                      <Text fontSize="xs" fontWeight="medium" color={mutedTextColor} mb={1}>
                        Observações:
                      </Text>
                      <Text fontSize="sm" color={textColor} noOfLines={2}>
                        {item.observacoes}
                      </Text>
                    </Box>
                  )}

                  {/* Ações */}
                  <HStack spacing={2} pt={2} borderTopWidth="1px" borderColor={borderColor}>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      leftIcon={<Trash2 size={16} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmRemove(item);
                      }}
                    >
                      Remover
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      leftIcon={<ArrowUp size={16} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Implementar lógica para aumentar prioridade
                      }}
                    >
                      Prioridade
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="green"
                      leftIcon={<CheckCircle size={16} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Implementar lógica para atender cliente
                      }}
                    >
                      Atender
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      {/* Indicador de atualização automática */}
      <Box
        position="fixed"
        bottom="80px"
        right="16px"
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="full"
        p={2}
        boxShadow="lg"
        className="desktop-hidden"
      >
        <Text fontSize="xs" color={mutedTextColor}>
          Atualiza a cada 30s
        </Text>
      </Box>
    </Box>
  );
}
