'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Flex, Text, Button, useToast, IconButton, Tooltip } from '@chakra-ui/react';
import { ZoomIn, ZoomOut, Calendar, List, Search, Filter } from 'lucide-react';
import { AgendaGrid } from './AgendaGrid';
import { AgendaFilters } from './AgendaFilters';
import { AgendaSearch } from './AgendaSearch';
import { AgendaViewToggle } from './AgendaViewToggle';
import { ConflictModal } from './ConflictModal';
import { useModal } from '@/lib/stores/useModalStore';
import { useAppointments } from '@/lib/query/hooks/useAppointments';
import { useConflicts } from '@/lib/query/hooks/useConflicts';
import { Appointment, AppointmentConflict } from '@/lib/types/appointment';

interface AgendaGridEnhancedProps {
  date: Date;
  view: 'day' | 'week' | 'month';
  events: Appointment[];
  resources: Array<{
    resourceId: string;
    resourceTitle: string;
    color: string;
  }>;
  blockedRanges?: Array<{
    id: string;
    resourceId: string;
    startISO: string;
    endISO: string;
    reason: string;
  }>;
  startHour?: number;
  endHour?: number;
  slotMinutes?: number;
  onEventClick?: (id: string) => void;
  onMove?: (id: string, start: string, end: string) => void;
  onResize?: (id: string, end: string) => void;
  onSelectRange?: (start: string, end: string, resourceId: string) => void;
}

