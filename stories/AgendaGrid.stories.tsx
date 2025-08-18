import type { Meta, StoryObj } from '@storybook/react';
import { AgendaGrid } from '../app/agenda/components/ui/AgendaGrid';
import { GridEvent, GridResource } from '../app/agenda/components/ui/AgendaGrid';
import dayjs from 'dayjs';

const meta: Meta<typeof AgendaGrid> = {
  title: 'Components/AgendaGrid',
  component: AgendaGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Grid de agenda interativa com suporte a drag & drop e múltiplas visualizações.',
      },
    },
  },
  argTypes: {
    date: {
      control: 'date',
      description: 'Data selecionada para exibição',
    },
    view: {
      control: 'select',
      options: ['day', 'week'],
      description: 'Tipo de visualização',
    },
    onEventClick: {
      action: 'event-clicked',
      description: 'Callback quando um evento é clicado',
    },
    onMove: {
      action: 'event-moved',
      description: 'Callback quando um evento é movido',
    },
    onResize: {
      action: 'event-resized',
      description: 'Callback quando um evento é redimensionado',
    },
    onSelectRange: {
      action: 'range-selected',
      description: 'Callback quando um intervalo de tempo é selecionado',
    },
  },
  tags: ['autodocs', 'accessibility'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data
const mockResources: GridResource[] = [
  { resourceId: '1', resourceTitle: 'João Silva', color: '#3b82f6' },
  { resourceId: '2', resourceTitle: 'Maria Santos', color: '#ef4444' },
  { resourceId: '3', resourceTitle: 'Pedro Costa', color: '#22c55e' },
];

const mockEvents: GridEvent[] = [
  {
    id: '1',
    resourceId: '1',
    start: dayjs().hour(9).minute(0).toISOString(),
    end: dayjs().hour(10).minute(0).toISOString(),
    title: 'Corte + Barba',
    status: 'confirmado',
    clientName: 'João Pereira',
    serviceName: 'Corte + Barba',
    isNewClient: false,
  },
  {
    id: '2',
    resourceId: '2',
    start: dayjs().hour(10).minute(30).toISOString(),
    end: dayjs().hour(11).minute(30).toISOString(),
    title: 'Sobrancelha',
    status: 'agendado',
    clientName: 'Ana Silva',
    serviceName: 'Design de Sobrancelha',
    isNewClient: true,
  },
  {
    id: '3',
    resourceId: '1',
    start: dayjs().hour(14).minute(0).toISOString(),
    end: dayjs().hour(15).minute(0).toISOString(),
    title: 'Corte',
    status: 'atendido',
    clientName: 'Carlos Santos',
    serviceName: 'Corte Masculino',
    isNewClient: false,
  },
];

export const Default: Story = {
  args: {
    date: new Date(),
    view: 'day',
    events: mockEvents,
    resources: mockResources,
    startHour: 8,
    endHour: 21,
    slotMinutes: 30,
  },
};

export const WeekView: Story = {
  args: {
    ...Default.args,
    view: 'week',
  },
};

export const WithManyEvents: Story = {
  args: {
    ...Default.args,
    events: [
      ...mockEvents,
      {
        id: '4',
        resourceId: '3',
        start: dayjs().hour(16).minute(0).toISOString(),
        end: dayjs().hour(17).minute(0).toISOString(),
        title: 'Bloqueado',
        status: 'bloqueado',
        clientName: 'Horário Bloqueado',
        serviceName: 'Indisponível',
        isNewClient: false,
      },
      {
        id: '5',
        resourceId: '2',
        start: dayjs().hour(17).minute(30).toISOString(),
        end: dayjs().hour(18).minute(30).toISOString(),
        title: 'Corte Feminino',
        status: 'agendado',
        clientName: 'Lucia Oliveira',
        serviceName: 'Corte Feminino',
        isNewClient: false,
      },
    ],
  },
};

export const EmptyState: Story = {
  args: {
    ...Default.args,
    events: [],
  },
};

export const MobileView: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

