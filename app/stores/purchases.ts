import { acceptHMRUpdate, defineStore } from 'pinia'
import type { PurchaseOption, PurchaseSummary } from '~/types/purchases'
import { unwrapPurchaseOptions, unwrapPurchases } from '~/types/purchases'

export type PurchaseItemDraft = {
  product_id: number | ''
  quantity: string
  cost: string
  tax_rate: string
  update_product_cost: boolean
}

export type PurchaseDraft = {
  supplier_id: number | ''
  warehouse_id: number | ''
  document_type: string
  invoice_number: string
  discount: string
  items: PurchaseItemDraft[]
}

export type PurchaseFilters = {
  status?: string
  supplier_id?: number | string
  warehouse_id?: number | string
  from?: string
  to?: string
}

function blankItem(): PurchaseItemDraft {
  return {
    product_id: '',
    quantity: '1',
    cost: '0.00',
    tax_rate: '0.13',
    update_product_cost: true,
  }
}

export const usePurchasesStore = defineStore('purchases', () => {
  const api = useApi()

  const purchases = ref<PurchaseSummary[]>([])
  const suppliers = ref<PurchaseOption[]>([])
  const warehouses = ref<PurchaseOption[]>([])
  const products = ref<PurchaseOption[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const success = ref('')
  const draft = reactive<PurchaseDraft>({
    supplier_id: '',
    warehouse_id: '',
    document_type: 'CCF',
    invoice_number: '',
    discount: '0.00',
    items: [blankItem()],
  })

  function resetDraft() {
    draft.supplier_id = ''
    draft.warehouse_id = ''
    draft.document_type = 'CCF'
    draft.invoice_number = ''
    draft.discount = '0.00'
    draft.items = [blankItem()]
  }

  function addItem() {
    draft.items.push(blankItem())
  }

  function removeItem(index: number) {
    draft.items.splice(index, 1)
    if (draft.items.length === 0) draft.items.push(blankItem())
  }

  async function loadOptions() {
    const [suppliersResponse, warehousesResponse, productsResponse] = await Promise.all([
      api.get<unknown>('/suppliers', { query: { limit: 200, active: true } }),
      api.get<unknown>('/warehouses', { query: { limit: 200, active: true } }),
      api.get<unknown>('/products', { query: { limit: 300, active: true } }),
    ])

    suppliers.value = unwrapPurchaseOptions(suppliersResponse, 'suppliers')
    warehouses.value = unwrapPurchaseOptions(warehousesResponse, 'warehouses')
    products.value = unwrapPurchaseOptions(productsResponse, 'products')
  }

  async function load(filters: PurchaseFilters = {}) {
    loading.value = true
    error.value = ''

    try {
      await loadOptions()
      const query: Record<string, string | number> = { limit: 50 }
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') query[key] = value
      })

      const response = await api.get<unknown>('/purchases', { query })
      purchases.value = unwrapPurchases(response)
    }
    catch (loadError) {
      error.value = loadError instanceof Error ? loadError.message : 'No pudimos cargar compras.'
    }
    finally {
      loading.value = false
    }
  }

  async function create() {
    saving.value = true
    error.value = ''
    success.value = ''

    try {
      await api.post('/purchases', {
        purchase: {
          supplier_id: draft.supplier_id,
          warehouse_id: draft.warehouse_id,
          document_type: draft.document_type,
          invoice_number: draft.invoice_number,
          discount: draft.discount,
          items: draft.items.map((item) => ({ ...item })),
        },
      })
      success.value = 'Compra registrada correctamente.'
      resetDraft()
      await load()
    }
    catch (createError) {
      error.value = createError instanceof Error ? createError.message : 'No pudimos registrar la compra.'
    }
    finally {
      saving.value = false
    }
  }

  async function voidPurchase(id: number, reason: string) {
    saving.value = true
    error.value = ''
    success.value = ''

    try {
      await api.post(`/purchases/${id}/void`, {
        purchase: { reason },
      })
      success.value = 'Compra anulada correctamente.'
      await load()
    }
    catch (voidError) {
      error.value = voidError instanceof Error ? voidError.message : 'No pudimos anular la compra.'
    }
    finally {
      saving.value = false
    }
  }

  return {
    purchases,
    suppliers,
    warehouses,
    products,
    loading,
    saving,
    error,
    success,
    draft,
    resetDraft,
    addItem,
    removeItem,
    load,
    create,
    voidPurchase,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePurchasesStore, import.meta.hot))
}
