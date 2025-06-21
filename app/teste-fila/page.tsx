"use client";
import BarberQueueTest from '@/components/BarberQueueTest';
import { useRequireAuth } from '@/lib/contexts/AuthContext';

export default function TesteFilaPage() {
  useRequireAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Teste da Fila de Barbeiros</h1>
          <p className="text-gray-600">
            Esta página permite testar todas as funcionalidades da fila de barbeiros.
            Execute os testes para verificar se tudo está funcionando corretamente.
          </p>
        </div>
        
        <BarberQueueTest />
      </div>
    </div>
  );
} 
