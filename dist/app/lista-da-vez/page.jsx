"use client";
import { useEffect, useState } from "react";
import { useRequireAuth, usePermissions } from "@/lib/contexts/AuthContext";
import { toast } from "sonner";
import { useBarberQueue } from "@/hooks/useBarberQueue";
import { createClient } from "@/lib/supabase/client";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
const supabase = createClient();
// Função para atualizar ordem da fila
const updateQueueOrder = async (newOrderedQueue) => {
    try {
        console.log('🔄 Atualizando ordem da fila:', newOrderedQueue);
        for (let i = 0; i < newOrderedQueue.length; i++) {
            const { error } = await supabase
                .from('barber_queue')
                .update({ queue_position: i + 1 })
                .eq('profissional_id', newOrderedQueue[i].id);
            if (error) {
                console.error(`❌ Erro ao atualizar posição do barbeiro ${newOrderedQueue[i].id}:`, error);
                throw error;
            }
        }
        console.log('✅ Ordem da fila atualizada com sucesso');
    }
    catch (error) {
        console.error('💥 Erro ao atualizar ordem:', error);
        throw error;
    }
};
// Função para atendimento (+1)
const handleAtendimento = async (event, barbeiroId, refetch) => {
    // CRÍTICO: Parar propagação do evento
    event.preventDefault();
    event.stopPropagation();
    try {
        console.log('🔢 [+1] Botão clicado para:', barbeiroId);
        console.log('🔄 Processando atendimento para ID:', barbeiroId);
        // 1. Buscar barbeiro atual
        const { data: barbeiro, error: fetchError } = await supabase
            .from('barber_queue')
            .select('*')
            .eq('profissional_id', barbeiroId)
            .single();
        if (fetchError || !barbeiro) {
            console.error('❌ Erro ao buscar barbeiro:', fetchError);
            toast.error('Erro ao buscar dados do barbeiro');
            return;
        }
        console.log('✅ Barbeiro encontrado:', barbeiro);
        // 2. Preparar dados com tipos corretos
        const updateData = {
            total_services: parseInt(String(barbeiro.total_services || 0)) + 1,
            daily_services: parseInt(String(barbeiro.daily_services || 0)) + 1,
            last_service_date: new Date().toISOString().split('T')[0]
        };
        console.log('📤 [+1] Dados sendo enviados:', JSON.stringify(updateData, null, 2));
        console.log('🔍 [+1] Tipos dos campos:', Object.entries(updateData).map(([key, value]) => `${key}: ${typeof value} (${value})`));
        // 3. Incrementar contadores
        const { error: updateError } = await supabase
            .from('barber_queue')
            .update(updateData)
            .eq('profissional_id', barbeiroId);
        if (updateError) {
            console.error('❌ Erro ao atualizar barbeiro:', updateError);
            toast.error('Erro ao atualizar dados do barbeiro');
            return;
        }
        console.log('✅ [+1] Barbeiro atualizado com sucesso');
        // 4. Reorganizar fila
        await reorganizarFila();
        // 5. Recarregar dados
        if (typeof refetch === 'function') {
            await refetch();
        }
        console.log('✅ [+1] Incremento concluído');
        toast.success("Atendimento registrado com sucesso!");
    }
    catch (error) {
        console.error('💥 [+1] Erro geral ao processar atendimento:', error);
        toast.error("Erro ao processar atendimento");
    }
};
// Função para passar a vez
const handlePassarVez = async (event, barbeiroId, refetch) => {
    // CRÍTICO: Parar propagação do evento
    event.preventDefault();
    event.stopPropagation();
    try {
        console.log('➡️ [PASSAR] Botão clicado para:', barbeiroId);
        console.log('🔄 Processando passar vez para ID:', barbeiroId);
        const { data: barbeiro, error: fetchError } = await supabase
            .from('barber_queue')
            .select('*')
            .eq('profissional_id', barbeiroId)
            .single();
        if (fetchError || !barbeiro) {
            console.error('❌ Erro ao buscar barbeiro:', fetchError);
            toast.error('Erro ao buscar dados do barbeiro');
            return;
        }
        console.log('✅ [PASSAR] Barbeiro encontrado para passar vez:', barbeiro);
        // Preparar dados com tipos corretos - CORRIGIDO para evitar string "true" em campo integer
        const updateData = {
            total_services: parseInt(String(barbeiro.total_services || 0)) + 1,
            daily_services: parseInt(String(barbeiro.daily_services || 0)) + 1,
            passou_vez: parseInt(String(barbeiro.passou_vez || 0)) + 1, // CORRIGIDO: incrementar contador numérico ao invés de boolean
        };
        console.log('📤 [PASSAR] Dados sendo enviados para passar vez:', JSON.stringify(updateData, null, 2));
        console.log('🔍 [PASSAR] Tipos dos campos:', Object.entries(updateData).map(([key, value]) => `${key}: ${typeof value} (${value})`));
        const { error: updateError } = await supabase
            .from('barber_queue')
            .update(updateData)
            .eq('profissional_id', barbeiroId);
        if (updateError) {
            console.error('❌ Erro ao atualizar barbeiro:', updateError);
            toast.error('Erro ao atualizar dados do barbeiro');
            return;
        }
        await reorganizarFila();
        if (typeof refetch === 'function') {
            await refetch();
        }
        console.log('✅ [PASSAR] Passou a vez concluído');
        toast.success("Vez passada com sucesso!");
    }
    catch (error) {
        console.error('💥 [PASSAR] Erro ao processar passar vez:', error);
        toast.error("Erro ao processar passar vez");
    }
};
// Função para reorganizar fila
const reorganizarFila = async () => {
    try {
        console.log('🔄 Reorganizando fila...');
        // 1. Buscar todos os barbeiros ativos
        const { data: barbeiros, error: fetchError } = await supabase
            .from('barber_queue')
            .select('*')
            .eq('is_active', true)
            .order('total_services', { ascending: true });
        if (fetchError) {
            console.error('❌ Erro ao buscar barbeiros:', fetchError);
            return;
        }
        console.log('✅ Barbeiros encontrados:', barbeiros);
        if (barbeiros && barbeiros.length > 0) {
            // 2. Atualizar posições
            for (let i = 0; i < barbeiros.length; i++) {
                const { error: updateError } = await supabase
                    .from('barber_queue')
                    .update({ queue_position: i + 1 })
                    .eq('profissional_id', barbeiros[i].profissional_id);
                if (updateError) {
                    console.error(`❌ Erro ao atualizar posição do barbeiro ${barbeiros[i].profissional_id}:`, updateError);
                }
            }
        }
        console.log('✅ Fila reorganizada com sucesso');
    }
    catch (error) {
        console.error('💥 Erro ao reorganizar fila:', error);
    }
};
// Função para toggle ativo/inativo
const handleToggleAtivo = async (event, barbeiroId, refetch) => {
    // CRÍTICO: Parar propagação do evento
    event.stopPropagation();
    const novoStatus = event.target.checked;
    try {
        console.log('🔄 [TOGGLE] Alterando status do barbeiro:', barbeiroId, 'para:', novoStatus);
        // Preparar dados com tipos corretos
        const updateData = {
            is_active: Boolean(novoStatus) // Garantir que é boolean
        };
        console.log('📤 [TOGGLE] Dados sendo enviados para toggle:', JSON.stringify(updateData, null, 2));
        const { error } = await supabase
            .from('barber_queue')
            .update(updateData)
            .eq('profissional_id', barbeiroId);
        if (error) {
            console.error('❌ Erro ao alterar status:', error);
            toast.error('Erro ao alterar status do barbeiro');
            return;
        }
        if (novoStatus) {
            await reorganizarFila();
        }
        if (typeof refetch === 'function') {
            await refetch();
        }
        console.log('✅ [TOGGLE] Status alterado com sucesso');
        toast.success(`Barbeiro ${novoStatus ? 'ativado' : 'inativado'} com sucesso!`);
    }
    catch (error) {
        console.error('💥 [TOGGLE] Erro ao alterar status:', error);
        toast.error("Erro ao alterar status do barbeiro");
    }
};
// Função para zerar lista
const zerarLista = async (refetch) => {
    try {
        if (!confirm('Tem certeza que deseja zerar a lista? Esta ação irá resetar todos os atendimentos.'))
            return;
        console.log('🔄 Zerando lista...');
        // Preparar dados com tipos corretos
        const updateData = {
            total_services: 0,
            daily_services: 0,
            last_service_date: null,
            passou_vez: 0 // CORRIGIDO: zerar contador numérico ao invés de boolean false
        };
        console.log('📤 Dados sendo enviados para zerar:', JSON.stringify(updateData, null, 2));
        const { error } = await supabase
            .from('barber_queue')
            .update(updateData)
            .eq('is_active', true);
        if (error) {
            console.error('❌ Erro ao zerar lista:', error);
            toast.error('Erro ao zerar a lista');
            return;
        }
        await reorganizarFila();
        if (typeof refetch === 'function') {
            await refetch();
        }
        console.log('✅ Lista zerada com sucesso');
        toast.success("Lista zerada com sucesso!");
    }
    catch (error) {
        console.error('💥 Erro ao zerar lista:', error);
        toast.error("Erro ao zerar a lista");
    }
};
// Componente da linha da tabela arrastável
const DraggableRow = ({ item, refetch, loading }) => {
    var _a, _b, _c, _d, _e;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, } = useSortable({ id: item.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 10 : 'auto',
    };
    // Handlers específicos para cada botão
    const handleIncrementClick = (event) => {
        console.log('🔢 Botão +1 clicado - iniciando handler');
        handleAtendimento(event, item.id, refetch);
    };
    const handlePassClick = (event) => {
        console.log('➡️ Botão Passar clicado - iniciando handler');
        handlePassarVez(event, item.id, refetch);
    };
    const handleToggleClick = (event) => {
        console.log('🔄 Toggle clicado - iniciando handler');
        handleToggleAtivo(event, item.id, refetch);
    };
    return (<tr ref={setNodeRef} style={style} className="bg-white hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span {...listeners} {...attributes} className="cursor-grab touch-none text-gray-400 hover:text-gray-600">
            ⋮
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {item.queue_position}º
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img className="h-10 w-10 rounded-full ring-2 ring-gray-200" src={((_a = item.barber) === null || _a === void 0 ? void 0 : _a.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(((_b = item.barber) === null || _b === void 0 ? void 0 : _b.nome) || 'User')}&background=365E78&color=fff`} alt={(_c = item.barber) === null || _c === void 0 ? void 0 : _c.nome}/>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {(_d = item.barber) === null || _d === void 0 ? void 0 : _d.nome}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {((_e = item.barber) === null || _e === void 0 ? void 0 : _e.telefone) || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {item.daily_services || 0}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          {item.total_services || 0}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {item.is_active ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {/* ESTRUTURA CORRIGIDA: Botões separados, sem conflito */}
        <div className="flex items-center space-x-2">
          <button type="button" onClick={handleIncrementClick} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
            +1
          </button>
          <button type="button" onClick={handlePassClick} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
            Passar
          </button>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={item.is_active} onChange={handleToggleClick} className="sr-only peer" disabled={loading}/>
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
          </label>
        </div>
      </td>
    </tr>);
};
export default function ListaDaVezPage() {
    var _a, _b, _c, _d;
    useRequireAuth();
    const { isAdmin } = usePermissions();
    const { queue, loading: queueLoading, refetch, } = useBarberQueue();
    const [localQueue, setLocalQueue] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (queue) {
            setLocalQueue(queue);
        }
    }, [queue]);
    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    }));
    const handleDragEnd = async (event) => {
        if (!isAdmin)
            return;
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = localQueue.findIndex((item) => item.id === active.id);
            const newIndex = localQueue.findIndex((item) => item.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrderedQueue = arrayMove(localQueue, oldIndex, newIndex);
                setLocalQueue(newOrderedQueue);
                try {
                    setLoading(true);
                    await updateQueueOrder(newOrderedQueue);
                    toast.success("Ordem da fila atualizada com sucesso!");
                }
                catch (error) {
                    toast.error("Falha ao atualizar a ordem da fila.");
                    setLocalQueue(queue); // Reverte em caso de erro
                }
                finally {
                    setLoading(false);
                }
            }
        }
    };
    const handleReorganizarFila = async () => {
        try {
            setLoading(true);
            await reorganizarFila();
            await refetch();
            toast.success("Fila reorganizada com sucesso!");
        }
        catch (error) {
            toast.error("Erro ao reorganizar fila");
        }
        finally {
            setLoading(false);
        }
    };
    const handleZerarLista = async () => {
        try {
            setLoading(true);
            await zerarLista(refetch);
        }
        catch (error) {
            toast.error("Erro ao zerar lista");
        }
        finally {
            setLoading(false);
        }
    };
    const nextInLine = (queue === null || queue === void 0 ? void 0 : queue.find(b => b.is_active && b.queue_position === 1)) || (queue === null || queue === void 0 ? void 0 : queue.find(b => b.is_active)) || null;
    if (queueLoading) {
        return (<div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>);
    }
    return (<div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Card do Barbeiro Ativo */}
      {nextInLine && (<div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img className="h-12 w-12 rounded-full ring-4 ring-green-200" src={((_a = nextInLine.barber) === null || _a === void 0 ? void 0 : _a.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(((_b = nextInLine.barber) === null || _b === void 0 ? void 0 : _b.nome) || 'User')}&background=365E78&color=fff`} alt={(_c = nextInLine.barber) === null || _c === void 0 ? void 0 : _c.nome}/>
              <div className="ml-4">
                <div className="text-lg font-semibold text-gray-900">
                  {(_d = nextInLine.barber) === null || _d === void 0 ? void 0 : _d.nome}
                </div>
                <div className="text-sm text-green-600 font-medium">
                  1º na fila
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" onClick={(event) => handleAtendimento(event, nextInLine.id, refetch)} disabled={loading}>
                ✓ Atendeu
              </button>
              <button type="button" className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" onClick={(event) => handlePassarVez(event, nextInLine.id, refetch)} disabled={loading}>
                → Passou a Vez
              </button>
            </div>
          </div>
        </div>)}

      {/* Card de Instruções */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm text-blue-800">
            <strong>Reorganização Manual:</strong> Arraste o ícone ⋮ ao lado da posição para reorganizar manualmente a fila.
          </p>
          <p className="text-sm text-blue-800">
            <strong>Zerar Lista:</strong> Reseta tanto os atendimentos diários quanto os totais de todos os barbeiros.
          </p>
        </div>
      </div>

      {/* Tabela de Barbeiros - ESTRUTURA CORRIGIDA */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Fila de Atendimento</h2>
            <div className="flex space-x-2">
              <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleReorganizarFila} disabled={loading}>
                🔄 Reorganizar por Atendimentos
              </button>
              <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleZerarLista} disabled={loading}>
                🗑️ Zerar Lista
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {/* ESTRUTURA CORRIGIDA: DndContext FORA do tbody */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barbeiro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hoje
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <SortableContext items={localQueue.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <tbody className="bg-white divide-y divide-gray-200">
                  {localQueue.map((item) => (<DraggableRow key={item.id} item={item} refetch={refetch} loading={loading}/>))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      </div>
    </div>);
}
