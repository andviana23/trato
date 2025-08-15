"use client";
import { useEffect, useState } from "react";
import { useRequireAuth, usePermissions } from "@/lib/contexts/AuthContext";
import { toast } from "sonner";
import { useBarberQueue, type QueueItem } from "@/hooks/useBarberQueue";
import {
  Container,
  Heading,
  HStack,
  Card,
  Text,
  Button,
  Table,
  Avatar,
  Badge,
  Switch,
  Box,
  Spinner,
  Alert,
} from "@chakra-ui/react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';

// Row arrastável usando Chakra Table
type DraggableRowProps = {
  item: QueueItem;
  loading: boolean;
  onPlusOne: (e: React.MouseEvent, id: string) => void;
  onPass: (e: React.MouseEvent, id: string) => void;
  onToggle: (checked: boolean, id: string) => void;
};

function DraggableRow({ item, loading, onPlusOne, onPass, onToggle }: DraggableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 10 : 'auto' as any,
  };

  return (
    <Table.Row ref={setNodeRef as any} style={style} bg="whiteAlpha.50" _hover={{ bg: "whiteAlpha.100" }}>
      <Table.Cell>
        <HStack align="center" gap={2}>
          <Box {...listeners} {...attributes} cursor="grab" userSelect="none" color="whiteAlpha.600">⋮</Box>
          <Badge>{item.queue_position}º</Badge>
        </HStack>
      </Table.Cell>
      <Table.Cell>
        <HStack>
          <Avatar.Root size="sm">
            <Avatar.Image src={item.barber?.avatar_url || ''} />
            <Avatar.Fallback>{(item.barber?.nome || 'U').charAt(0)}</Avatar.Fallback>
          </Avatar.Root>
          <Text fontWeight="medium">{item.barber?.nome}</Text>
        </HStack>
      </Table.Cell>
      <Table.Cell>{item.barber?.telefone || 'N/A'}</Table.Cell>
      <Table.Cell>
        <Badge colorPalette="green">{item.daily_services || 0}</Badge>
      </Table.Cell>
      <Table.Cell>
        <Badge colorPalette="yellow">{item.total_services || 0}</Badge>
      </Table.Cell>
      <Table.Cell>
        <Badge colorPalette={item.is_active ? 'green' : 'gray'}>{item.is_active ? 'Ativo' : 'Inativo'}</Badge>
      </Table.Cell>
      <Table.Cell>
        <HStack gap={2}>
           <Button size="xs" colorPalette="green" onClick={(e) => onPlusOne(e, item.id)} disabled={loading}>+1</Button>
           <Button size="xs" variant="outline" colorPalette="blue" onClick={(e) => onPass(e, item.id)} disabled={loading}>Passar</Button>
          <Switch.Root checked={item.is_active} onCheckedChange={(d) => onToggle(Boolean(d.checked), item.id)} disabled={loading} />
        </HStack>
      </Table.Cell>
    </Table.Row>
  );
}

