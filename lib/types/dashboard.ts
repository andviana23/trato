export interface MonthlyRevenue {
  id: string
  year: number
  month: number
  asaas_trato_revenue: number
  asaas_andrey_revenue: number
  external_revenue: number
  total_revenue: number
  active_subscribers: number
  overdue_subscribers: number
  created_at: string
  updated_at: string
}

export interface MonthlyGoal {
  id: string
  year: number
  month: number
  goal_amount: number
  description?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface DashboardData {
  month: number
  year: number
  revenue: {
    asaasTrato: number
    asaasAndrey: number
    external: number
    total: number
  }
  overdueCount: number
  goal?: {
    amount: number
    description?: string
  }
  updatedAt: string
}

export interface RevenueSource {
  name: string
  value: number
  percentage: number
}

export interface ChartDataPoint {
  month: number
  year: number
  revenue: number
  goal: number
} 