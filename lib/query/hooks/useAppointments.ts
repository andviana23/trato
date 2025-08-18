/**
 * Hooks Customizados para Agendamentos
 * 
 * Este arquivo fornece hooks React Query para operações com agendamentos,
 * incluindo cache automático, sincronização e gerenciamento de estado.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '@/lib/query/queryClient';
import { 
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  moveAppointment,
  resizeAppointment,
  type Appointment,
  type CreateAppointmentInput,
  type UpdateAppointmentInput,
  type MoveAppointmentInput,
  type ResizeAppointmentInput,
} from '@/app/actions/appointments';

/**
 * Hook para buscar lista de agendamentos
 */
export function useAppointments(filters: {
  date?: Date;
  unidadeId?: string;
  professionalId?: string;
  status?: string;
} = {}) {
  return useQuery({
    queryKey: queryKeys.appointments.list(filters),
    queryFn: () => getAppointments(filters),
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!filters.unidadeId,
  });
}

/**
 * Hook para buscar um agendamento específico
 */
export function useAppointment(id: string) {
  return useQuery({
    queryKey: queryKeys.appointments.detail(id),
    queryFn: () => getAppointments({ id }),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    enabled: !!id,
  });
}

/**
 * Hook para buscar agendamentos com filtros avançados
 */
export function useAppointmentsWithFilters(filters: {
  date?: Date;
  unidadeId?: string;
  professionalId?: string;
  status?: string;
  clientId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  return useQuery({
    queryKey: queryKeys.appointments.list(filters),
    queryFn: () => getAppointments(filters),
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!filters.unidadeId,
  });
}

/**
 * Hook para criar um novo agendamento
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAppointmentInput) => createAppointment(input),
    onSuccess: (data) => {
      if (data.success) {
        // Invalidar listas de agendamentos
        invalidateQueries.appointmentsList();
        
        // Adicionar o novo agendamento ao cache
        queryClient.setQueryData(
          queryKeys.appointments.detail(data.data.id),
          data
        );
      }
    },
    onError: (error) => {
      console.error('Erro ao criar agendamento:', error);
    },
  });
}

/**
 * Hook para atualizar um agendamento
 */
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAppointmentInput) => updateAppointment(input),
    onSuccess: (data, variables) => {
      if (data.success) {
        // Invalidar o agendamento específico e listas
        invalidateQueries.appointment(variables.appointmentId);
        invalidateQueries.appointmentsList();
        
        // Atualizar o cache do agendamento
        queryClient.setQueryData(
          queryKeys.appointments.detail(variables.appointmentId),
          data
        );
      }
    },
    onError: (error) => {
      console.error('Erro ao atualizar agendamento:', error);
    },
  });
}

/**
 * Hook para deletar um agendamento
 */
export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAppointment(id),
    onSuccess: (data, variables) => {
      if (data.success) {
        // Invalidar listas de agendamentos
        invalidateQueries.appointmentsList();
        
        // Remover do cache
        queryClient.removeQueries({
          queryKey: queryKeys.appointments.detail(variables),
        });
      }
    },
    onError: (error) => {
      console.error('Erro ao deletar agendamento:', error);
    },
  });
}

/**
 * Hook para mover um agendamento (drag & drop)
 */
export function useMoveAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MoveAppointmentInput) => moveAppointment(input),
    onSuccess: (data, variables) => {
      if (data.success) {
        // Invalidar o agendamento específico e listas
        invalidateQueries.appointment(variables.appointmentId);
        invalidateQueries.appointmentsList();
        
        // Atualizar o cache do agendamento
        queryClient.setQueryData(
          queryKeys.appointments.detail(variables.appointmentId),
          data
        );
      }
    },
    onError: (error) => {
      console.error('Erro ao mover agendamento:', error);
    },
  });
}

/**
 * Hook para redimensionar um agendamento
 */
export function useResizeAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ResizeAppointmentInput) => resizeAppointment(input),
    onSuccess: (data, variables) => {
      if (data.success) {
        // Invalidar o agendamento específico e listas
        invalidateQueries.appointment(variables.appointmentId);
        invalidateQueries.appointmentsList();
        
        // Atualizar o cache do agendamento
        queryClient.setQueryData(
          queryKeys.appointments.detail(variables.appointmentId),
          data
        );
      }
    },
    onError: (error) => {
      console.error('Erro ao redimensionar agendamento:', error);
    },
  });
}

/**
 * Hook para buscar agendamentos de um período específico
 */
export function useAppointmentsByPeriod(startDate: Date, endDate: Date, unidadeId?: string) {
  return useQuery({
    queryKey: ['appointments', 'period', startDate.toISOString(), endDate.toISOString(), unidadeId],
    queryFn: () => getAppointments({
      startDate,
      endDate,
      unidadeId,
    }),
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    enabled: !!startDate && !!endDate && !!unidadeId,
  });
}

/**
 * Hook para buscar agendamentos de um profissional específico
 */
export function useAppointmentsByProfessional(professionalId: string, date?: Date) {
  return useQuery({
    queryKey: ['appointments', 'professional', professionalId, date?.toISOString()],
    queryFn: () => getAppointments({
      professionalId,
      date,
    }),
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!professionalId,
  });
}

/**
 * Hook para buscar agendamentos de um cliente específico
 */
export function useAppointmentsByClient(clientId: string, unidadeId?: string) {
  return useQuery({
    queryKey: ['appointments', 'client', clientId, unidadeId],
    queryFn: () => getAppointments({
      clientId,
      unidadeId,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    enabled: !!clientId,
  });
}

/**
 * Hook para prefetch de agendamentos
 */
export function usePrefetchAppointments() {
  const queryClient = useQueryClient();

  const prefetchAppointments = (filters: {
    date?: Date;
    unidadeId?: string;
    professionalId?: string;
    status?: string;
  }) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.appointments.list(filters),
      queryFn: () => getAppointments(filters),
      staleTime: 1 * 60 * 1000,
    });
  };

  const prefetchAppointment = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.appointments.detail(id),
      queryFn: () => getAppointments({ id }),
      staleTime: 2 * 60 * 1000,
    });
  };

  return {
    prefetchAppointments,
    prefetchAppointment,
  };
}
