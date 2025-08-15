"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { DashboardData } from '@/lib/types/dashboard'

interface Props {
  data: DashboardData | null
  loading: boolean
}

const FONTES = [
  {
    name: 'Asaas Trato',
    key: 'asaasTrato',
    color: 'primary',
    icon: '💈'
  },
  {
    name: 'Asaas Andrey',
    key: 'asaasAndrey',
    color: 'secondary',
    icon: '✂️'
  },
  {
    name: 'Outras Fontes',
    key: 'external',
    color: 'success',
    icon: '💰'
  }
] as const

export default function FontesCards({ data, loading }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const calculatePercentage = (value: number, total: number) => {
    if (!total) return 0
    return (value / total) * 100
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {FONTES.map(fonte => {
        const value = data?.revenue?.[fonte.key] || 0
        const total = data?.revenue?.total || 0
        const percentage = calculatePercentage(value, total)

        return (
          <Card key={fonte.key} className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{fonte.icon}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {fonte.name}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {loading ? '...' : formatCurrency(value)}
              </p>
              <Progress 
                value={percentage} 
                color={fonte.color}
                className="h-2"
              />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 

