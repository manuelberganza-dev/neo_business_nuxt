import { isRecord, toNumber, unwrapCollection } from '~/types/business'

export type SalesRangeReport = {
  salesCount: number
  subtotal: number
  tax: number
  discount: number
  total: number
  from: string
  to: string
}

export type GrossMarginReport = {
  revenue: number
  cost: number
  grossMargin: number
}

export type TopProductReport = {
  productId: number
  sku: string
  productName: string
  quantity: number
  total: number
}

export type SalesByCashierReport = {
  cashierId: number
  cashierName: string
  salesCount: number
  total: number
}

export type PaymentMethodReport = {
  method: string
  amount: number
  paymentsCount: number
}

function num(value: unknown, fallback = 0) {
  return toNumber(value) ?? fallback
}

function str(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

export function normalizeSalesRange(value: unknown): SalesRangeReport {
  if (!isRecord(value)) return { salesCount: 0, subtotal: 0, tax: 0, discount: 0, total: 0, from: '', to: '' }
  return {
    salesCount: num(value.sales_count),
    subtotal: num(value.subtotal),
    tax: num(value.tax),
    discount: num(value.discount),
    total: num(value.total),
    from: str(value.from),
    to: str(value.to),
  }
}

export function normalizeGrossMargin(value: unknown): GrossMarginReport {
  if (!isRecord(value)) return { revenue: 0, cost: 0, grossMargin: 0 }
  return {
    revenue: num(value.revenue),
    cost: num(value.cost),
    grossMargin: num(value.gross_margin),
  }
}

export function normalizeTopProduct(value: unknown): TopProductReport | null {
  if (!isRecord(value)) return null
  const productId = toNumber(value.product_id)
  if (!productId) return null
  return {
    productId,
    sku: str(value.sku),
    productName: str(value.product_name, 'Producto'),
    quantity: num(value.quantity),
    total: num(value.total),
  }
}

export function normalizeSalesByCashier(value: unknown): SalesByCashierReport | null {
  if (!isRecord(value)) return null
  const cashierId = toNumber(value.cashier_id)
  if (!cashierId) return null
  return {
    cashierId,
    cashierName: str(value.cashier_name, 'Cajero'),
    salesCount: num(value.sales_count),
    total: num(value.total),
  }
}

export function normalizePaymentMethod(value: unknown): PaymentMethodReport | null {
  if (!isRecord(value)) return null
  const method = str(value.method ?? value.payment_method)
  if (!method) return null
  return {
    method,
    amount: num(value.amount ?? value.total),
    paymentsCount: num(value.payments_count ?? value.count),
  }
}

export function unwrapTopProducts(payload: unknown): TopProductReport[] {
  return unwrapCollection<unknown>(payload, 'products')
    .map(normalizeTopProduct)
    .filter((item): item is TopProductReport => Boolean(item))
}

export function unwrapSalesByCashier(payload: unknown): SalesByCashierReport[] {
  return unwrapCollection<unknown>(payload, 'cashiers')
    .map(normalizeSalesByCashier)
    .filter((item): item is SalesByCashierReport => Boolean(item))
}

export function unwrapPaymentMethods(payload: unknown): PaymentMethodReport[] {
  return unwrapCollection<unknown>(payload, 'payment_methods')
    .map(normalizePaymentMethod)
    .filter((item): item is PaymentMethodReport => Boolean(item))
}
