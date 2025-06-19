"use client";
import { useEffect, useState } from "react";
import {
  Card, CardBody, CardHeader, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Avatar, Chip, Switch, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Tooltip, Divider, Spacer
} from "@heroui/react";
import {
  Crown, Users, ArrowUp, ArrowDown, MoreVertical, UserCheck, SkipForward, RefreshCw, GripVertical, Trophy, Clock, Target, Info, Shuffle
} from "lucide-react";
import { useAuth, useRequireAuth, usePermissions } from "@/lib/contexts/AuthContext";
import { toast } from "react-hot-toast";
import { useBarberQueue } from "@/hooks/useBarberQueue";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// Componente de linha arrastável
const DraggableRow = ({ item, idx, onAddService, onSkipTurn, onToggleStatus }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isDragging ? 'shadow-lg' : ''}`}
    >
      <td className="px-4 py-3 font-bold text-blue-700 align-middle">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-1 rounded hover:bg-gray-100"
          >
            <GripVertical size={16} className="text-gray-400" />
          </div>
          {item.queue_position}º
        </div>
      </td>
      <td className="px-4 py-3 flex items-center gap-2 align-middle">
        <Avatar
          src={item.barber?.avatar_url || '/img/default-avatar.png'}
          name={item.barber?.nome || 'Barbeiro'}
          size="sm"
          className="ring-1 ring-blue-100"
        />
        <span className="font-medium text-gray-900">{item.barber?.nome || 'Barbeiro não encontrado'}</span>
      </td>
      <td className="px-4 py-3 text-gray-600 align-middle">{item.barber?.telefone || 'Telefone não informado'}</td>
      <td className="px-4 py-3 text-center align-middle">
        <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded">{item.daily_services}</span>
      </td>
      <td className="px-4 py-3 text-center align-middle">
        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">{item.total_services}</span>
      </td>
      <td className="px-4 py-3 text-center align-middle">
        <span className={`text-xs px-2 py-1 rounded ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{item.is_active ? 'Ativo' : 'Inativo'}</span>
      </td>
      <td className="px-4 py-3 text-center align-middle">
        <div className="flex flex-row gap-2 justify-center items-center">
          <Button
            size="sm"
            color="success"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-none"
            onPress={() => onAddService(item.id)}
            startContent={<UserCheck size={14} />}
            isDisabled={!item.is_active}
          >
            +1
          </Button>
          <Button
            size="sm"
            color="default"
            variant="flat"
            className="bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 shadow-none"
            onPress={() => onSkipTurn(item.id)}
            startContent={<SkipForward size={14} />}
            isDisabled={!item.is_active}
          >
            Passar
          </Button>
          <Switch
            isSelected={item.is_active}
            onValueChange={(value) => onToggleStatus(item.id, value)}
            color="success"
            size="sm"
          >
            {item.is_active ? 'Ativo' : 'Inativo'}
          </Switch>
        </div>
      </td>
    </tr>
  );
};

