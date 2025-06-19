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
      console.log('fetchQueue chamado');
      const { data, error } = await supabase
        .from('barber_queue')
        .select('*, barber:profissionais!profissional_id(id, nome, avatar_url, telefone)')
        .order('queue_position', { ascending: true });
      
      console.log('Resultado do fetchQueue:', data, error);
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
      console.error('Erro em fetchQueue:', error);
    } finally {
      setLoading(false);
    }
  };

  const reorganizeQueueByServices = async () => {
    console.log('reorganizeQueueByServices chamado');
    try {
      // Buscar todos os barbeiros ordenados por atendimentos diários (menos para mais)
      const { data: barbeiros, error } = await supabase
        .from('barber_queue')
        .select('id, daily_services, total_services')
        .order('daily_services', { ascending: true })
        .order('total_services', { ascending: true });

      console.log('Resultado da busca de barbeiros:', { barbeiros, error });
      if (error) throw error;
      if (!barbeiros || barbeiros.length === 0) {
        console.log('Nenhum barbeiro encontrado para reorganizar');
        return;
      }

      console.log('Barbeiros ordenados por atendimentos:', barbeiros);

      // Atualizar as posições na fila
      for (let i = 0; i < barbeiros.length; i++) {
        console.log(`Atualizando posição ${i + 1} para barbeiro ${barbeiros[i].id}`);
        const { error: updateError } = await supabase
          .from('barber_queue')
          .update({ queue_position: i + 1 })
          .eq('id', barbeiros[i].id);

        if (updateError) {
          console.error(`Erro ao atualizar posição ${i + 1}:`, updateError);
          throw updateError;
        }
        console.log(`Posição ${i + 1} atualizada com sucesso`);
      }

      console.log('Fila reorganizada com sucesso');
    } catch (error) {
      console.error('Erro ao reorganizar fila:', error);
      throw error;
    }
  };

  const addService = async (queueId: string) => {
    console.log('addService chamado para', queueId);
    try {
      const { data: current, error: errorCurrent } = await supabase
        .from('barber_queue')
        .select('daily_services, total_services')
        .eq('id', queueId)
        .single();

      console.log('Dados atuais do barbeiro:', current);
      if (errorCurrent) throw errorCurrent;
      
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
      
      // Reorganizar a fila automaticamente após adicionar serviço
      await reorganizeQueueByServices();
      await fetchQueue();
      toast.success('Atendimento registrado e fila reorganizada!');
    } catch (error) {
      toast.error('Erro ao registrar atendimento');
      console.error('Erro em addService:', error);
    }
  };

  const skipTurn = async (queueId: string) => {
    console.log('skipTurn chamado para', queueId);
    try {
      const { data: fila, error: errorFila } = await supabase
        .from('barber_queue')
        .select('id, queue_position')
        .order('queue_position', { ascending: true });

      if (errorFila) throw errorFila;
      if (!fila || fila.length === 0) {
        toast.error('Fila vazia');
        return;
      }

      const idx = fila.findIndex((b: any) => b.id === queueId);
      if (idx === -1) {
        toast.error('Barbeiro não encontrado');
        return;
      }

      const newFila = [...fila];
      const [barbeiro] = newFila.splice(idx, 1);
      newFila.push(barbeiro);

      for (let i = 0; i < newFila.length; i++) {
        const { error: updateError } = await supabase
          .from('barber_queue')
          .update({ queue_position: i + 1 })
          .eq('id', newFila[i].id);
          
        if (updateError) throw updateError;
      }

      await fetchQueue();
      toast.success('Barbeiro passou a vez!');
    } catch (error) {
      toast.error('Erro ao passar a vez');
      console.error('Erro em skipTurn:', error);
    }
  };

  const toggleBarberStatus = async (queueId: string, isActive: boolean) => {
    console.log('toggleBarberStatus chamado para', queueId, isActive);
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
      console.error('Erro em toggleBarberStatus:', error);
    }
  };

  const moveBarberPosition = async (queueId: string, newPosition: number) => {
    console.log('moveBarberPosition chamado para', queueId, newPosition);
    try {
      const { data: fila, error: errorFila } = await supabase
        .from('barber_queue')
        .select('id, queue_position')
        .order('queue_position', { ascending: true });

      if (errorFila) throw errorFila;
      if (!fila || fila.length === 0) {
        toast.error('Fila vazia');
        return;
      }

      const idx = fila.findIndex((b: any) => b.id === queueId);
      if (idx === -1 || newPosition < 1 || newPosition > fila.length) {
        toast.error('Posição inválida');
        return;
      }

      const newFila = [...fila];
      const [barbeiro] = newFila.splice(idx, 1);
      newFila.splice(newPosition - 1, 0, barbeiro);

      for (let i = 0; i < newFila.length; i++) {
        const { error: updateError } = await supabase
          .from('barber_queue')
          .update({ queue_position: i + 1 })
          .eq('id', newFila[i].id);
          
        if (updateError) throw updateError;
      }

      await fetchQueue();
    } catch (error) {
      toast.error('Erro ao mover barbeiro na fila');
      console.error('Erro em moveBarberPosition:', error);
    }
  };

  const resetDailyServices = async () => {
    console.log('resetDailyServices chamado');
    try {
      const { data: fila, error } = await supabase
        .from('barber_queue')
        .select('id')
        .order('queue_position', { ascending: true });

      if (error) throw error;
      if (!fila || fila.length === 0) {
        toast.error('Fila vazia');
        return;
      }

      for (const item of fila) {
        const { error: updateError } = await supabase
          .from('barber_queue')
          .update({ 
            daily_services: 0,
            total_services: 0 
          })
          .eq('id', item.id);
          
        if (updateError) throw updateError;
      }

      // Reorganizar a fila após zerar os atendimentos
      await reorganizeQueueByServices();
      await fetchQueue();
      toast.success('Fila zerada e reorganizada!');
    } catch (error) {
      toast.error('Erro ao resetar atendimentos');
      console.error('Erro em resetDailyServices:', error);
    }
  };

  const reorganizeByServices = async () => {
    console.log('reorganizeByServices chamado');
    try {
      console.log('Chamando reorganizeQueueByServices...');
      await reorganizeQueueByServices();
      console.log('reorganizeQueueByServices concluído, chamando fetchQueue...');
      await fetchQueue();
      console.log('fetchQueue concluído');
      toast.success('Fila reorganizada por atendimentos!');
    } catch (error) {
      console.error('Erro em reorganizeByServices:', error);
      toast.error('Erro ao reorganizar fila');
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
    resetDailyServices,
    reorganizeByServices
  };
}; 