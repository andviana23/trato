"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface TimelineData {
  month: number;
  year: number;
  monthName: string;
  revenue: number;
  bySource: {
    asaasTrato: number;
    asaasAndrey: number;
    external: number;
  };
  paymentsCount: number;
  overdueCount: number;
  goal: number;
  goalAchievement: number;
}

interface TimelineResponse {
  success: boolean;
  year: number;
  timeline: TimelineData[];
  totals: {
    totalRevenue: number;
    totalPayments: number;
    totalOverdue: number;
    averageMonthlyRevenue: number;
    bestMonth: TimelineData;
    worstMonth: TimelineData;
  };
  bySource: {
    asaasTrato: number;
    asaasAndrey: number;
    external: number;
  };
}

interface RevenueTimelineProps {
  selectedYear: number;
}

export default function RevenueTimeline({ selectedYear }: RevenueTimelineProps) {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  useEffect(() => {
    const fetchTimelineData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/dashboard/revenue-timeline?year=${selectedYear}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
    };
    fetchTimelineData();
  }, [selectedYear]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando linha do tempo...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-500 mb-4">Erro: {error}</p>
              <button 
                onClick={fetchTimelineData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  // Preparar dados para o gráfico
  const chartData = data.timeline.map(item => ({
    name: item.monthName,
    receita: item.revenue,
    meta: item.goal,
    asaasTrato: item.bySource.asaasTrato,
    asaasAndrey: item.bySource.asaasAndrey,
    external: item.bySource.external,
    pagamentos: item.paymentsCount,
    inadimplentes: item.overdueCount
  }));

  return (
    <div className="space-y-6">
      {/* Resumo Anual */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Receita Total</p>
                <p className="text-2xl font-bold">{formatCurrency(data.totals.totalRevenue)}</p>
              </div>
              <CurrencyDollarIcon className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Média Mensal</p>
                <p className="text-2xl font-bold">{formatCurrency(data.totals.averageMonthlyRevenue)}</p>
              </div>
              <ArrowTrendingUpIcon className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Pagamentos</p>
                <p className="text-2xl font-bold">{data.totals.totalPayments}</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Inadimplentes</p>
                <p className="text-2xl font-bold">{data.totals.totalOverdue}</p>
              </div>
              <ArrowTrendingDownIcon className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Melhor e Pior Mês */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-green-800 mb-2">Melhor Mês</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium">{data.totals.bestMonth.monthName}</p>
                <p className="text-2xl font-bold text-green-800">
                  {formatCurrency(data.totals.bestMonth.revenue)}
                </p>
                <p className="text-sm text-green-600">
                  {data.totals.bestMonth.paymentsCount} pagamentos
                </p>
              </div>
              <ArrowTrendingUpIcon className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-red-800 mb-2">Pior Mês</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 font-medium">{data.totals.worstMonth.monthName}</p>
                <p className="text-2xl font-bold text-red-800">
                  {formatCurrency(data.totals.worstMonth.revenue)}
                </p>
                <p className="text-sm text-red-600">
                  {data.totals.worstMonth.paymentsCount} pagamentos
                </p>
              </div>
              <ArrowTrendingDownIcon className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Linha do Tempo - {selectedYear}</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 rounded text-sm ${
                  chartType === 'line' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Linha
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded text-sm ${
                  chartType === 'bar' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Barras
              </button>
            </div>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `${label} ${selectedYear}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="receita" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Receita"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="meta" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Meta"
                  />
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `${label} ${selectedYear}`}
                  />
                  <Legend />
                  <Bar dataKey="asaasTrato" fill="#3b82f6" name="ASAAS Trato" />
                  <Bar dataKey="asaasAndrey" fill="#10b981" name="ASAAS Andrey" />
                  <Bar dataKey="external" fill="#8b5cf6" name="Externos" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detalhamento Mensal */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Detalhamento Mensal</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4">Mês</th>
                  <th className="text-right py-2 px-4">Receita</th>
                  <th className="text-right py-2 px-4">Meta</th>
                  <th className="text-right py-2 px-4">Atingimento</th>
                  <th className="text-right py-2 px-4">Pagamentos</th>
                  <th className="text-right py-2 px-4">Inadimplentes</th>
                </tr>
              </thead>
              <tbody>
                {data.timeline.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4 font-medium">{item.monthName}</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(item.revenue)}</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(item.goal)}</td>
                    <td className="py-2 px-4 text-right">
                      <Badge variant="secondary">{formatPercentage(item.goalAchievement)}</Badge>
                    </td>
                    <td className="py-2 px-4 text-right">{item.paymentsCount}</td>
                    <td className="py-2 px-4 text-right">
                      <span className={item.overdueCount > 0 ? 'text-red-600' : 'text-green-600'}>
                        {item.overdueCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 


