import { acceptHMRUpdate, defineStore } from 'pinia'
import type { SearchResult, SearchResultType } from '~/types/business'
import { isRecord, unwrapCollection } from '~/types/business'

function text(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function identifier(value: unknown) {
  if (typeof value === 'number' || typeof value === 'string') return value

  return ''
}

function normalizeResult(value: unknown, type: SearchResultType): SearchResult | null {
  if (!isRecord(value)) return null

  const id = identifier(value.id)

  if (!id) return null

  if (type === 'product') {
    const title = text(value.name)
    if (!title) return null

    return {
      id,
      type,
      title,
      subtitle: [text(value.sku), text(value.barcode)].filter(Boolean).join(' · ') || 'Producto',
      href: `/productos/${id}`,
    }
  }

  if (type === 'customer') {
    const title = text(value.name)
    if (!title) return null

    return {
      id,
      type,
      title,
      subtitle: [text(value.nit), text(value.phone)].filter(Boolean).join(' · ') || 'Cliente',
      href: `/clientes/${id}`,
    }
  }

  if (type === 'supplier') {
    const title = text(value.name)
    if (!title) return null

    return {
      id,
      type,
      title,
      subtitle: [text(value.nit), text(value.phone)].filter(Boolean).join(' · ') || 'Proveedor',
      href: `/proveedores/${id}`,
    }
  }

  const saleNumber = text(value.sale_number) || text(value.number) || `Venta ${id}`

  return {
    id,
    type,
    title: saleNumber,
    subtitle: [text(value.total), text(value.status)].filter(Boolean).join(' · ') || 'Venta',
    href: `/ventas/${id}`,
  }
}

export const useGlobalSearchStore = defineStore('global-search', () => {
  const api = useApi()
  const auth = useAuthStore()
  const query = ref('')
  const loading = ref(false)
  const opened = ref(false)
  const results = ref<SearchResult[]>([])
  const error = ref('')

  const hasQuery = computed(() => query.value.trim().length >= 2)

  function clear() {
    query.value = ''
    results.value = []
    error.value = ''
    opened.value = false
  }

  async function search() {
    const term = query.value.trim()

    if (term.length < 2) {
      results.value = []
      error.value = ''
      return
    }

    loading.value = true
    error.value = ''
    opened.value = true

    const requests: Array<Promise<SearchResult[]>> = []

    if (auth.can('products.read')) {
      requests.push(api.get('/products', { query: { name: term } })
        .then((payload) => unwrapCollection<unknown>(payload, 'products')
          .map((item) => normalizeResult(item, 'product'))
          .filter((item): item is SearchResult => Boolean(item))))
    }

    if (auth.can('customers.read')) {
      requests.push(api.get('/customers', { query: { name: term } })
        .then((payload) => unwrapCollection<unknown>(payload, 'customers')
          .map((item) => normalizeResult(item, 'customer'))
          .filter((item): item is SearchResult => Boolean(item))))
    }

    if (auth.can('suppliers.read')) {
      requests.push(api.get('/suppliers', { query: { name: term } })
        .then((payload) => unwrapCollection<unknown>(payload, 'suppliers')
          .map((item) => normalizeResult(item, 'supplier'))
          .filter((item): item is SearchResult => Boolean(item))))
    }

    if (auth.can('sales.read')) {
      requests.push(api.get('/sales')
        .then((payload) => unwrapCollection<unknown>(payload, 'sales')
          .map((item) => normalizeResult(item, 'sale'))
          .filter((item): item is SearchResult => Boolean(item))
          .filter((item) => `${item.title} ${item.subtitle}`.toLowerCase().includes(term.toLowerCase()))))
    }

    try {
      const settled = await Promise.allSettled(requests)
      const successful = settled
        .filter((item): item is PromiseFulfilledResult<SearchResult[]> => item.status === 'fulfilled')
        .flatMap((item) => item.value)

      results.value = successful.slice(0, 8)

      if (settled.some((item) => item.status === 'rejected')) {
        error.value = 'Algunos resultados no pudieron cargarse.'
      }
    }
    finally {
      loading.value = false
    }
  }

  return {
    query,
    loading,
    opened,
    results,
    error,
    hasQuery,
    clear,
    search,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGlobalSearchStore, import.meta.hot))
}
