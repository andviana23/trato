"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import { DashboardData } from '@/lib/types/dashboard'
import { toast } from 'sonner'

interface Props {
  data: DashboardData | null
  loading: boolean
  onUpdate?: () => void
}

export default function MetaCard({ data, loading, onUpdate }: Props) {
  const [isOpen, setOpen] = useState(false)
  const [goalAmount, setGoalAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/dashboard/metas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          goalAmount: parseFloat(goalAmount),
          description
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao salvar meta')
      }

      toast.success('Meta salva com sucesso!')
      onOpenChange(false)
      onUpdate?.()
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar meta')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja remover a meta deste mês?')) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/dashboard/metas?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao remover meta')
      }

      toast.success('Meta removida com sucesso!')
      onOpenChange(false)
      onUpdate?.()
    } catch (error) {
      console.error('Erro ao remover meta:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao remover meta')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-blue-100 text-sm font-medium">Meta Mensal</p>
              <p className="text-3xl font-bold">
                {loading ? '...' : formatCurrency(data?.goal?.amount || 0)}
              </p>
              <p className="text-blue-200 text-sm mt-1">
                {data?.goal?.description || 'Nenhuma meta definida'}
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="bg-blue-400 p-3 rounded-lg">
                <ArrowTrendingUpIcon className="w-6 h-6" />
              </div>
              <Button size="sm" variant="secondary" className="text-white" onClick={() => setOpen(true)}>
                Editar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={(o)=>!o&&setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir Meta Mensal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Valor da Meta (ex.: 50000.00)"
              type="number"
              step="0.01"
              value={goalAmount}
              onChange={(e)=>setGoalAmount(e.target.value)}
            />
            <Input
              placeholder="Descrição (opcional)"
              value={description}
              onChange={(e)=>setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>Remover Meta</Button>
            <Button onClick={handleSave} disabled={isSaving}>Salvar Meta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 


