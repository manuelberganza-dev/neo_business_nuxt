export type DashboardMetric = {
  title: string
  value: string
  helper: string
  tone: 'blue' | 'green' | 'amber' | 'rose'
}

export type TopProduct = {
  id: number | string
  name: string
  quantity: number
  total: number
}

export type LowStockProduct = {
  id: number | string
  name: string
  warehouse: string
  quantity: number
  minStock: number
}

export type LatestSale = {
  id: number | string
  number: string
  time: string
  cashier: string
  total: number
  method: string
}

export type PaymentSlice = {
  method: string
  total: number
  percent: number
}

export type ActivityItem = {
  id: string
  title: string
  description: string
  tone: 'default' | 'success' | 'warning' | 'danger'
  createdAt: string
}

export type DashboardRealtimeEvent = {
  event?: string
  payload?: Record<string, unknown>
  sent_at?: string
}
