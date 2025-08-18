'use client';

import React from 'react';
import { HStack, Button, Tooltip } from '@chakra-ui/react';
import { Grid, Calendar, List } from 'lucide-react';

interface AgendaViewToggleProps {
  currentView: 'grid' | 'month' | 'list';
  onViewChange: (view: 'grid' | 'month' | 'list') => void;
}

export function AgendaViewToggle({ currentView, onViewChange }: AgendaViewToggleProps) {
  const views = [
    {
      id: 'grid' as const,
      label: 'Grade',
      icon: Grid,
      description: 'Visualização em grade com horários detalhados',
    },
    {
      id: 'month' as const,
      label: 'Mês',
      icon: Calendar,
      description: 'Visão mensal completa',
    },
    {
      id: 'list' as const,
      label: 'Lista',
      icon: List,
      description: 'Lista otimizada para mobile',
    },
  ];

  return (
    <HStack spacing={1}>
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = currentView === view.id;
        
        return (
          <Tooltip
            key={view.id}
            label={view.description}
            placement="top"
            hasArrow
          >
            <Button
              size="sm"
              variant={isActive ? "solid" : "outline"}
              colorScheme={isActive ? "blue" : "gray"}
              onClick={() => onViewChange(view.id)}
              px={3}
              minW="auto"
              h="32px"
              _hover={{
                transform: "translateY(-1px)",
                boxShadow: "sm",
              }}
              transition="all 0.2s"
            >
              <Icon size={16} />
              <span style={{ marginLeft: '6px' }}>{view.label}</span>
            </Button>
          </Tooltip>
        );
      })}
    </HStack>
  );
}
