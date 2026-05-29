import { isRecord, toNumber, unwrapCollection } from '~/types/business'

export type InventoryItem = {
  id: number
  productId: number
  productName: string
  sku: string
  barcode: string
  warehouseId: number
  warehouseName: string
  quantity: number
  minStock: number
  lowStock: boolean
}

export type StockMovement = {
  id: number
  productId: number
  productName: string
  warehouseId: number
  warehouseName: string
  userId?: number
  movementType: string
  qty: number
  unitCost: number
  referenceType: string
  referenceId?: number
  notes: string
  occurredAt: string
}

export type InventoryProductOption = {
  id: number
  name: string
  sku: string
  cost?: number
}

export type InventoryWarehouseOption = {
  id: number
  name: string
  branchName: string
}

export function normalizeInventoryItem(value: unknown): InventoryItem | null {
  if (!isRecord(value)) return null

  const id = toNumber(value.id)
  const productId = toNumber(value.product_id)
  const warehouseId = toNumber(value.warehouse_id)

  if (!id || !productId || !warehouseId) return null

  return {
    id,
    productId,
    productName: String(value.product_name ?? 'Producto sin nombre'),
    sku: String(value.sku ?? ''),
    barcode: String(value.barcode ?? ''),
    warehouseId,
    warehouseName: String(value.warehouse_name ?? 'Bodega sin nombre'),
    quantity: toNumber(value.quantity) ?? 0,
    minStock: toNumber(value.min_stock) ?? 0,
    lowStock: Boolean(value.low_stock),
  }
}

export function normalizeStockMovement(value: unknown): StockMovement | null {
  if (!isRecord(value)) return null

  const id = toNumber(value.id)
  const productId = toNumber(value.product_id)
  const warehouseId = toNumber(value.warehouse_id)

  if (!id || !productId || !warehouseId) return null

  return {
    id,
    productId,
    productName: String(value.product_name ?? 'Producto sin nombre'),
    warehouseId,
    warehouseName: String(value.warehouse_name ?? 'Bodega sin nombre'),
    userId: toNumber(value.user_id),
    movementType: String(value.movement_type ?? 'movement'),
    qty: toNumber(value.qty) ?? 0,
    unitCost: toNumber(value.unit_cost) ?? 0,
    referenceType: String(value.reference_type ?? ''),
    referenceId: toNumber(value.reference_id),
    notes: String(value.notes ?? ''),
    occurredAt: String(value.occurred_at ?? ''),
  }
}

export function normalizeProductOption(value: unknown): InventoryProductOption | null {
  if (!isRecord(value)) return null

  const id = toNumber(value.id)
  if (!id) return null

  return {
    id,
    name: String(value.name ?? 'Producto sin nombre'),
    sku: String(value.sku ?? ''),
    cost: toNumber(value.cost),
  }
}

export function normalizeWarehouseOption(value: unknown): InventoryWarehouseOption | null {
  if (!isRecord(value)) return null

  const id = toNumber(value.id)
  if (!id) return null

  return {
    id,
    name: String(value.name ?? 'Bodega sin nombre'),
    branchName: String(value.branch_name ?? ''),
  }
}

export function unwrapInventory(payload: unknown) {
  return unwrapCollection<unknown>(payload, 'inventory').map(normalizeInventoryItem).filter(Boolean) as InventoryItem[]
}

export function unwrapMovements(payload: unknown, key = 'stock_movements') {
  return unwrapCollection<unknown>(payload, key).map(normalizeStockMovement).filter(Boolean) as StockMovement[]
}
