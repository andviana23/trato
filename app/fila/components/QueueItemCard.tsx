'use client';

import React, { useState } from 'react';
import { Box, HStack, VStack, Text, Avatar, Badge, IconButton, Tooltip, Progress, Menu, MenuButton, MenuList, MenuItem, Icon } from '@chakra-ui/react';
import { MoreVertical, Clock, Phone, Mail, Star, AlertTriangle, CheckCircle, SkipForward, Trash2, User } from 'lucide-react';
import { QueueItemWithDetails } from '@/app/actions/queue';

interface QueueItemCardProps {
  item: QueueItemWithDetails;
  position: number;
  isSelected: boolean;
  onSelect: () => void;
  onShowDetails: () => void;
  onAttend: () => void;
  onSkip: () => void;
  onRemove: () => void;
}

export function QueueItemCard({
  item,
  position,
  isSelected,
  onSelect,
  onShowDetails,
  onAttend,
  onSkip,
  onRemove,
}: QueueItemCardProps) {
  const [showFullDetails, setShowFullDetails] = useState(false);
  
  // Calcular tempo de espera
  const getWaitTime = () => {
    const arrival = new Date(item.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - arrival.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }
  };
  
  // Calcular tempo estimado de atendimento
  const getEstimatedTime = () => {
    if (!item.estimatedWaitTime) return 'N/A';
    
    const minutes = item.estimatedWaitTime;
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    }
  };
  
  // Obter cor do status
  const getStatusColor = () => {
    switch (item.status) {
      case 'aguardando':
        return 'blue';
      case 'chamado':
        return 'orange';
      case 'em_atendimento':
        return 'green';
      case 'finalizado':
        return 'gray';
      case 'cancelado':
        return 'red';
      default:
        return 'gray';
    }
  };
  
  // Obter texto do status
  const getStatusText = () => {
    switch (item.status) {
      case 'aguardando':
        return 'Aguardando';
      case 'chamado':
        return 'Chamado';
      case 'em_atendimento':
        return 'Em Atendimento';
      case 'finalizado':
        return 'Finalizado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return 'Desconhecido';
    }
  };
  
  // Obter cor da prioridade
  const getPriorityColor = () => {
    switch (item.priority) {
      case 'urgente':
        return 'red';
      case 'prioritaria':
        return 'orange';
      case 'normal':
        return 'blue';
      default:
        return 'gray';
    }
  };
  
  // Obter texto da prioridade
  const getPriorityText = () => {
    switch (item.priority) {
      case 'urgente':
        return 'Urgente';
      case 'prioritaria':
        return 'Prioritária';
      case 'normal':
        return 'Normal';
      default:
        return 'Normal';
    }
  };
  
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor={isSelected ? "blue.300" : "gray.200"}
      borderRadius="lg"
      p={4}
      cursor="pointer"
      onClick={onSelect}
      _hover={{
        borderColor: "blue.300",
        boxShadow: "md",
        transform: "translateY(-1px)",
      }}
      transition="all 0.2s"
      position="relative"
      overflow="hidden"
    >
      {/* Indicador de posição */}
      <Box
        position="absolute"
        top={0}
        left={0}
        bg="blue.500"
        color="white"
        px={2}
        py={1}
        fontSize="xs"
        fontWeight="bold"
        borderBottomRightRadius="md"
      >
        #{position}
      </Box>
      
      {/* Barra de progresso de tempo de espera */}
      <Box position="absolute" top={0} left={0} right={0} h="2px">
        <Progress
          value={Math.min((Date.now() - new Date(item.createdAt).getTime()) / (item.estimatedWaitTime || 60) * 100, 100)}
          size="xs"
          colorScheme={item.estimatedWaitTime && Date.now() - new Date(item.createdAt).getTime() > (item.estimatedWaitTime * 60 * 1000) ? "red" : "blue"}
        />
      </Box>
      
      <HStack spacing={4} align="flex-start">
        {/* Avatar e informações do cliente */}
        <VStack spacing={2} align="center" minW="80px">
          <Avatar
            size="md"
            name={item.client?.name || 'Cliente'}
            src={item.client?.avatar_url}
            bg="blue.500"
            color="white"
            onClick={(e) => {
              e.stopPropagation();
              onShowDetails();
            }}
            cursor="pointer"
            _hover={{ transform: "scale(1.1)" }}
            transition="transform 0.2s"
          />
          
          {/* Indicador de cliente VIP/preferencial */}
          {item.client?.is_vip && (
            <Tooltip label="Cliente VIP">
              <Icon as={Star} color="yellow.500" boxSize={4} />
            </Tooltip>
          )}
        </VStack>
        
        {/* Informações principais */}
        <VStack align="flex-start" spacing={2} flex={1}>
          <HStack justify="space-between" w="full">
            <Text fontWeight="semibold" fontSize="lg" color="gray.800">
              {item.client?.name || 'Cliente não informado'}
            </Text>
            
            {/* Menu de ações */}
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<MoreVertical size={16} />}
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                aria-label="Ações"
              />
              <MenuList>
                <MenuItem icon={<User size={16} />} onClick={onShowDetails}>
                  Ver Detalhes
                </MenuItem>
                <MenuItem icon={<CheckCircle size={16} />} onClick={onAttend}>
                  Atender
                </MenuItem>
                <MenuItem icon={<SkipForward size={16} />} onClick={onSkip}>
                  Pular
                </MenuItem>
                <MenuItem icon={<Trash2 size={16} />} onClick={onRemove}>
                  Remover
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
          
          {/* Serviço e observações */}
          <VStack align="flex-start" spacing={1}>
            {item.service && (
              <Text fontSize="sm" color="gray.600">
                <strong>Serviço:</strong> {item.service.name}
              </Text>
            )}
            
            {item.notes && (
              <Text fontSize="sm" color="gray.600" noOfLines={2}>
                <strong>Obs:</strong> {item.notes}
              </Text>
            )}
          </VStack>
          
          {/* Informações de contato */}
          <HStack spacing={4} fontSize="xs" color="gray.500">
            {item.client?.phone && (
              <HStack spacing={1}>
                <Icon as={Phone} boxSize={3} />
                <Text>{item.client.phone}</Text>
              </HStack>
            )}
            
            {item.client?.email && (
              <HStack spacing={1}>
                <Icon as={Mail} boxSize={3} />
                <Text>{item.client.email}</Text>
              </HStack>
            )}
          </HStack>
        </VStack>
        
        {/* Status e informações temporais */}
        <VStack align="flex-end" spacing={3} minW="120px">
          {/* Status */}
          <Badge
            colorScheme={getStatusColor()}
            variant="subtle"
            fontSize="xs"
            px={2}
            py={1}
          >
            {getStatusText()}
          </Badge>
          
          {/* Prioridade */}
          <Badge
            colorScheme={getPriorityColor()}
            variant="outline"
            fontSize="xs"
            px={2}
            py={1}
          >
            {getPriorityText()}
          </Badge>
          
          {/* Tempo de espera */}
          <VStack spacing={1} align="center">
            <HStack spacing={1}>
              <Icon as={Clock} boxSize={3} color="gray.500" />
              <Text fontSize="xs" color="gray.600">
                Aguardando
              </Text>
            </HStack>
            <Text fontSize="sm" fontWeight="semibold" color="gray.800">
              {getWaitTime()}
            </Text>
          </VStack>
          
          {/* Tempo estimado */}
          <VStack spacing={1} align="center">
            <Text fontSize="xs" color="gray.500">
              Estimado
            </Text>
            <Text fontSize="sm" fontWeight="semibold" color="gray.800">
              {getEstimatedTime()}
            </Text>
          </VStack>
        </VStack>
      </HStack>
      
      {/* Detalhes expandidos */}
      {showFullDetails && (
        <Box mt={4} pt={4} borderTop="1px solid" borderColor="gray.200">
          <VStack align="flex-start" spacing={2}>
            <Text fontSize="sm" color="gray.600">
              <strong>Adicionado por:</strong> {item.addedBy}
            </Text>
            
            <Text fontSize="sm" color="gray.600">
              <strong>Horário de chegada:</strong> {new Date(item.createdAt).toLocaleString('pt-BR')}
            </Text>
            
            {item.assignedProfessionalId && (
              <Text fontSize="sm" color="gray.600">
                <strong>Profissional:</strong> {item.professional?.name || 'Não atribuído'}
              </Text>
            )}
          </VStack>
        </Box>
      )}
      
      {/* Alerta de tempo excedido */}
      {item.estimatedWaitTime && 
       Date.now() - new Date(item.createdAt).getTime() > (item.estimatedWaitTime * 60 * 1000) && (
        <Box
          position="absolute"
          top={2}
          right={2}
          bg="red.500"
          color="white"
          px={2}
          py={1}
          borderRadius="full"
          fontSize="xs"
          fontWeight="bold"
        >
          <HStack spacing={1}>
            <Icon as={AlertTriangle} boxSize={3} />
            <Text>Tempo Excedido</Text>
          </HStack>
        </Box>
      )}
    </Box>
  );
}
