import { isRecord, toNumber, unwrapCollection } from '~/types/business'

export type PurchaseSummary = {
  id: number
  supplierId?: number
  supplierName: string
  warehouseId?: number
  warehouseName: string
  documentType: string
  invoiceNumber: string
  total: number
  status: string
  purchasedAt?: string
  createdAt?: string
}

export type PurchaseOption = {
  id: number
  name: string
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function numberValue(value: unknown, fallback = 0) {
  return toNumber(value) ?? fallback
}

export function normalizePurchase(value: unknown): PurchaseSummary | null {
  if (!isRecord(value)) return null
  const id = toNumber(value.id)
  if (!id) return null

  return {
    id,
    supplierId: toNumber(value.supplier_id),
    supplierName: stringValue(value.supplier_name) ?? stringValue(value.supplier?.['name']) ?? 'Proveedor',
    warehouseId: toNumber(value.warehouse_id),
    warehouseName: stringValue(value.warehouse_name) ?? stringValue(value.warehouse?.['name']) ?? 'Bodega',
    documentType: stringValue(value.document_type) ?? 'Documento',
    invoiceNumber: stringValue(value.invoice_number) ?? `Compra ${id}`,
    total: numberValue(value.total),
    status: stringValue(value.status) ?? 'received',
    purchasedAt: stringValue(value.purchased_at),
    createdAt: stringValue(value.created_at),
  }
}

export function normalizePurchaseOption(value: unknown): PurchaseOption | null {
  if (!isRecord(value)) return null
  const id = toNumber(value.id)
  const name = stringValue(value.name)
  if (!id || !name) return null

  return { id, name }
}

export function unwrapPurchases(payload: unknown) {
  return unwrapCollection<unknown>(payload, 'purchases')
    .map(normalizePurchase)
    .filter((item): item is PurchaseSummary => Boolean(item))
}

export function unwrapPurchaseOptions(payload: unknown, key: string) {
  return unwrapCollection<unknown>(payload, key)
    .map(normalizePurchaseOption)
    .filter((item): item is PurchaseOption => Boolean(item))
}
