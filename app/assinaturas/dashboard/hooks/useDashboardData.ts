'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardData } from '@/lib/types/dashboard'

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/dashboard/faturamento-mensal')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar dados do dashboard')
      }

      setData(result)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregar dados iniciais
  useEffect(() => {
    loadData()
  }, [loadData])

  // Atualizar dados a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadData])

  return {
    data,
    loading,
    error,
    refreshData: loadData
  }
} 