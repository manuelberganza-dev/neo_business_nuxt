import { acceptHMRUpdate, defineStore } from 'pinia'
import { unwrapCollection } from '~/types/business'
import type { InventoryItem, InventoryProductOption, InventoryWarehouseOption, StockMovement } from '~/types/inventory'
import {
  normalizeProductOption,
  normalizeWarehouseOption,
  unwrapInventory,
  unwrapMovements,
} from '~/types/inventory'

export type StockAdjustmentPayload = {
  product_id: number | ''
  warehouse_id: number | ''
  movement_type: string
  qty: string
  unit_cost: string
  notes: string
  allow_negative: boolean
}

export type StockTransferPayload = {
  product_id: number | ''
  from_warehouse_id: number | ''
  to_warehouse_id: number | ''
  qty: string
  notes: string
}

export const useInventoryStore = defineStore('inventory', () => {
  const api = useApi()

  const items = ref<InventoryItem[]>([])
  const lowStockItems = ref<InventoryItem[]>([])
  const movements = ref<StockMovement[]>([])
  const kardex = ref<StockMovement[]>([])
  const warehouseHistory = ref<StockMovement[]>([])
  const products = ref<InventoryProductOption[]>([])
  const warehouses = ref<InventoryWarehouseOption[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const success = ref('')

  const totalUnits = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const stockedProducts = computed(() => new Set(items.value.map((item) => item.productId)).size)
  const activeWarehouses = computed(() => new Set(items.value.map((item) => item.warehouseId)).size)

  async function loadOptions() {
    const [productsResponse, warehousesResponse] = await Promise.all([
      api.get<unknown>('/products', { query: { limit: 200, active: true } }),
      api.get<unknown>('/warehouses', { query: { limit: 200, active: true } }),
    ])

    products.value = unwrapCollection<unknown>(productsResponse, 'products')
      .map(normalizeProductOption)
      .filter((item): item is InventoryProductOption => Boolean(item))
    warehouses.value = unwrapCollection<unknown>(warehousesResponse, 'warehouses')
      .map(normalizeWarehouseOption)
      .filter((item): item is InventoryWarehouseOption => Boolean(item))
  }

  async function loadInventory(filters: { warehouseId?: number | null; productId?: number | null; lowStock?: boolean } = {}) {
    loading.value = true
    error.value = ''

    try {
      await loadOptions()
      const query: Record<string, string | number | boolean> = {}
      if (filters.warehouseId) query.warehouse_id = filters.warehouseId
      if (filters.productId) query.product_id = filters.productId
      if (filters.lowStock) query.low_stock = true

      const [inventoryResponse, lowStockResponse, movementsResponse] = await Promise.all([
        api.get<unknown>('/inventory', { query }),
        api.get<unknown>('/inventory', { query: { low_stock: true } }),
        api.get<unknown>('/stock_movements', { query: { limit: 80 } }),
      ])

      items.value = unwrapInventory(inventoryResponse)
      lowStockItems.value = unwrapInventory(lowStockResponse)
      movements.value = unwrapMovements(movementsResponse)
    }
    catch (loadError) {
      error.value = loadError instanceof Error ? loadError.message : 'No pudimos cargar inventario.'
    }
    finally {
      loading.value = false
    }
  }

  async function updateMinStock(itemId: number, minStock: string | number) {
    saving.value = true
    error.value = ''
    success.value = ''

    try {
      await api.patch(`/inventory/${itemId}`, {
        inventory_item: {
          min_stock: minStock,
        },
      })
      success.value = 'Minimo actualizado correctamente.'
      await loadInventory()
    }
    catch (updateError) {
      error.value = updateError instanceof Error ? updateError.message : 'No pudimos actualizar el minimo.'
    }
    finally {
      saving.value = false
    }
  }

  async function createAdjustment(payload: StockAdjustmentPayload) {
    saving.value = true
    error.value = ''
    success.value = ''

    try {
      await api.post('/stock_movements', {
        stock_movement: payload,
      })
      success.value = 'Ajuste registrado correctamente.'
      await loadInventory()
    }
    catch (adjustmentError) {
      error.value = adjustmentError instanceof Error ? adjustmentError.message : 'No pudimos registrar el ajuste.'
    }
    finally {
      saving.value = false
    }
  }

  async function createTransfer(payload: StockTransferPayload) {
    saving.value = true
    error.value = ''
    success.value = ''

    try {
      await api.post('/stock_movements/transfer', {
        transfer: payload,
      })
      success.value = 'Transferencia registrada correctamente.'
      await loadInventory()
    }
    catch (transferError) {
      error.value = transferError instanceof Error ? transferError.message : 'No pudimos registrar la transferencia.'
    }
    finally {
      saving.value = false
    }
  }

  async function loadProductKardex(productId: number | string) {
    if (!productId) return

    loading.value = true
    error.value = ''

    try {
      const response = await api.get<unknown>(`/inventory/products/${productId}/kardex`)
      kardex.value = unwrapMovements(response, 'kardex')
    }
    catch (kardexError) {
      error.value = kardexError instanceof Error ? kardexError.message : 'No pudimos cargar el kardex.'
    }
    finally {
      loading.value = false
    }
  }

  async function loadWarehouseHistory(warehouseId: number | string) {
    if (!warehouseId) return

    loading.value = true
    error.value = ''

    try {
      const response = await api.get<unknown>(`/inventory/warehouses/${warehouseId}/history`, {
        query: { limit: 120 },
      })
      warehouseHistory.value = unwrapMovements(response, 'history')
    }
    catch (historyError) {
      error.value = historyError instanceof Error ? historyError.message : 'No pudimos cargar el historial.'
    }
    finally {
      loading.value = false
    }
  }

  return {
    items,
    lowStockItems,
    movements,
    kardex,
    warehouseHistory,
    products,
    warehouses,
    loading,
    saving,
    error,
    success,
    totalUnits,
    stockedProducts,
    activeWarehouses,
    loadInventory,
    loadOptions,
    updateMinStock,
    createAdjustment,
    createTransfer,
    loadProductKardex,
    loadWarehouseHistory,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useInventoryStore, import.meta.hot))
}