export function AgendaGridEnhanced({
  date,
  view,
  events,
  resources,
  blockedRanges = [],
  startHour = 8,
  endHour = 21,
  slotMinutes = 10,
  onEventClick,
  onMove,
  onResize,
  onSelectRange,
}: AgendaGridEnhancedProps) {
  const toast = useToast();
  const { showModal } = useModal();
  
  // Estados para funcionalidades avançadas
  const [zoomLevel, setZoomLevel] = useState(1); // 0.5x, 1x, 1.5x, 2x
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    status: 'all',
    professional: 'all',
    service: 'all',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'grid' | 'month' | 'list'>('grid');
  
  // Refs para funcionalidades de seleção
  const gridRef = useRef<HTMLDivElement>(null);
  const isSelecting = useRef(false);
  const selectionStart = useRef<{ x: number; y: number; time: string; resourceId: string } | null>(null);
  
  // Hooks para dados
  const { data: conflicts } = useConflicts(date, resources.map(r => r.resourceId));
  
  // Função para calcular altura do slot baseada no zoom
  const getSlotHeight = useCallback(() => {
    const baseHeight = 14; // --slot-10m do CSS
    return baseHeight * zoomLevel;
  }, [zoomLevel]);
  
  // Função para alternar zoom
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };
  
  // Função para resetar zoom
  const handleZoomReset = () => {
    setZoomLevel(1);
  };
  
  // Função para alternar visualização
  const handleViewChange = (newView: 'grid' | 'month' | 'list') => {
    setCurrentView(newView);
  };
  
  // Função para lidar com clique em slot (início da seleção)
  const handleSlotClick = useCallback((event: React.MouseEvent, time: string, resourceId: string) => {
    if (event.shiftKey) {
      // Multi-seleção com Shift
      const slotKey = `${resourceId}-${time}`;
      setSelectedSlots(prev => {
        const newSet = new Set(prev);
        if (newSet.has(slotKey)) {
          newSet.delete(slotKey);
        } else {
          newSet.add(slotKey);
        }
        return newSet;
      });
    } else {
      // Seleção única
      setSelectedSlots(new Set([`${resourceId}-${time}`]));
    }
  }, []);
  
  // Função para lidar com início da seleção por drag
  const handleSelectionStart = useCallback((event: React.MouseEvent, time: string, resourceId: string) => {
    isSelecting.current = true;
    selectionStart.current = { x: event.clientX, y: event.clientY, time, resourceId };
    
    // Adicionar listeners para mouse move e mouse up
    document.addEventListener('mousemove', handleSelectionMove);
    document.addEventListener('mouseup', handleSelectionEnd);
  }, []);
  
  // Função para lidar com movimento durante seleção
  const handleSelectionMove = useCallback((event: MouseEvent) => {
    if (!isSelecting.current || !selectionStart.current || !gridRef.current) return;
    
    // Calcular slots selecionados baseado no movimento
    const rect = gridRef.current.getBoundingClientRect();
    const startX = selectionStart.current.x - rect.left;
    const startY = selectionStart.current.y - rect.top;
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    
    // Implementar lógica para calcular slots baseado nas coordenadas
    // Esta é uma implementação simplificada
  }, []);
  
  // Função para lidar com fim da seleção
  const handleSelectionEnd = useCallback(() => {
    isSelecting.current = false;
    selectionStart.current = null;
    
    // Remover listeners
    document.removeEventListener('mousemove', handleSelectionMove);
    document.removeEventListener('mouseup', handleSelectionEnd);
  }, []);
  
  // Função para lidar com clique direito (menu de contexto)
  const handleContextMenu = useCallback((event: React.MouseEvent, appointment?: Appointment) => {
    event.preventDefault();
    
    if (appointment) {
      // Menu de contexto para agendamento existente
      showModal({
        title: 'Ações do Agendamento',
        content: (
          <Flex direction="column" gap={3}>
            <Button
              variant="outline"
              onClick={() => {
                onEventClick?.(appointment.id);
                // Fechar modal
              }}
            >
              Editar
            </Button>
            <Button
              variant="outline"
              colorScheme="orange"
              onClick={() => {
                // Lógica para reagendar
                // Fechar modal
              }}
            >
              Reagendar
            </Button>
            <Button
              variant="outline"
              colorScheme="red"
              onClick={() => {
                // Lógica para cancelar
                // Fechar modal
              }}
            >
              Cancelar
            </Button>
          </Flex>
        ),
        size: 'sm',
      });
    } else if (selectedSlots.size > 0) {
      // Menu de contexto para slots selecionados
      showModal({
        title: 'Criar Agendamento',
        content: (
          <Flex direction="column" gap={3}>
            <Text fontSize="sm" color="gray.500">
              {selectedSlots.size} slot(s) selecionado(s)
            </Text>
            <Button
              variant="outline"
              onClick={() => {
                // Lógica para criar agendamento
                // Fechar modal
              }}
            >
              Criar Agendamento
            </Button>
          </Flex>
        ),
        size: 'sm',
      });
    }
  }, [selectedSlots, onEventClick, showModal]);
  
  // Função para validar conflitos antes de criar/editar agendamento
  const validateConflicts = useCallback((start: string, end: string, resourceId: string, excludeId?: string) => {
    if (!conflicts) return { hasConflict: false, conflicts: [] };
    
    const conflictingAppointments = conflicts.filter(conflict => {
      if (excludeId && conflict.id === excludeId) return false;
      if (conflict.resourceId !== resourceId) return false;
      
      const conflictStart = new Date(conflict.start);
      const conflictEnd = new Date(conflict.end);
      const newStart = new Date(start);
      const newEnd = new Date(end);
      
      // Verificar sobreposição
      return (
        (newStart < conflictEnd && newEnd > conflictStart) ||
        (conflictStart < newEnd && conflictEnd > newStart)
      );
    });
    
    return {
      hasConflict: conflictingAppointments.length > 0,
      conflicts: conflictingAppointments,
    };
  }, [conflicts]);
  
  // Função para sugerir horários alternativos
  const suggestAlternativeSlots = useCallback((start: string, end: string, resourceId: string) => {
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const suggestions: string[] = [];
    
    // Buscar slots livres próximos
    // Esta é uma implementação simplificada
    const baseTime = new Date(start);
    
    // Tentar 30 minutos antes
    const before30 = new Date(baseTime.getTime() - 30 * 60 * 1000);
    if (before30.getHours() >= startHour) {
      const before30End = new Date(before30.getTime() + duration);
      if (!validateConflicts(before30.toISOString(), before30End.toISOString(), resourceId).hasConflict) {
        suggestions.push(before30.toISOString());
      }
    }
    
    // Tentar 30 minutos depois
    const after30 = new Date(baseTime.getTime() + 30 * 60 * 1000);
    if (after30.getHours() < endHour) {
      const after30End = new Date(after30.getTime() + duration);
      if (!validateConflicts(after30.toISOString(), after30End.toISOString(), resourceId).hasConflict) {
        suggestions.push(after30.toISOString());
      }
    }
    
    return suggestions;
  }, [startHour, endHour, validateConflicts]);
  
  // Função para lidar com criação de agendamento com validação
  const handleCreateAppointment = useCallback((start: string, end: string, resourceId: string) => {
    const validation = validateConflicts(start, end, resourceId);
    
    if (validation.hasConflict) {
      // Mostrar modal de conflito com sugestões
      const suggestions = suggestAlternativeSlots(start, end, resourceId);
      
      showModal({
        title: 'Conflito de Horário',
        content: (
          <ConflictModal
            conflicts={validation.conflicts}
            suggestions={suggestions}
            onSelectAlternative={(alternativeStart) => {
              const alternativeEnd = new Date(alternativeStart);
              alternativeEnd.setTime(alternativeEnd.getTime() + (new Date(end).getTime() - new Date(start).getTime()));
              
              onSelectRange?.(alternativeStart, alternativeEnd.toISOString(), resourceId);
            }}
            onCreateAnyway={() => {
              onSelectRange?.(start, end, resourceId);
            }}
          />
        ),
        size: 'lg',
      });
    } else {
      // Sem conflito, criar diretamente
      onSelectRange?.(start, end, resourceId);
    }
  }, [validateConflicts, suggestAlternativeSlots, onSelectRange, showModal]);
  
  // Aplicar filtros aos eventos
  const filteredEvents = events.filter(event => {
    if (filters.status !== 'all' && event.status !== filters.status) return false;
    if (filters.professional !== 'all' && event.barbeiro_id !== filters.professional) return false;
    if (filters.service !== 'all' && !event.servicos?.some(s => s.id === filters.service)) return false;
    if (searchQuery && !event.cliente_nome?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  
  // Renderizar visualização baseada no estado atual
  const renderView = () => {
    switch (currentView) {
      case 'grid':
        return (
          <AgendaGrid
            ref={gridRef}
            date={date}
            view={view}
            events={filteredEvents}
            resources={resources}
            blockedRanges={blockedRanges}
            startHour={startHour}
            endHour={endHour}
            slotMinutes={slotMinutes}
            slotHeight={getSlotHeight()}
            selectedSlots={selectedSlots}
            onEventClick={onEventClick}
            onMove={onMove}
            onResize={onResize}
            onSelectRange={handleCreateAppointment}
            onSlotClick={handleSlotClick}
            onSelectionStart={handleSelectionStart}
            onContextMenu={handleContextMenu}
          />
        );
      
      case 'month':
        return (
          <Box p={4}>
            <Text>Vista Mensal - Em desenvolvimento</Text>
          </Box>
        );
      
      case 'list':
        return (
          <Box p={4}>
            <Text>Vista Lista - Em desenvolvimento</Text>
          </Box>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <Box>
      {/* Barra de ferramentas superior */}
      <Flex
        justify="space-between"
        align="center"
        p={4}
        borderBottom="1px solid"
        borderColor="gray.200"
        bg="white"
        position="sticky"
        top={0}
        zIndex={10}
      >
        {/* Controles de zoom */}
        <Flex align="center" gap={2}>
          <Tooltip label="Zoom Out">
            <IconButton
              aria-label="Zoom Out"
              icon={<ZoomOut size={16} />}
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              isDisabled={zoomLevel <= 0.5}
            />
          </Tooltip>
          
          <Text fontSize="sm" fontWeight="medium" minW="60px" textAlign="center">
            {Math.round(zoomLevel * 100)}%
          </Text>
          
          <Tooltip label="Zoom In">
            <IconButton
              aria-label="Zoom In"
              icon={<ZoomIn size={16} />}
              size="sm"
              variant="outline"
              onClick={handleZoomIn}
              isDisabled={zoomLevel >= 2}
            />
          </Tooltip>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleZoomReset}
            ml={2}
          >
            Reset
          </Button>
        </Flex>
        
        {/* Alternador de visualização */}
        <AgendaViewToggle
          currentView={currentView}
          onViewChange={handleViewChange}
        />
        
        {/* Filtros e busca */}
        <Flex align="center" gap={3}>
          <AgendaSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar por cliente..."
          />
          
          <AgendaFilters
            filters={filters}
            onFiltersChange={setFilters}
            resources={resources}
          />
        </Flex>
      </Flex>
      
      {/* Conteúdo principal */}
      <Box
        ref={gridRef}
        onContextMenu={(e) => handleContextMenu(e)}
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
          transition: 'transform 0.2s ease-in-out',
        }}
      >
        {renderView()}
      </Box>
      
      {/* Indicador de slots selecionados */}
      {selectedSlots.size > 0 && (
        <Box
          position="fixed"
          bottom={4}
          right={4}
          bg="blue.500"
          color="white"
          px={3}
          py={2}
          borderRadius="lg"
          boxShadow="lg"
          zIndex={1000}
        >
          <Text fontSize="sm">
            {selectedSlots.size} slot(s) selecionado(s)
          </Text>
        </Box>
      )}
    </Box>
  );
}
