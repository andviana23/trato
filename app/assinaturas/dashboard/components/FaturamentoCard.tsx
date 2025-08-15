"use client"

import { Card, CardContent } from '@/components/ui/card'
import { CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { DashboardData } from '@/lib/types/dashboard'

interface Props {
  data: DashboardData | null
  loading: boolean
}

export default function FaturamentoCard({ data, loading }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const calculatePercentage = () => {
    if (!data?.goal?.amount || !data?.revenue?.total) return 0
    return Math.min((data.revenue.total / data.goal.amount) * 100, 100)
  }

  const getStatusColor = () => {
    const percentage = calculatePercentage()
    if (percentage >= 100) return 'success'
    if (percentage >= 75) return 'warning'
    return 'danger'
  }

  // Mantido simples: usamos somente a barra de progresso

  return (
    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-green-100 text-sm font-medium">Faturamento Mensal</p>
            <p className="text-3xl font-bold">
              {loading ? '...' : formatCurrency(data?.revenue?.total || 0)}
            </p>
            {data?.goal && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-200">Meta: {formatCurrency(data.goal.amount)}</span>
                  <span className="text-green-200">
                    {calculatePercentage().toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded bg-white/30 overflow-hidden">
                  <div
                    className={`h-full ${getStatusColor() === 'success' ? 'bg-green-300' : getStatusColor() === 'warning' ? 'bg-yellow-300' : 'bg-red-300'}`}
                    style={{ width: `${calculatePercentage()}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="bg-green-400 p-3 rounded-lg">
            <CurrencyDollarIcon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