export default function ListaDaVezPage() {
  useRequireAuth();
  const { isAdmin } = usePermissions();
  const {
    queue,
    loading: queueLoading,
    refetch,
    updateQueueOrder,
    handleAtendimento,
    handlePassarVez,
    handleToggleAtivo,
    reorganizarPorAtendimentos,
    zerarLista,
  } = useBarberQueue();

  const [localQueue, setLocalQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (queue) setLocalQueue(queue);
  }, [queue]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isAdmin) return;
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = localQueue.findIndex((i) => i.id === active.id);
      const newIndex = localQueue.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrdered = arrayMove(localQueue, oldIndex, newIndex);
        setLocalQueue(newOrdered);
        try {
          setLoading(true);
          await updateQueueOrder(newOrdered.map((i) => ({ id: i.id })));
          toast.success("Ordem da fila atualizada com sucesso!");
        } catch {
          toast.error("Falha ao atualizar a ordem da fila.");
          setLocalQueue(queue);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  // Wrappers para parar propagação durante o drag
  const onPlusOne = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    setLoading(true);
    try { await handleAtendimento(id); } finally { setLoading(false); }
  };
  const onPass = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    setLoading(true);
    try { await handlePassarVez(id); } finally { setLoading(false); }
  };
  const onToggle = async (checked: boolean, id: string) => {
    setLoading(true);
    try { await handleToggleAtivo(id, checked); } finally { setLoading(false); }
  };

  const nextInLine: QueueItem | null = queue?.find((b) => b.is_active && b.queue_position === 1) || queue?.find((b) => b.is_active) || null;

  if (queueLoading) {
    return (
      <Container maxW="7xl" py={6}>
        <HStack justify="center" py={10}><Spinner /></HStack>
      </Container>
    );
  }

  return (
    <Container maxW="7xl" py={6}>
      {/* Card do Barbeiro Ativo */}
      {nextInLine && (
        <Card.Root bg="green.900" borderWidth="1px" borderColor="green.700" rounded="lg" mb={6}>
          <Card.Body>
            <HStack justify="space-between" align="center">
              <HStack>
                <Avatar.Root size="md">
                  <Avatar.Image src={nextInLine.barber?.avatar_url || ''} />
                  <Avatar.Fallback>{(nextInLine.barber?.nome || 'U').charAt(0)}</Avatar.Fallback>
                </Avatar.Root>
                <Box>
                  <Text fontSize="lg" fontWeight="semibold">{nextInLine.barber?.nome}</Text>
                  <Text fontSize="sm" color="green.200">1º na fila</Text>
                </Box>
              </HStack>
              <HStack gap={3}>
               <Button colorPalette="green" onClick={(e) => onPlusOne(e, nextInLine.id)} disabled={loading}>✓ Atendeu</Button>
                 <Button variant="outline" colorPalette="green" onClick={(e) => onPass(e, nextInLine.id)} disabled={loading}>→ Passou a Vez</Button>
              </HStack>
            </HStack>
          </Card.Body>
        </Card.Root>
      )}

      {/* Card de Instruções */}
      <Alert.Root status="info" mb={4}>
        <Alert.Indicator />
        <Alert.Title>Reorganização Manual</Alert.Title>
        <Alert.Description>
          Arraste o ícone "⋮" ao lado da posição para reorganizar manualmente a fila. "Zerar Lista" reseta os atendimentos diários e totais.
        </Alert.Description>
      </Alert.Root>

      {/* Tabela de Barbeiros */}
      <Card.Root>
        <Card.Header>
          <HStack justify="space-between" align="center">
            <Heading size="sm">Fila de Atendimento</Heading>
            <HStack gap={2}>
              <Button colorPalette="purple" onClick={async () => { setLoading(true); try { await reorganizarPorAtendimentos(); await refetch(); } catch { toast.error('Erro ao reorganizar fila'); } finally { setLoading(false); } }} disabled={loading}>
                🔄 Reorganizar por Atendimentos
              </Button>
              <Button colorPalette="red" onClick={async () => { setLoading(true); try { await zerarLista(); } catch { toast.error('Erro ao zerar lista'); } finally { setLoading(false); } }} disabled={loading}>
                🗑️ Zerar Lista
              </Button>
            </HStack>
          </HStack>
        </Card.Header>
        <Card.Body>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Posição</Table.ColumnHeader>
                  <Table.ColumnHeader>Barbeiro</Table.ColumnHeader>
                  <Table.ColumnHeader>Telefone</Table.ColumnHeader>
                  <Table.ColumnHeader>Hoje</Table.ColumnHeader>
                  <Table.ColumnHeader>Total</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader>Ações</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <SortableContext items={localQueue.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <Table.Body>
                  {localQueue.map((item) => (
                    <DraggableRow key={item.id} item={item} loading={loading} onPlusOne={onPlusOne} onPass={onPass} onToggle={onToggle} />
                  ))}
                </Table.Body>
              </SortableContext>
            </Table.Root>
          </DndContext>
        </Card.Body>
      </Card.Root>
    </Container>
  );
} 