export default function ListaDaVez() {
  useRequireAuth();
  const { isAdmin } = usePermissions();
  const { queue, loading, addService, skipTurn, toggleBarberStatus, moveBarberPosition, refetch, resetDailyServices, reorganizeByServices } = useBarberQueue();
  const [localQueue, setLocalQueue] = useState(queue);

  useEffect(() => {
    if (queue.length > 0) {
      setLocalQueue(queue);
    }
  }, [queue]);

  const sensors = useSensors(useSensor(PointerSensor));
  const currentBarber = queue.find(item => item.is_active) || null;
  const activeBarbers = queue.filter(b => b.is_active).length;
  const totalServicesToday = queue.reduce((acc, b) => acc + b.daily_services, 0);
  const maxToday = Math.max(...queue.map(b => b.daily_services), 0);

  const handleAddService = async (barberId: string) => {
    try {
      await addService(barberId);
    } catch (error) {
      console.error('Erro ao adicionar serviço:', error);
    }
  };

  const handleSkipTurn = async (barberId: string) => {
    try {
      await skipTurn(barberId);
    } catch (error) {
      console.error('Erro ao passar a vez:', error);
    }
  };

  const handleToggleStatus = async (barberId: string, isActive: boolean) => {
    try {
      await toggleBarberStatus(barberId, isActive);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleReorganizeByServices = async () => {
    try {
      await reorganizeByServices();
    } catch (error) {
      console.error('Erro ao reorganizar fila:', error);
    }
  };

  // Drag and drop
  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isAdmin) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    try {
      const oldIndex = localQueue.findIndex(item => item.id === active.id);
      const newIndex = localQueue.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newQueue = arrayMove(localQueue, oldIndex, newIndex);
        setLocalQueue(newQueue);
        
        // Atualizar as posições no banco de dados
        for (let i = 0; i < newQueue.length; i++) {
          await moveBarberPosition(newQueue[i].id, i + 1);
        }
        
        await refetch();
        toast.success('Ordem da fila atualizada!');
      }
    } catch (error) {
      console.error('Erro ao reordenar fila:', error);
      toast.error('Erro ao atualizar ordem da fila');
    }
  };

  // Reset fila
  const handleResetQueue = async () => {
    if (!isAdmin) return;
    try {
      await resetDailyServices();
      toast.success('Lista zerada!');
    } catch (error) {
      console.error('Erro ao resetar fila:', error);
      toast.error('Erro ao zerar lista');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4" size={48} />
          <p>Carregando fila de atendimento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-2 md:px-0">
      {/* Card do Barbeiro da Vez */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex items-center gap-4">
          {currentBarber ? (
            <>
              <Avatar
                src={currentBarber.barber?.avatar_url || '/img/default-avatar.png'}
                name={currentBarber.barber?.nome || 'Barbeiro'}
                size="lg"
                className="ring-2 ring-blue-200"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900">{currentBarber.barber?.nome || 'Barbeiro não encontrado'}</span>
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">1º na fila</span>
                </div>
                <span className="text-gray-500 text-sm">{currentBarber.barber?.telefone || 'Telefone não informado'}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  color="success"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-none"
                  onPress={() => handleAddService(currentBarber.id)}
                  startContent={<UserCheck size={16} />}
                >
                  Atendeu
                </Button>
                <Button
                  color="default"
                  variant="flat"
                  size="sm"
                  className="bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 shadow-none"
                  onPress={() => handleSkipTurn(currentBarber.id)}
                  startContent={<SkipForward size={16} />}
                >
                  Passou a Vez
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center w-full">
              <Users size={36} className="text-gray-200 mb-1" />
              <h2 className="text-base font-semibold text-gray-700">Nenhum barbeiro ativo</h2>
              <p className="text-gray-400 text-sm">Ative pelo menos um barbeiro para iniciar os atendimentos</p>
            </div>
          )}
        </div>
      </div>

      {/* Informação sobre a regra de ordenação */}
      <div className="max-w-5xl mx-auto mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <Info size={16} className="text-blue-600" />
          <p className="text-blue-800 text-sm">
            <strong>Reorganização Manual:</strong> Arraste o ícone <GripVertical size={12} className="inline" /> ao lado da posição para reorganizar manualmente a fila. 
            A fila também é reorganizada automaticamente após cada atendimento.
            <br />
            <strong>Zerar Lista:</strong> Reseta tanto os atendimentos diários quanto os totais de todos os barbeiros.
          </p>
        </div>
      </div>

      {/* Tabela da Fila de Atendimento */}
      <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
        <div className="flex justify-between items-center px-4 pt-4 pb-2">
          <h3 className="text-lg font-bold text-gray-900">Fila de Atendimento</h3>
          <div className="flex gap-2">
            <Button
              color="primary"
              variant="flat"
              size="sm"
              className="bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 shadow-none"
              onPress={handleReorganizeByServices}
              startContent={<Shuffle size={16} />}
            >
              Reorganizar por Atendimentos
            </Button>
            <Button
              color="danger"
              variant="flat"
              size="sm"
              className="bg-white border border-gray-200 text-red-600 hover:bg-red-50 shadow-none"
              onPress={handleResetQueue}
              startContent={<RefreshCw size={16} />}
            >
              Zerar Lista
            </Button>
          </div>
        </div>
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Posição</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Barbeiro</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Telefone</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700">Hoje</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700">Total</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700">Status</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">Nenhum barbeiro na fila</td>
                </tr>
              ) : (
                <SortableContext items={queue.map(item => item.id)} strategy={verticalListSortingStrategy}>
                  {queue.map((item, idx) => (
                    <DraggableRow
                      key={item.id}
                      item={item}
                      idx={idx}
                      onAddService={handleAddService}
                      onSkipTurn={handleSkipTurn}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))}
                </SortableContext>
              )}
            </tbody>
          </table>
        </DndContext>
      </div>
    </div>
  );
} 