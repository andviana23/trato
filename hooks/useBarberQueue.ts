import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const supabase = createClient();

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=365E78&color=fff';

export const useBarberQueue = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar dados da fila com informações dos barbeiros
  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      console.log('[BarberQueue] Iniciando busca da fila');
      
      // Buscar dados da fila junto com informações dos barbeiros
      const { data: filaData, error: errorFila } = await supabase
        .from('barber_queue')
        .select(`
          id,
          profissional_id,
          queue_position,
          daily_services,
          total_services,
          is_active,
          last_service_date,
          passou_vez,
          profissionais (
            id,
            nome,
            telefone,
            email,
            avatar_url,
            funcao,
            data_nascimento,
            created_at,
            updated_at,
            user_id
          )
        `)
        .order('queue_position', { ascending: true });

      if (errorFila) {
        throw new Error(`Erro ao buscar dados da fila: ${errorFila.message}`);
      }

      if (!filaData || filaData.length === 0) {
        console.log('[BarberQueue] Nenhum barbeiro na fila');
        setQueue([]);
        return;
      }

      // Filtrar apenas registros onde o profissional é barbeiro
      const barbeirosNaFila = filaData.filter(item => 
        item.profissionais?.funcao === 'barbeiro'
      );

      // Transformar os dados no formato esperado pela UI
      const processedData = barbeirosNaFila.map(item => ({
        id: item.profissional_id,
        queue_position: item.queue_position,
        daily_services: item.daily_services || 0,
        total_services: item.total_services || 0,
        is_active: item.is_active,
        last_service_date: item.last_service_date,
        passou_vez: item.passou_vez || 0,
        barber: {
          id: item.profissionais?.id,
          nome: item.profissionais?.nome || 'Nome não informado',
          telefone: item.profissionais?.telefone || 'Telefone não informado',
          email: item.profissionais?.email,
          avatar_url: item.profissionais?.avatar_url || DEFAULT_AVATAR
        }
      }));
      
      console.log('[BarberQueue] Dados processados:', processedData);
      setQueue(processedData);

    } catch (error) {
      console.error('[BarberQueue] Erro ao carregar fila:', error);
      toast.error('Erro ao carregar fila: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Função para reorganizar a fila (fila indiana)
  const reorganizarFila = async () => {
    console.log('[BarberQueue] Reorganizando fila...');
    try {
      // Buscar todos os barbeiros ativos
      const { data: barbeirosAtivos, error } = await supabase
        .from('barber_queue')
        .select(`
          id,
          profissional_id,
          queue_position,
          daily_services,
          total_services,
          is_active,
          passou_vez,
          profissionais!inner (
            funcao
          )
        `)
        .eq('is_active', true)
        .eq('profissionais.funcao', 'barbeiro')
        .order('queue_position', { ascending: true });

      if (error) throw error;

      if (!barbeirosAtivos || barbeirosAtivos.length === 0) {
        console.log('[BarberQueue] Nenhum barbeiro ativo para reorganizar');
        return;
      }

      // Ordenar por: is_active (ativos primeiro), total_services (menor primeiro), passou_vez (menor primeiro)
      const novaOrdem = barbeirosAtivos.sort((a, b) => {
        // Primeiro: ativos primeiro
        if (a.is_active !== b.is_active) return b.is_active ? 1 : -1;
        
        // Segundo: menor número de atendimentos primeiro (fila indiana)
        if (a.total_services !== b.total_services) return a.total_services - b.total_services;
        
        // Terceiro: menor número de "passou vez" primeiro
        if ((a.passou_vez || 0) !== (b.passou_vez || 0)) return (a.passou_vez || 0) - (b.passou_vez || 0);
        
        // Quarto: posição atual em caso de empate
        return a.queue_position - b.queue_position;
      });

      console.log('[BarberQueue] Nova ordem:', novaOrdem.map(b => ({ 
        nome: b.profissionais?.nome, 
        total_services: b.total_services, 
        passou_vez: b.passou_vez 
      })));

      // Atualizar posições no banco
      for (let i = 0; i < novaOrdem.length; i++) {
        await supabase
          .from('barber_queue')
          .update({ queue_position: i + 1 })
          .eq('id', novaOrdem[i].id);
      }

      console.log('[BarberQueue] Fila reorganizada com sucesso');
    } catch (error) {
      console.error('[BarberQueue] Erro ao reorganizar fila:', error);
      throw error;
    }
  };

  // 1. Botão "+1" (Atendeu)
  const handleAtendimento = async (professionalId: string) => {
    console.log('[BarberQueue] Atendimento registrado para:', professionalId);
    try {
      // Primeiro, buscar os valores atuais
      const { data: currentData, error: fetchError } = await supabase
        .from('barber_queue')
        .select('daily_services, total_services')
        .eq('profissional_id', professionalId)
        .single();

      if (fetchError) throw fetchError;

      // Incrementar contadores
      const { error } = await supabase
        .from('barber_queue')
        .update({
          daily_services: (currentData?.daily_services || 0) + 1,
          total_services: (currentData?.total_services || 0) + 1,
          last_service_date: new Date().toISOString().split('T')[0]
        })
        .eq('profissional_id', professionalId);

      if (error) throw error;
      
      toast.success('Atendimento registrado!');
      
      // Reorganizar fila após atendimento
      await reorganizarFila();
      
      // Atualizar dados na interface
      await fetchProfessionals();
    } catch (error) {
      toast.error('Erro ao registrar atendimento');
      console.error('[BarberQueue] Erro em handleAtendimento:', error);
    }
  };

  // 2. Botão "Passar" (Passou a vez)
  const handlePassarVez = async (professionalId: string) => {
    console.log('[BarberQueue] Passou a vez para:', professionalId);
    try {
      // Primeiro, buscar os valores atuais
      const { data: currentData, error: fetchError } = await supabase
        .from('barber_queue')
        .select('daily_services, total_services, passou_vez')
        .eq('profissional_id', professionalId)
        .single();

      if (fetchError) throw fetchError;

      // Incrementar contadores + passou_vez
      const { error } = await supabase
        .from('barber_queue')
        .update({
          daily_services: (currentData?.daily_services || 0) + 1,
          total_services: (currentData?.total_services || 0) + 1,
          passou_vez: (currentData?.passou_vez || 0) + 1
        })
        .eq('profissional_id', professionalId);

      if (error) throw error;
      
      toast.success('Profissional passou a vez!');
      
      // Reorganizar fila após passar vez
      await reorganizarFila();
      
      // Atualizar dados na interface
      await fetchProfessionals();
    } catch (error) {
      toast.error('Erro ao passar a vez');
      console.error('[BarberQueue] Erro em handlePassarVez:', error);
    }
  };

  // 3. Toggle "Ativo/Inativo"
  const handleToggleAtivo = async (professionalId: string, novoStatus: boolean) => {
    console.log('[BarberQueue] Alterando status para:', { professionalId, novoStatus });
    try {
      const { error } = await supabase
        .from('barber_queue')
        .update({ is_active: novoStatus })
        .eq('profissional_id', professionalId);

      if (error) throw error;
      
      toast.success(`Profissional ${novoStatus ? 'ativado' : 'desativado'}`);
      
      // Reorganizar fila se ativou (para incluir na fila)
      if (novoStatus) {
        await reorganizarFila();
      }
      
      // Atualizar dados na interface
      await fetchProfessionals();
    } catch (error) {
      toast.error('Erro ao alterar status');
      console.error('[BarberQueue] Erro em handleToggleAtivo:', error);
    }
  };

  // 4. Botão "Reorganizar por Atendimentos"
  const reorganizarPorAtendimentos = async () => {
    console.log('[BarberQueue] Reorganizando por atendimentos');
    try {
      await reorganizarFila();
      toast.success('Fila reorganizada por atendimentos!');
      await fetchProfessionals();
    } catch (error) {
      console.error('[BarberQueue] Erro em reorganizarPorAtendimentos:', error);
      toast.error('Erro ao reorganizar fila');
    }
  };

  // 5. Botão "Zerar Lista"
  const zerarLista = async () => {
    console.log('[BarberQueue] Zerando lista');
    try {
      // Zerar todos os contadores
      const { error } = await supabase
        .from('barber_queue')
        .update({ 
          daily_services: 0,
          total_services: 0,
          passou_vez: 0
        })
        .eq('is_active', true);

      if (error) throw error;

      toast.success('Lista zerada!');
      
      // Reorganizar posições (1, 2, 3, 4, 5...)
      await reorganizarFila();
      
      // Atualizar dados na interface
      await fetchProfessionals();
    } catch (error) {
      toast.error('Erro ao zerar lista');
      console.error('[BarberQueue] Erro em zerarLista:', error);
    }
  };

  // Funções legadas para compatibilidade (mantidas para não quebrar código existente)
  const addService = handleAtendimento;
  const skipTurn = handlePassarVez;
  const toggleBarberStatus = handleToggleAtivo;
  const reorganizeByServices = reorganizarPorAtendimentos;
  const resetDailyServices = zerarLista;

  const moveBarberPosition = async (professionalId: string, newPosition: number) => {
    console.log('[BarberQueue] Movendo profissional:', { professionalId, newPosition });
    try {
      const { error } = await supabase
        .from('barber_queue')
        .update({ queue_position: newPosition })
        .eq('profissional_id', professionalId);

      if (error) throw error;

      await fetchProfessionals();
      toast.success('Posição atualizada!');
    } catch (error) {
      toast.error('Erro ao mover profissional');
      console.error('[BarberQueue] Erro em moveBarberPosition:', error);
    }
  };

  // Função para atualizar a ordem de toda a fila
  const updateQueueOrder = async (newQueue: any[]) => {
    console.log('[BarberQueue] Atualizando a ordem completa da fila...');
    try {
      const updates = newQueue.map((item, index) => ({
        profissional_id: item.id,
        queue_position: index + 1,
      }));

      const { error } = await supabase.from('barber_queue').upsert(updates, {
        onConflict: 'profissional_id',
      });

      if (error) {
        toast.error('Falha ao reordenar a fila.');
        console.error('[BarberQueue] Erro ao atualizar ordem:', error);
        throw error;
      }

      console.log('[BarberQueue] Ordem da fila atualizada com sucesso no banco.');
      await fetchProfessionals(); // Revalida os dados locais

    } catch (error) {
       console.error('[BarberQueue] Erro em updateQueueOrder:', error);
       throw error;
    }
  };

  useEffect(() => {
    console.log('[BarberQueue] Componente montado, buscando fila...');
    fetchProfessionals();
  }, []);

  return {
    queue,
    loading,
    // Novas funções principais
    handleAtendimento,
    handlePassarVez,
    handleToggleAtivo,
    reorganizarPorAtendimentos,
    zerarLista,
    // Funções legadas para compatibilidade
    addService,
    skipTurn,
    toggleBarberStatus,
    moveBarberPosition,
    refetch: fetchProfessionals,
    resetDailyServices,
    reorganizeByServices,
    updateQueueOrder,
  };
}; 