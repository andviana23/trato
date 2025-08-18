/**
 * Hook para buscar conflitos de agendamentos
 * 
 * Este hook é usado para detectar conflitos de horário
 * antes de criar ou editar agendamentos.
 */

import { useQuery } from '@tanstack/react-query';
import { getAppointmentConflicts } from '@/app/actions/appointments';

/**
 * Hook para buscar conflitos de agendamentos
 */
export function useConflicts(date: Date, resourceIds: string[]) {
  return useQuery({
    queryKey: ['appointments', 'conflicts', date.toISOString(), resourceIds],
    queryFn: () => getAppointmentConflicts({
      date,
      resourceIds,
    }),
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    enabled: resourceIds.length > 0,
  });
}

/**
 * Hook para buscar conflitos de um agendamento específico
 */
export function useAppointmentConflicts(appointmentId: string, excludeId?: string) {
  return useQuery({
    queryKey: ['appointments', 'conflicts', appointmentId, excludeId],
    queryFn: () => getAppointmentConflicts({
      appointmentId,
      excludeId,
    }),
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    enabled: !!appointmentId,
  });
}
