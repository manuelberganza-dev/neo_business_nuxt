import { isRecord, toNumber, unwrapCollection } from '~/types/business'

export type PosProduct = {
  id: number
  name: string
  sku?: string
  barcode?: string
  price: number
  cost: number
  taxRate: number
  active: boolean
  trackInventory: boolean
}

export type PosCustomer = {
  id: number
  name: string
  documentType?: string
  documentNumber?: string
  nit?: string
  nrc?: string
  email?: string
  phone?: string
}

export type PaymentMethodOption = {
  id: number
  code: string
  name: string
  active: boolean
}

export type CashSession = {
  id: number
  cashRegisterId: number
  userId?: number
  openingAmount: number
  closingAmount?: number
  expectedAmount?: number
  differenceAmount?: number
  status: string
  openedAt?: string
  closedAt?: string
}

export type SaleSummary = {
  id: number
  saleNumber: string
  customerId?: number
  customerName: string
  cashierName: string
  total: number
  status: string
  soldAt?: string
}

export type SaleDetail = SaleSummary & {
  subtotal: number
  tax: number
  discount: number
  branchId?: number
  warehouseId?: number
  cashSessionId?: number
  voidReason?: string
  voidedAt?: string
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function boolValue(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function numberValue(value: unknown, fallback = 0) {
  return toNumber(value) ?? fallback
}

export function normalizePosProduct(value: unknown): PosProduct | null {
  if (!isRecord(value)) return null
  const id = toNumber(value.id)
  const name = stringValue(value.name)
  if (!id || !name) return null

  return {
    id,
    name,
    sku: stringValue(value.sku),
    barcode: stringValue(value.barcode),
    price: numberValue(value.price),
    cost: numberValue(value.cost),
    taxRate: numberValue(value.tax_rate),
    active: boolValue(value.active, true),
    trackInventory: boolValue(value.track_inventory, true),
  }
}

export function normalizePosCustomer(value: unknown): PosCustomer | null {
  if (!isRecord(value)) return null
  const id = toNumber(value.id)
  const name = stringValue(value.name)
  if (!id || !name) return null

  return {
    id,
    name,
    documentType: stringValue(value.document_type),
    documentNumber: stringValue(value.document_number),
    nit: stringValue(value.nit),
    nrc: stringValue(value.nrc),
    email: stringValue(value.email),
    phone: stringValue(value.phone),
  }
}

export function normalizePaymentMethod(value: unknown): PaymentMethodOption | null {
  if (!isRecord(value)) return null
  const id = toNumber(value.id)
  const code = stringValue(value.code)
  const name = stringValue(value.name)
  if (!id || !code || !name) return null

  return {
    id,
    code,
    name,
    active: boolValue(value.active, true),
  }
}

export function normalizeCashSession(value: unknown): CashSession | null {
  if (!isRecord(value)) return null
  const id = toNumber(value.id)
  const cashRegisterId = toNumber(value.cash_register_id)
  if (!id || !cashRegisterId) return null

  return {
    id,
    cashRegisterId,
    userId: toNumber(value.user_id),
    openingAmount: numberValue(value.opening_amount),
    closingAmount: toNumber(value.closing_amount),
    expectedAmount: toNumber(value.expected_amount),
    differenceAmount: toNumber(value.difference_amount),
    status: stringValue(value.status) ?? 'open',
    openedAt: stringValue(value.opened_at),
    closedAt: stringValue(value.closed_at),
  }
}

export function normalizeSaleSummary(value: unknown): SaleSummary | null {
  if (!isRecord(value)) return null
  const id = toNumber(value.id)
  if (!id) return null

  return {
    id,
    saleNumber: stringValue(value.sale_number) ?? `Venta ${id}`,
    customerId: toNumber(value.customer_id),
    customerName: stringValue(value.customer_name) ?? 'Cliente final',
    cashierName: stringValue(value.cashier_name) ?? 'Caja',
    total: numberValue(value.total),
    status: stringValue(value.status) ?? 'paid',
    soldAt: stringValue(value.sold_at),
  }
}

export function normalizeSaleDetail(value: unknown): SaleDetail | null {
  const summary = normalizeSaleSummary(value)
  if (!summary || !isRecord(value)) return null

  return {
    ...summary,
    subtotal: numberValue(value.subtotal),
    tax: numberValue(value.tax),
    discount: numberValue(value.discount),
    branchId: toNumber(value.branch_id),
    warehouseId: toNumber(value.warehouse_id),
    cashSessionId: toNumber(value.cash_session_id),
    voidReason: stringValue(value.void_reason),
    voidedAt: stringValue(value.voided_at),
  }
}

export function unwrapProducts(payload: unknown) {
  return unwrapCollection<unknown>(payload, 'products')
    .map(normalizePosProduct)
    .filter((item): item is PosProduct => Boolean(item))
}

export function unwrapCustomers(payload: unknown) {
  return unwrapCollection<unknown>(payload, 'customers')
    .map(normalizePosCustomer)
    .filter((item): item is PosCustomer => Boolean(item))
}

export function unwrapPaymentMethods(payload: unknown) {
  return unwrapCollection<unknown>(payload, 'payment_methods')
    .map(normalizePaymentMethod)
    .filter((item): item is PaymentMethodOption => Boolean(item))
}

export function unwrapSales(payload: unknown) {
  return unwrapCollection<unknown>(payload, 'sales')
    .map(normalizeSaleSummary)
    .filter((item): item is SaleSummary => Boolean(item))
}
