"use client"

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { DashboardData } from '@/lib/types/dashboard'
import { toast } from 'sonner';

interface Props {
  data: DashboardData | null
  loading: boolean
}

export default function InadimplentesCard({ data, loading }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusText = (count: number) => {
    if (count === 0) return 'Sem inadimplentes'
    if (count === 1) return '1 inadimplente'
    return `${count} inadimplentes`
  }

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/asaas/cancelar-assinatura/${subscriptionId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Assinatura cancelada com sucesso!');
        // Atualizar dados após cancelamento
      } else {
        toast.error('Erro ao cancelar assinatura');
      }
    } catch {
      toast.error('Erro ao cancelar assinatura');
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white" onClick={() => setIsModalOpen(true)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-red-100 text-sm font-medium">Inadimplentes</p>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-3xl font-bold">
                  {loading ? '...' : data?.overdueCount || 0}
                </p>
                <Badge className="text-white bg-white/20">
                  {getStatusText(data?.overdueCount || 0)}
                </Badge>
              </div>
              <p className="text-red-200 text-sm mt-2">
                Assinantes com pagamentos atrasados
              </p>
            </div>
            <div className="bg-red-400 p-3 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={(open:boolean)=>!open&&setIsModalOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inadimplentes</DialogTitle>
          </DialogHeader>
          <div>
            {data?.overdueCount > 0 ? (
              <ul>
                {data.revenueTimeline?.map((item, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span>{item.customers?.join(', ') || 'Cliente não informado'}</span>
                    <Button color="danger" onClick={() => handleCancelSubscription(item.id)}>
                      Cancelar Assinatura
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Sem inadimplentes no momento.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 


