"use client";
import { useEffect, useState } from "react";
import {
  Card, CardBody, CardHeader, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Avatar, Chip, Switch, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Tooltip, Divider, Spacer
} from "@heroui/react";
import {
  Crown, Users, ArrowUp, ArrowDown, MoreVertical, UserCheck, SkipForward, RefreshCw, GripVertical, Trophy, Clock, Target
} from "lucide-react";
import { useAuth, useRequireAuth, usePermissions } from "@/lib/contexts/AuthContext";
import { toast } from "react-hot-toast";
import { useBarberQueue } from "@/hooks/useBarberQueue";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

export default function ListaDaVez() {
  useRequireAuth();
  const { isAdmin } = usePermissions();
  const { queue, loading, addService, skipTurn, toggleBarberStatus, moveBarberPosition, refetch, resetDailyServices } = useBarberQueue();
  const [localQueue, setLocalQueue] = useState(queue);
  useEffect(() => { setLocalQueue(queue); }, [queue]);

  const sensors = useSensors(useSensor(PointerSensor));
  const currentBarber = localQueue.find(b => b.queue_position === 1 && b.is_active);
  const activeBarbers = localQueue.filter(b => b.is_active).length;
  const totalServicesToday = localQueue.reduce((acc, b) => acc + b.daily_services, 0);
  const maxToday = Math.max(...localQueue.map(b => b.daily_services), 0);

  // Drag and drop
  const handleDragEnd = async (event: any) => {
    if (!isAdmin) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localQueue.findIndex(item => item.id === active.id);
    const newIndex = localQueue.findIndex(item => item.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const newQueue = arrayMove(localQueue, oldIndex, newIndex);
      setLocalQueue(newQueue);
      for (let i = 0; i < newQueue.length; i++) {
        await moveBarberPosition(newQueue[i].id, i + 1);
      }
      refetch();
      toast.success('Ordem da fila atualizada!');
    }
  };

  // Reset fila
  const handleResetQueue = async () => {
    if (!isAdmin) return;
    await resetDailyServices();
    for (let i = 0; i < localQueue.length; i++) {
      await moveBarberPosition(localQueue[i].id, i + 1);
    }
    refetch();
    toast.success('Lista zerada!');
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardBody className="text-center p-4">
            <Users className="mx-auto text-primary-500 mb-2" size={24} />
            <p className="text-2xl font-bold">{activeBarbers}</p>
            <p className="text-sm text-default-500">Ativos</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="text-center p-4">
            <Clock className="mx-auto text-success-500 mb-2" size={24} />
            <p className="text-2xl font-bold">{totalServicesToday}</p>
            <p className="text-sm text-default-500">Hoje</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="text-center p-4">
            <Target className="mx-auto text-secondary-500 mb-2" size={24} />
            <p className="text-2xl font-bold">{localQueue.reduce((acc, b) => acc + b.total_services, 0)}</p>
            <p className="text-sm text-default-500">Total</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm">
          <CardBody className="text-center p-4">
            <Trophy className="mx-auto text-warning-500 mb-2" size={24} />
            <p className="text-2xl font-bold">{maxToday}</p>
            <p className="text-sm text-default-500">Maior Hoje</p>
          </CardBody>
        </Card>
      </div>

      {/* Barbeiro da Vez */}
      <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Crown className="text-warning-500" size={24} />
            <h2 className="text-xl font-bold">Barbeiro da Vez</h2>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          {currentBarber ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar
                  src={currentBarber.barber.avatar_url}
                  name={currentBarber.barber.nome}
                  size="lg"
                  className="ring-4 ring-primary-200"
                />
                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {currentBarber.barber.nome}
                  </h3>
                  <p className="text-default-600">
                    {currentBarber.daily_services} atendimentos hoje • {currentBarber.total_services} total
                  </p>
                  <Chip color="warning" size="sm" variant="flat" className="mt-1">
                    1º na fila
                  </Chip>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  color="success"
                  size="lg"
                  onPress={() => addService(currentBarber.id)}
                  startContent={<UserCheck size={18} />}
                >
                  Atendeu
                </Button>
                <Button
                  color="warning"
                  variant="bordered"
                  size="lg"
                  onPress={() => skipTurn(currentBarber.id)}
                  startContent={<SkipForward size={18} />}
                >
                  Passou a Vez
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-default-500 py-8">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum barbeiro ativo</h3>
              <p>Ative pelo menos um barbeiro para iniciar os atendimentos</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Fila de Atendimento */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Fila de Atendimento</h3>
            <p className="text-default-500 text-sm">
              Ordem automática: quem atendeu menos fica na frente
            </p>
          </div>
          <div className="flex gap-2">
            <Chip color="success" variant="flat">
              {activeBarbers} Ativos
            </Chip>
            <Chip color="default" variant="flat">
              {localQueue.length - activeBarbers} Inativos
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          {isAdmin && (
            <div className="flex justify-end mb-4">
              <Tooltip content="Zera todos os atendimentos e reordena a fila">
                <Button color="danger" variant="shadow" size="lg" onPress={handleResetQueue} startContent={<RefreshCw size={18} />}>
                  Zerar Lista
                </Button>
              </Tooltip>
            </div>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={localQueue.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <Table aria-label="Fila de barbeiros" removeWrapper className="rounded-xl overflow-hidden">
                <TableHeader>
                  <TableColumn width="10%">POSIÇÃO</TableColumn>
                  <TableColumn width="30%">BARBEIRO</TableColumn>
                  <TableColumn width="10%">HOJE</TableColumn>
                  <TableColumn width="10%">TOTAL</TableColumn>
                  <TableColumn width="15%">STATUS</TableColumn>
                  <TableColumn width="25%">AÇÕES</TableColumn>
                </TableHeader>
                <TableBody>
                  {localQueue.map((item) => (
                    <TableRow key={item.id} id={item.id} className={item.is_active ? "" : "opacity-60"}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <Tooltip content="Arraste para reordenar">
                              <span className="cursor-grab active:cursor-grabbing p-1 hover:bg-default-100 rounded">
                                <GripVertical size={16} className="text-default-400" />
                              </span>
                            </Tooltip>
                          )}
                          <Chip
                            color={item.queue_position === 1 ? "warning" : "default"}
                            variant={item.queue_position === 1 ? "solid" : "flat"}
                            size="sm"
                            className="min-w-[40px]"
                          >
                            {item.queue_position}º
                          </Chip>
                          {item.queue_position === 1 && item.is_active && (
                            <Crown size={16} className="text-warning-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={item.barber.avatar_url}
                            name={item.barber.nome}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-foreground">{item.barber.nome}</p>
                            <p className="text-small text-default-500">
                              {item.barber.telefone}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={item.daily_services > 0 ? "primary" : "default"}
                          variant="flat"
                          size="sm"
                        >
                          {item.daily_services}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={item.total_services > 0 ? "secondary" : "default"}
                          variant="flat"
                          size="sm"
                        >
                          {item.total_services}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Switch
                          isSelected={item.is_active}
                          onValueChange={(value) => toggleBarberStatus(item.id, value)}
                          isDisabled={!isAdmin}
                          color="success"
                          size="sm"
                        >
                          {item.is_active ? "Ativo" : "Inativo"}
                        </Switch>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Tooltip content="Adicionar atendimento">
                            <Button
                              size="sm"
                              color="primary"
                              variant="flat"
                              onPress={() => addService(item.id)}
                              startContent={<UserCheck size={14} />}
                              isDisabled={!item.is_active}
                            >
                              +1
                            </Button>
                          </Tooltip>
                          {isAdmin && (
                            <Dropdown>
                              <DropdownTrigger>
                                <Button size="sm" variant="light" isIconOnly>
                                  <MoreVertical size={14} />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu>
                                <DropdownItem startContent={<ArrowUp size={14} />} onPress={() => moveBarberPosition(item.id, item.queue_position - 1)}>
                                  Subir na fila
                                </DropdownItem>
                                <DropdownItem startContent={<ArrowDown size={14} />} onPress={() => moveBarberPosition(item.id, item.queue_position + 1)}>
                                  Descer na fila
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SortableContext>
          </DndContext>
        </CardBody>
      </Card>
    </div>
  );
} 