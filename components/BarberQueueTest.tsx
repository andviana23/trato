"use client";
import { useState } from "react";
import {
  Button,
  Card,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Badge,
} from "@/components/ui/chakra-adapters";
import { useBarberQueue } from "@/hooks/useBarberQueue";

export default function BarberQueueTest() {
  const {
    queue,
    loading,
    handleAtendimento,
    handlePassarVez,
    handleToggleAtivo,
    reorganizarPorAtendimentos,
    zerarLista,
    refetch,
  } = useBarberQueue();

  const [testResults, setTestResults] = useState<string[]>([]);
  const addTestResult = (result: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testAtendimento = async () => {
    if (queue.length === 0) {
      addTestResult("❌ Nenhum barbeiro na fila para testar");
      return;
    }
    const firstBarber = queue[0];
    const initialServices = firstBarber.total_services;
    try {
      await handleAtendimento(firstBarber.id);
      addTestResult(`✅ Atendimento registrado para ${firstBarber.barber?.nome}`);
      setTimeout(async () => {
        await refetch();
        const updatedBarber = queue.find((b) => b.id === firstBarber.id);
        if (updatedBarber && updatedBarber.total_services > initialServices) {
          addTestResult(`✅ Contadores incrementados corretamente`);
        } else {
          addTestResult(`❌ Contadores não foram incrementados`);
        }
      }, 1000);
    } catch (error) {
      addTestResult(`❌ Erro no teste de atendimento: ${error}`);
    }
  };

  const testPassarVez = async () => {
    if (queue.length === 0) {
      addTestResult("❌ Nenhum barbeiro na fila para testar");
      return;
    }
    const firstBarber = queue[0];
    const initialPassouVez = firstBarber.passou_vez || 0;
    try {
      await handlePassarVez(firstBarber.id);
      addTestResult(`✅ Passou a vez registrado para ${firstBarber.barber?.nome}`);
      setTimeout(async () => {
        await refetch();
        const updatedBarber = queue.find((b) => b.id === firstBarber.id);
        if (updatedBarber && (updatedBarber.passou_vez || 0) > initialPassouVez) {
          addTestResult(`✅ Passou vez incrementado corretamente`);
        } else {
          addTestResult(`❌ Passou vez não foi incrementado`);
        }
      }, 1000);
    } catch (error) {
      addTestResult(`❌ Erro no teste de passar vez: ${error}`);
    }
  };

  const testToggleAtivo = async () => {
    if (queue.length === 0) {
      addTestResult("❌ Nenhum barbeiro na fila para testar");
      return;
    }
    const firstBarber = queue[0];
    const newStatus = !firstBarber.is_active;
    try {
      await handleToggleAtivo(firstBarber.id, newStatus);
      addTestResult(`✅ Status alterado para ${newStatus ? "ativo" : "inativo"}`);
      setTimeout(async () => {
        await refetch();
        const updatedBarber = queue.find((b) => b.id === firstBarber.id);
        if (updatedBarber && updatedBarber.is_active === newStatus) {
          addTestResult(`✅ Status alterado corretamente`);
        } else {
          addTestResult(`❌ Status não foi alterado`);
        }
      }, 1000);
    } catch (error) {
      addTestResult(`❌ Erro no teste de toggle: ${error}`);
    }
  };

  const testReorganizar = async () => {
    try {
      await reorganizarPorAtendimentos();
      addTestResult(`✅ Fila reorganizada por atendimentos`);
    } catch (error) {
      addTestResult(`❌ Erro na reorganização: ${error}`);
    }
  };

  const testZerarLista = async () => {
    try {
      await zerarLista();
      addTestResult(`✅ Lista zerada`);
    } catch (error) {
      addTestResult(`❌ Erro ao zerar lista: ${error}`);
    }
  };

  const clearTestResults = () => setTestResults([]);

  return (
    <div className="p-6 space-y-6">
      <Card.Root>
        <Card.Header>
          <h2 className="text-xl font-bold">Teste da Fila de Barbeiros</h2>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Button colorScheme="green" onClick={testAtendimento} disabled={loading || queue.length === 0}>
              Testar +1
            </Button>
            <Button colorScheme="orange" onClick={testPassarVez} disabled={loading || queue.length === 0}>
              Testar Passar
            </Button>
            <Button colorScheme="blue" onClick={testToggleAtivo} disabled={loading || queue.length === 0}>
              Testar Toggle
            </Button>
            <Button colorScheme="purple" onClick={testReorganizar} disabled={loading}>
              Testar Reorganizar
            </Button>
            <Button colorScheme="red" onClick={testZerarLista} disabled={loading}>
              Testar Zerar
            </Button>
          </div>

          <div className="flex gap-2 mb-4">
            <Button size="sm" variant="ghost" onClick={refetch}>
              Atualizar Dados
            </Button>
            <Button size="sm" variant="ghost" colorScheme="red" onClick={clearTestResults}>
              Limpar Logs
            </Button>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Status Atual da Fila</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-2xl font-bold text-blue-600">{queue.length}</div>
                <div className="text-sm text-blue-600">Total na Fila</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-2xl font-bold text-green-600">{queue.filter((b) => b.is_active).length}</div>
                <div className="text-sm text-green-600">Ativos</div>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <div className="text-2xl font-bold text-orange-600">
                  {queue.reduce((acc, b) => acc + (b.passou_vez || 0), 0)}
                </div>
                <div className="text-sm text-orange-600">Total Passou Vez</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="text-2xl font-bold text-purple-600">
                  {queue.reduce((acc, b) => acc + b.total_services, 0)}
                </div>
                <div className="text-sm text-purple-600">Total Atendimentos</div>
              </div>
            </div>
          </div>

          <Table aria-label="Fila atual para teste">
            <TableHeader>
              <TableColumn>POS</TableColumn>
              <TableColumn>NOME</TableColumn>
              <TableColumn>HOJE</TableColumn>
              <TableColumn>TOTAL</TableColumn>
              <TableColumn>PASSOU</TableColumn>
              <TableColumn>STATUS</TableColumn>
            </TableHeader>
            <TableBody>
              {queue.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell>{item.queue_position}º</TableCell>
                  <TableCell>{item.barber?.nome}</TableCell>
                  <TableCell>
                    <StatBadge kind="success"  variant="subtle">
                      {item.daily_services}
                    </StatBadge>
                  </TableCell>
                  <TableCell>
                    <StatBadge kind="brand"  variant="subtle">
                      {item.total_services}
                    </StatBadge>
                  </TableCell>
                  <TableCell>
                    <StatBadge kind="accent"  variant="subtle">
                      {item.passou_vez || 0}
                    </StatBadge>
                  </TableCell>
                  <TableCell>
                    <Badge colorScheme={item.is_active ? "green" : undefined} variant="subtle">
                      {item.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {queue.length === 0 && !loading && (
            <div className="text-sm text-gray-500 mt-2">Nenhum barbeiro na fila</div>
          )}
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <h3 className="text-lg font-bold">Logs de Teste</h3>
        </Card.Header>
        <Card.Body>
          <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">Nenhum teste executado ainda</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, idx) => (
                  <div key={idx} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card.Body>
      </Card.Root>
    </div>
  );
}
