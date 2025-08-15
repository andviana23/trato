"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartDataPoint } from '@/lib/types/dashboard'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export default function FaturamentoChart() {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Array com os últimos 5 anos
  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  )

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/dashboard/metas/historico?year=${selectedYear}`)
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Erro ao carregar dados do gráfico')
        }

        setData(result.data)
      } catch (error) {
        console.error('Erro ao carregar dados do gráfico:', error)
        setError(error instanceof Error ? error.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedYear])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatMonth = (month: number) => {
    return new Date(2000, month - 1).toLocaleDateString('pt-BR', { month: 'short' })
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent>
          <p className="text-red-700">Erro ao carregar gráfico: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-gray-500">Carregando dados do gráfico...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Faturamento vs Metas - Anual
          </h2>
          <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(Number(val))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={formatMonth}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Faturamento"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="goal"
                name="Meta"
                stroke="#6366F1"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 



