'use client';

import React from 'react';
import { Box, VStack, HStack, Text, Button, Divider, Badge, Icon } from '@chakra-ui/react';
import { AlertTriangle, Clock, User, Calendar } from 'lucide-react';
import { AppointmentConflict } from '@/lib/types/appointment';

interface ConflictModalProps {
  conflicts: AppointmentConflict[];
  suggestions: string[];
  onSelectAlternative: (alternativeStart: string) => void;
  onCreateAnyway: () => void;
}

export function ConflictModal({
  conflicts,
  suggestions,
  onSelectAlternative,
  onCreateAnyway,
}: ConflictModalProps) {
  // Formatar horário para exibição
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calcular duração do conflito
  const getConflictDuration = (start: string, end: string) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Cabeçalho com alerta */}
      <HStack spacing={3} color="orange.600">
        <Icon as={AlertTriangle} boxSize={5} />
        <Text fontSize="lg" fontWeight="semibold">
          Conflito de Horário Detectado
        </Text>
      </HStack>

      <Text color="gray.600" fontSize="sm">
        O horário selecionado conflita com agendamentos existentes. 
        Verifique os detalhes abaixo e escolha uma alternativa.
      </Text>

      {/* Lista de conflitos */}
      <Box>
        <Text fontWeight="semibold" mb={3} color="red.600">
          Agendamentos Conflitantes ({conflicts.length})
        </Text>
        
        <VStack spacing={3} align="stretch" maxH="200px" overflowY="auto">
          {conflicts.map((conflict, index) => (
            <Box
              key={conflict.id}
              p={3}
              border="1px solid"
              borderColor="red.200"
              borderRadius="md"
              bg="red.50"
            >
              <HStack justify="space-between" align="flex-start" mb={2}>
                <VStack align="flex-start" spacing={1}>
                  <HStack spacing={2}>
                    <Icon as={User} boxSize={4} color="gray.600" />
                    <Text fontWeight="medium" fontSize="sm">
                      {conflict.clientName || 'Cliente não informado'}
                    </Text>
                  </HStack>
                  
                  <HStack spacing={2}>
                    <Icon as={Calendar} boxSize={4} color="gray.600" />
                    <Text fontSize="xs" color="gray.600">
                      {formatDate(conflict.start)}
                    </Text>
                  </HStack>
                </VStack>
                
                <Badge colorScheme="red" variant="subtle" fontSize="xs">
                  {getConflictDuration(conflict.start, conflict.end)}
                </Badge>
              </HStack>
              
              <HStack spacing={4} fontSize="xs" color="gray.600">
                <HStack spacing={1}>
                  <Icon as={Clock} boxSize={3} />
                  <Text>
                    {formatTime(conflict.start)} - {formatTime(conflict.end)}
                  </Text>
                </HStack>
                
                {conflict.serviceName && (
                  <Text>• {conflict.serviceName}</Text>
                )}
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>

      <Divider />

      {/* Sugestões de horários alternativos */}
      {suggestions.length > 0 && (
        <Box>
          <Text fontWeight="semibold" mb={3} color="green.600">
            Horários Alternativos Disponíveis
          </Text>
          
          <VStack spacing={2} align="stretch">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                colorScheme="green"
                size="sm"
                onClick={() => onSelectAlternative(suggestion)}
                justifyContent="flex-start"
                h="auto"
                p={3}
              >
                <HStack spacing={3}>
                  <Icon as={Clock} boxSize={4} />
                  <VStack align="flex-start" spacing={0}>
                    <Text fontSize="sm" fontWeight="medium">
                      {formatTime(suggestion)}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {formatDate(suggestion)}
                    </Text>
                  </VStack>
                </HStack>
              </Button>
            ))}
          </VStack>
        </Box>
      )}

      <Divider />

      {/* Ações */}
      <HStack spacing={3} justify="flex-end">
        <Button
          variant="outline"
          colorScheme="red"
          onClick={onCreateAnyway}
          size="sm"
        >
          Criar Mesmo Assim
        </Button>
        
        {suggestions.length > 0 && (
          <Text fontSize="xs" color="gray.500" textAlign="center">
            Recomendamos escolher um horário alternativo para evitar conflitos.
          </Text>
        )}
      </HStack>
    </VStack>
  );
}
