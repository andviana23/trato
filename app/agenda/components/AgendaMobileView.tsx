'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Box, VStack, HStack, Text, Button, IconButton, Badge, Avatar, useColorModeValue, useToast } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, User, Phone, Mail, MapPin, Star } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import dayjs from 'dayjs';
import { Appointment } from '@/lib/types/appointment';
import { useModal } from '@/lib/stores/useModalStore';

interface AgendaMobileViewProps {
  date: Date;
  events: Appointment[];
  onDateChange: (date: Date) => void;
  onEventClick: (event: Appointment) => void;
  onAddEvent: () => void;
}

export function AgendaMobileView({
  date,
  events,
  onDateChange,
  onEventClick,
  onAddEvent,
}: AgendaMobileViewProps) {
  const [selectedDate, setSelectedDate] = useState(date);
  const toast = useToast();
  const { showModal } = useModal();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const primaryColor = useColorModeValue('blue.500', 'blue.400');

  // Gestos de swipe para navegar entre dias
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleDateChange(1),
    onSwipedRight: () => handleDateChange(-1),
    preventDefaultTouchmoveEvent: true,
    trackMouse: false,
  });

  // Função para mudar data
  const handleDateChange = useCallback((direction: number) => {
    const newDate = dayjs(selectedDate).add(direction, 'day').toDate();
    setSelectedDate(newDate);
    onDateChange(newDate);
  }, [selectedDate, onDateChange]);

  // Função para ir para hoje
  const goToToday = useCallback(() => {
    const today = new Date();
    setSelectedDate(today);
    onDateChange(today);
  }, [onDateChange]);

  // Função para selecionar data específica
  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    onDateChange(date);
  }, [onDateChange]);

  // Eventos do dia selecionado
  const dayEvents = useMemo(() => {
    return events.filter(event => 
      dayjs(event.start_at).isSame(dayjs(selectedDate), 'day')
    ).sort((a, b) => 
      dayjs(a.start_at).diff(dayjs(b.start_at))
    );
  }, [events, selectedDate]);

  // Gerar datas para a semana atual
  const weekDates = useMemo(() => {
    const startOfWeek = dayjs(selectedDate).startOf('week');
    const dates = [];
    
    for (let i = 0; i < 7; i++) {
      dates.push(startOfWeek.add(i, 'day').toDate());
    }
    
    return dates;
  }, [selectedDate]);

  // Função para obter status do evento
  const getEventStatus = (status: string) => {
    const statusConfig = {
      'confirmado': { color: 'green', label: 'Confirmado' },
      'agendado': { color: 'blue', label: 'Agendado' },
      'atendido': { color: 'gray', label: 'Atendido' },
      'cancelado': { color: 'red', label: 'Cancelado' },
      'bloqueado': { color: 'orange', label: 'Bloqueado' },
    };
    
    return statusConfig[status as keyof typeof statusConfig] || { color: 'gray', label: status };
  };

  // Função para formatar horário
  const formatTime = (time: string) => {
    return dayjs(time).format('HH:mm');
  };

  // Função para calcular duração
  const calculateDuration = (start: string, end: string) => {
    const startTime = dayjs(start);
    const endTime = dayjs(end);
    const duration = endTime.diff(startTime, 'minute');
    
    if (duration < 60) {
      return `${duration}min`;
    }
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (minutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h${minutes}min`;
  };

  // Função para mostrar detalhes do evento
  const showEventDetails = useCallback((event: Appointment) => {
    showModal({
      title: 'Detalhes do Agendamento',
      content: (
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between">
            <Text fontWeight="medium">Cliente:</Text>
            <Text>{event.cliente_nome || 'N/A'}</Text>
          </HStack>
          
          <HStack justify="space-between">
            <Text fontWeight="medium">Profissional:</Text>
            <Text>{event.barbeiro_nome || 'N/A'}</Text>
          </HStack>
          
          <HStack justify="space-between">
            <Text fontWeight="medium">Horário:</Text>
            <Text>{formatTime(event.start_at)} - {formatTime(event.end_at)}</Text>
          </HStack>
          
          <HStack justify="space-between">
            <Text fontWeight="medium">Duração:</Text>
            <Text>{calculateDuration(event.start_at, event.end_at)}</Text>
          </HStack>
          
          <HStack justify="space-between">
            <Text fontWeight="medium">Status:</Text>
            <Badge colorScheme={getEventStatus(event.status).color}>
              {getEventStatus(event.status).label}
            </Badge>
          </HStack>
          
          {event.observacoes && (
            <Box>
              <Text fontWeight="medium" mb={2}>Observações:</Text>
              <Text fontSize="sm" color={mutedTextColor}>
                {event.observacoes}
              </Text>
            </Box>
          )}
        </VStack>
      ),
      size: 'md',
      actions: [
        {
          label: 'Editar',
          variant: 'outline',
          onClick: () => {
            onEventClick(event);
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
  }, [showModal, onEventClick]);

  return (
    <Box className="desktop-hidden" {...swipeHandlers}>
      {/* Cabeçalho com navegação */}
      <Box
        bg={bgColor}
        borderBottomWidth="1px"
        borderColor={borderColor}
        p={4}
        position="sticky"
        top={0}
        zIndex={10}
      >
        <VStack spacing={4} align="stretch">
          {/* Título e botão de adicionar */}
          <HStack justify="space-between" align="center">
            <Text fontSize="xl" fontWeight="bold" color={textColor}>
              Agenda
            </Text>
            <Button
              leftIcon={<Plus size={16} />}
              colorScheme="blue"
              size="sm"
              onClick={onAddEvent}
            >
              Novo
            </Button>
          </HStack>

          {/* Navegação de datas */}
          <HStack justify="space-between" align="center">
            <IconButton
              aria-label="Dia anterior"
              icon={<ChevronLeft size={20} />}
              variant="ghost"
              size="sm"
              onClick={() => handleDateChange(-1)}
            />
            
            <VStack spacing={1} align="center" flex={1}>
              <Text fontSize="lg" fontWeight="medium" color={textColor}>
                {dayjs(selectedDate).format('dddd, DD [de] MMMM')}
              </Text>
              <Button
                size="xs"
                variant="outline"
                onClick={goToToday}
                colorScheme={dayjs(selectedDate).isSame(dayjs(), 'day') ? 'blue' : 'gray'}
              >
                Hoje
              </Button>
            </VStack>
            
            <IconButton
              aria-label="Próximo dia"
              icon={<ChevronRight size={20} />}
              variant="ghost"
              size="sm"
              onClick={() => handleDateChange(1)}
            />
          </HStack>

          {/* Seletor de semana */}
          <Box overflowX="auto" className="table-responsive">
            <HStack spacing={2} minW="max-content">
              {weekDates.map((weekDate) => {
                const isSelected = dayjs(weekDate).isSame(selectedDate, 'day');
                const isToday = dayjs(weekDate).isSame(dayjs(), 'day');
                const dayEvents = events.filter(event => 
                  dayjs(event.start_at).isSame(weekDate, 'day')
                );
                
                return (
                  <Button
                    key={weekDate.toISOString()}
                    variant={isSelected ? 'solid' : 'outline'}
                    colorScheme={isSelected ? 'blue' : 'gray'}
                    size="sm"
                    minW="60px"
                    onClick={() => selectDate(weekDate)}
                    position="relative"
                  >
                    <VStack spacing={1}>
                      <Text fontSize="xs" fontWeight="medium">
                        {dayjs(weekDate).format('ddd')}
                      </Text>
                      <Text fontSize="lg" fontWeight="bold">
                        {dayjs(weekDate).format('DD')}
                      </Text>
                      {dayEvents.length > 0 && (
                        <Box
                          position="absolute"
                          top="-4px"
                          right="-4px"
                          bg="red.500"
                          color="white"
                          borderRadius="full"
                          w="16px"
                          h="16px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text fontSize="xs" fontWeight="bold">
                            {dayEvents.length}
                          </Text>
                        </Box>
                      )}
                      {isToday && (
                        <Box
                          position="absolute"
                          bottom="-2px"
                          left="50%"
                          transform="translateX(-50%)"
                          w="4px"
                          h="4px"
                          bg="blue.500"
                          borderRadius="full"
                        />
                      )}
                    </VStack>
                  </Button>
                );
              })}
            </HStack>
          </Box>
        </VStack>
      </Box>

      {/* Lista de eventos do dia */}
      <Box p={4}>
        {dayEvents.length === 0 ? (
          <Box
            textAlign="center"
            py={12}
            color={mutedTextColor}
          >
            <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <Text fontSize="lg" fontWeight="medium" mb={2}>
              Nenhum agendamento
            </Text>
            <Text fontSize="sm">
              Este dia está livre para novos agendamentos
            </Text>
          </Box>
        ) : (
          <VStack spacing={3} align="stretch">
            {dayEvents.map((event) => {
              const status = getEventStatus(event.status);
              const startTime = formatTime(event.start_at);
              const endTime = formatTime(event.end_at);
              const duration = calculateDuration(event.start_at, event.end_at);
              
              return (
                <Box
                  key={event.id}
                  bg={bgColor}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="lg"
                  p={4}
                  cursor="pointer"
                  onClick={() => showEventDetails(event)}
                  _hover={{ 
                    bg: useColorModeValue('gray.50', 'gray.700'),
                    transform: 'translateY(-1px)',
                    boxShadow: 'md',
                  }}
                  transition="all 0.2s"
                >
                  <VStack spacing={3} align="stretch">
                    {/* Cabeçalho do evento */}
                    <HStack justify="space-between" align="flex-start">
                      <VStack align="flex-start" spacing={1} flex={1}>
                        <HStack spacing={2} align="center">
                          <Clock size={16} color="#6b7280" />
                          <Text fontSize="sm" fontWeight="medium" color={textColor}>
                            {startTime} - {endTime}
                          </Text>
                          <Badge size="sm" colorScheme={status.color}>
                            {status.label}
                          </Badge>
                        </HStack>
                        <Text fontSize="xs" color={mutedTextColor}>
                          Duração: {duration}
                        </Text>
                      </VStack>
                      
                      <IconButton
                        aria-label="Ver detalhes"
                        icon={<User size={16} />}
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          showEventDetails(event);
                        }}
                      />
                    </HStack>

                    {/* Informações do cliente */}
                    <Box>
                      <HStack spacing={3} align="center" mb={2}>
                        <Avatar size="sm" name={event.cliente_nome} />
                        <VStack align="flex-start" spacing={0} flex={1}>
                          <Text fontSize="sm" fontWeight="medium" color={textColor}>
                            {event.cliente_nome || 'Cliente não informado'}
                          </Text>
                          <Text fontSize="xs" color={mutedTextColor}>
                            {event.barbeiro_nome || 'Profissional não informado'}
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>

                    {/* Serviços */}
                    {event.servicos && event.servicos.length > 0 && (
                      <Box>
                        <Text fontSize="xs" fontWeight="medium" color={mutedTextColor} mb={2}>
                          Serviços:
                        </Text>
                        <HStack spacing={2} wrap="wrap">
                          {event.servicos.map((service, index) => (
                            <Badge key={index} size="sm" variant="outline">
                              {service.nome}
                            </Badge>
                          ))}
                        </HStack>
                      </Box>
                    )}

                    {/* Observações */}
                    {event.observacoes && (
                      <Box>
                        <Text fontSize="xs" fontWeight="medium" color={mutedTextColor} mb={1}>
                          Observações:
                        </Text>
                        <Text fontSize="xs" color={textColor} noOfLines={2}>
                          {event.observacoes}
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </Box>
              );
            })}
          </VStack>
        )}
      </Box>
    </Box>
  );
}
