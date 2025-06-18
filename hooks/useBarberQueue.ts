import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

const supabase = createClient();

export const useBarberQueue = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('barber_queue')
        .select(`*, barber:profissionais(id, nome, avatar_url, telefone)`)
        .order('daily_services', { ascending: true })
        .order('queue_position', { ascending: true });
      if (error) throw error;
      const processedData = (data || []).map((item: any) => ({
        ...item,
        barber: item.barber ? {
          ...item.barber,
          avatar_url: item.barber?.avatar_url || '/img/default-avatar.png',
          nome: item.barber?.nome || 'Barbeiro não encontrado',
          telefone: item.barber?.telefone || 'Telefone não informado',
        } : null,
      }));
      setQueue(processedData);
    } catch (error) {
      toast.error('Erro ao carregar fila');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addService = async (queueId: string) => {
    try {
      const { data: current } = await supabase
        .from('barber_queue')
        .select('daily_services, total_services')
        .eq('id', queueId)
        .single();
      if (!current) {
        toast.error('Barbeiro não encontrado na fila');
        return;
      }
      const { error: updateError } = await supabase
        .from('barber_queue')
        .update({
          total_services: (current.total_services || 0) + 1,
          daily_services: (current.daily_services || 0) + 1,
          last_service_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', queueId);
      if (updateError) throw updateError;
      await reorganizeQueue();
      toast.success('Atendimento registrado!');
    } catch (error) {
      toast.error('Erro ao registrar atendimento');
      console.error(error);
    }
  };

  const reorganizeQueue = async () => {
    await fetchQueue();
  };

  const skipTurn = async (queueId: string) => {
    try {
      const { data: fila } = await supabase
        .from('barber_queue')
        .select('id, queue_position')
        .order('queue_position', { ascending: true });
      if (!fila) return;
      const idx = fila.findIndex((b: any) => b.id === queueId);
      if (idx === -1) return;
      const newFila = [...fila];
      const [barbeiro] = newFila.splice(idx, 1);
      newFila.push(barbeiro);
      for (let i = 0; i < newFila.length; i++) {
        await supabase
          .from('barber_queue')
          .update({ queue_position: i + 1 })
          .eq('id', newFila[i].id);
      }
      await fetchQueue();
      toast.success('Barbeiro passou a vez!');
    } catch (error) {
      toast.error('Erro ao passar a vez');
      console.error(error);
    }
  };

  const toggleBarberStatus = async (queueId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('barber_queue')
        .update({ is_active: isActive })
        .eq('id', queueId);
      if (error) throw error;
      await fetchQueue();
      toast.success(`Barbeiro ${isActive ? 'ativado' : 'desativado'}`);
    } catch (error) {
      toast.error('Erro ao alterar status');
      console.error(error);
    }
  };

  const moveBarberPosition = async (queueId: string, newPosition: number) => {
    try {
      const { data: fila } = await supabase
        .from('barber_queue')
        .select('id, queue_position')
        .order('queue_position', { ascending: true });
      if (!fila) return;
      const idx = fila.findIndex((b: any) => b.id === queueId);
      if (idx === -1 || newPosition < 1 || newPosition > fila.length) return;
      const newFila = [...fila];
      const [barbeiro] = newFila.splice(idx, 1);
      newFila.splice(newPosition - 1, 0, barbeiro);
      for (let i = 0; i < newFila.length; i++) {
        await supabase
          .from('barber_queue')
          .update({ queue_position: i + 1 })
          .eq('id', newFila[i].id);
      }
      await fetchQueue();
    } catch (error) {
      toast.error('Erro ao mover barbeiro na fila');
      console.error(error);
    }
  };

  const resetDailyServices = async () => {
    try {
      const { data: fila, error } = await supabase
        .from('barber_queue')
        .select('id')
        .order('queue_position', { ascending: true });
      if (error) throw error;
      if (!fila || fila.length === 0) return;
      for (let i = 0; i < fila.length; i++) {
        await supabase
          .from('barber_queue')
          .update({ daily_services: 0, total_services: 0 })
          .eq('id', fila[i].id);
      }
      const { data: filaAtualizada } = await supabase
        .from('barber_queue')
        .select('id, barber:profissionais(nome)')
        .order('barber.nome', { ascending: true });
      if (!filaAtualizada || filaAtualizada.length === 0) return;
      for (let i = 0; i < filaAtualizada.length; i++) {
        await supabase
          .from('barber_queue')
          .update({ queue_position: i + 1 })
          .eq('id', filaAtualizada[i].id);
      }
      await fetchQueue();
      toast.success('Fila zerada e reordenada!');
    } catch (error) {
      toast.error('Erro ao resetar atendimentos');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchQueue();
    const subscription = supabase
      .channel('barber_queue_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barber_queue' }, fetchQueue)
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, []);

  return {
    queue,
    loading,
    addService,
    skipTurn,
    toggleBarberStatus,
    moveBarberPosition,
    refetch: fetchQueue,
    resetDailyServices
  };
}; 