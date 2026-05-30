import { acceptHMRUpdate, defineStore } from 'pinia'
import type {
  ActivityItem,
  DashboardRealtimeEvent,
  HourlySale,
  LatestSale,
  LowStockProduct,
  PaymentSlice,
  TopProduct,
} from '~/types/dashboard'
import { isRecord, toNumber, unwrapCollection } from '~/types/business'

function numeric(value: unknown) {
  const number = toNumber(value)

  return Number.isFinite(number) ? number ?? 0 : 0
}

function money(value: number) {
  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function compactNumber(value: number) {
  return new Intl.NumberFormat('es-SV').format(value)
}

function timeLabel(value: unknown) {
  const date = typeof value === 'string' ? new Date(value) : null

  if (!date || Number.isNaN(date.getTime())) return 'Ahora'

  return new Intl.DateTimeFormat('es-SV', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function stableId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeTopProduct(value: unknown): TopProduct | null {
  if (!isRecord(value)) return null
  const id = value.product_id ?? value.id ?? value.product?.['id']
  const name = value.product_name ?? value.name ?? value.product?.['name']

  if (!id || typeof name !== 'string') return null

  return {
    id: String(id),
    name,
    quantity: numeric(value.quantity ?? value.qty ?? value.units_sold),
    total: numeric(value.total ?? value.revenue ?? value.amount),
  }
}

function normalizeLowStock(value: unknown): LowStockProduct | null {
  if (!isRecord(value)) return null
  const id = value.product_id ?? value.id ?? value.product?.['id']
  const name = value.product_name ?? value.name ?? value.product?.['name']

  if (!id || typeof name !== 'string') return null

  return {
    id: String(id),
    name,
    warehouse: String(value.warehouse_name ?? value.warehouse?.['name'] ?? 'Sin bodega'),
    quantity: numeric(value.quantity ?? value.qty ?? value.stock ?? value.current_stock),
    minStock: numeric(value.min_stock ?? value.minimum_stock ?? value.minStock),
  }
}

function normalizeSale(value: unknown): LatestSale | null {
  if (!isRecord(value)) return null
  const id = value.id ?? value.sale_id

  if (!id) return null

  return {
    id: String(id),
    number: String(value.sale_number ?? value.number ?? value.code ?? `Venta ${id}`),
    time: timeLabel(value.created_at ?? value.sold_at ?? value.time),
    cashier: String(value.cashier_name ?? value.user_name ?? value.cashier?.['full_name'] ?? 'Sin cajero'),
    total: numeric(value.total ?? value.amount),
    method: String(value.payment_method ?? value.method ?? value.payments?.[0]?.['method'] ?? 'No definido'),
  }
}

function normalizePayment(value: unknown): Omit<PaymentSlice, 'percent'> | null {
  if (!isRecord(value)) return null
  const method = String(value.method ?? value.payment_method ?? 'No definido')

  return {
    method,
    total: numeric(value.amount ?? value.total),
    paymentsCount: numeric(value.payments_count ?? value.count),
  }
}

function normalizeHourly(value: unknown): HourlySale | null {
  if (!isRecord(value)) return null
  const rawHour = String(value.hour ?? value.label ?? '')
  const date = rawHour ? new Date(rawHour.replace(' ', 'T')) : null
  const label = date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat('es-SV', { hour: '2-digit', minute: '2-digit' }).format(date)
    : rawHour || 'Hora'

  return {
    label,
    total: numeric(value.total ?? value.amount),
    salesCount: numeric(value.sales_count ?? value.count),
  }
}

function withPaymentPercents(payments: Array<Omit<PaymentSlice, 'percent'>>) {
  const grandTotal = payments.reduce((sum, item) => sum + item.total, 0)

  return payments.map((item) => ({
    ...item,
    percent: grandTotal > 0 ? Math.round((item.total / grandTotal) * 1000) / 10 : 0,
  }))
}

export const useDashboardStore = defineStore('dashboard', () => {
  const api = useApi()
  const notifications = useNotificationsStore()
  const context = useBusinessContextStore()

  const loading = ref(false)
  const error = ref('')
  const lastUpdated = ref<Date | null>(null)
  const dailySales = ref({ salesCount: 0, subtotal: 0, tax: 0, discount: 0, total: 0 })
  const grossMargin = ref({ revenue: 0, cost: 0, margin: 0 })
  const topProducts = ref<TopProduct[]>([])
  const lowStockProducts = ref<LowStockProduct[]>([])
  const latestSales = ref<LatestSale[]>([])
  const paymentMethods = ref<PaymentSlice[]>([])
  const activity = ref<ActivityItem[]>([])
  const hourlySales = ref<HourlySale[]>([])

  const metrics = computed(() => [
    {
      title: 'Ventas del dia',
      value: money(dailySales.value.total),
      helper: `${compactNumber(dailySales.value.salesCount)} transacciones`,
      tone: 'blue' as const,
    },
    {
      title: 'Margen bruto',
      value: money(grossMargin.value.margin),
      helper: `Ingresos ${money(grossMargin.value.revenue)}`,
      tone: 'green' as const,
    },
    {
      title: 'Ticket promedio',
      value: dailySales.value.salesCount > 0 ? money(dailySales.value.total / dailySales.value.salesCount) : money(0),
      helper: 'Calculado con ventas del dia',
      tone: 'amber' as const,
    },
    {
      title: 'Stock bajo',
      value: compactNumber(lowStockProducts.value.length),
      helper: lowStockProducts.value.length === 1 ? 'Producto requiere revision' : 'Productos requieren revision',
      tone: 'rose' as const,
    },
  ])

  function addActivity(item: Omit<ActivityItem, 'id' | 'createdAt'>) {
    activity.value.unshift({
      id: stableId('activity'),
      createdAt: new Date().toISOString(),
      ...item,
    })
    activity.value = activity.value.slice(0, 8)
  }

  function reportQuery() {
    const query: Record<string, number> = {}
    if (context.selectedBranchId) query.branch_id = context.selectedBranchId
    if (context.selectedWarehouseId) query.warehouse_id = context.selectedWarehouseId

    return query
  }

  function applySaleToPaymentMethods(method: string, total: number) {
    const existing = paymentMethods.value.find((item) => item.method === method)

    const base = paymentMethods.value.map((item) => ({
      method: item.method,
      total: item.method === method ? item.total + total : item.total,
      paymentsCount: item.method === method ? (item.paymentsCount ?? 0) + 1 : item.paymentsCount,
    }))

    if (!existing) {
      base.push({ method, total, paymentsCount: 1 })
    }

    paymentMethods.value = withPaymentPercents(base)
  }

  function applySaleToCurrentHour(total: number) {
    const label = new Intl.DateTimeFormat('es-SV', { hour: '2-digit', minute: '2-digit' }).format(new Date())
    const existing = hourlySales.value.find((item) => item.label === label)

    if (existing) {
      existing.total += total
      existing.salesCount += 1
      return
    }

    hourlySales.value.push({ label, total, salesCount: 1 })
    hourlySales.value = hourlySales.value.slice(-12)
  }

  async function load() {
    loading.value = true
    error.value = ''

    try {
      if (!context.loaded) await context.loadContext()
      const query = reportQuery()

      const [daily, margin, top, lowStock, hourly, payments, sales] = await Promise.all([
        api.get('/reports/daily_sales', { query }),
        api.get('/reports/gross_margin', { query }),
        api.get('/reports/top_products', { query }),
        api.get('/reports/low_stock', { query }),
        api.get('/reports/sales_by_hour', { query }),
        api.get('/reports/payment_methods', { query }),
        api.get('/sales', { query: { ...query, limit: 6 } }),
      ])

      dailySales.value = {
        salesCount: numeric(isRecord(daily) ? daily.sales_count : 0),
        subtotal: numeric(isRecord(daily) ? daily.subtotal : 0),
        tax: numeric(isRecord(daily) ? daily.tax : 0),
        discount: numeric(isRecord(daily) ? daily.discount : 0),
        total: numeric(isRecord(daily) ? daily.total : 0),
      }
      grossMargin.value = {
        revenue: numeric(isRecord(margin) ? margin.revenue : 0),
        cost: numeric(isRecord(margin) ? margin.cost : 0),
        margin: numeric(isRecord(margin) ? margin.gross_margin : 0),
      }
      topProducts.value = unwrapCollection<unknown>(top, 'products')
        .map(normalizeTopProduct)
        .filter((item): item is TopProduct => Boolean(item))
        .slice(0, 5)
      lowStockProducts.value = unwrapCollection<unknown>(lowStock, 'products')
        .map(normalizeLowStock)
        .filter((item): item is LowStockProduct => Boolean(item))
        .slice(0, 6)
      latestSales.value = unwrapCollection<unknown>(sales, 'sales')
        .map(normalizeSale)
        .filter((item): item is LatestSale => Boolean(item))
        .slice(0, 6)
      hourlySales.value = unwrapCollection<unknown>(hourly, 'hours')
        .map(normalizeHourly)
        .filter((item): item is HourlySale => Boolean(item))
      paymentMethods.value = withPaymentPercents(
        unwrapCollection<unknown>(payments, 'payment_methods')
          .map(normalizePayment)
          .filter((item): item is Omit<PaymentSlice, 'percent'> => Boolean(item)),
      )

      if (paymentMethods.value.length === 0 && isRecord(daily)) {
        paymentMethods.value = withPaymentPercents(
          unwrapCollection<unknown>(daily, 'payment_summary')
            .map(normalizePayment)
            .filter((item): item is Omit<PaymentSlice, 'percent'> => Boolean(item)),
        )
      }

      if (activity.value.length === 0) {
        addActivity({
          title: 'Dashboard actualizado',
          description: 'Los indicadores fueron cargados desde Rails.',
          tone: 'success',
        })
      }

      lastUpdated.value = new Date()
    }
    catch {
      error.value = 'No pudimos cargar el dashboard operativo.'
      addActivity({
        title: 'Error al actualizar',
        description: 'Revisa la conexion con el backend.',
        tone: 'danger',
      })
    }
    finally {
      loading.value = false
    }
  }

  function applyRealtime(message: DashboardRealtimeEvent) {
    const event = message.event ?? 'evento'
    const payload = message.payload ?? {}

    if (event === 'daily_total_updated') {
      dailySales.value.total = numeric(payload.total ?? payload.daily_total ?? dailySales.value.total)
      dailySales.value.salesCount = numeric(payload.sales_count ?? dailySales.value.salesCount)
    }

    if (event === 'sale_created') {
      dailySales.value.salesCount += 1
      dailySales.value.total += numeric(payload.total)
      latestSales.value.unshift({
        id: String(payload.sale_id ?? payload.id ?? stableId('sale')),
        number: String(payload.sale_number ?? payload.number ?? 'Venta nueva'),
        time: timeLabel(message.sent_at ?? new Date().toISOString()),
        cashier: String(payload.cashier_name ?? 'Caja'),
        total: numeric(payload.total),
        method: String(payload.payment_method ?? 'No definido'),
      })
      latestSales.value = latestSales.value.slice(0, 6)
      applySaleToPaymentMethods(String(payload.payment_method ?? 'No definido'), numeric(payload.total))
      applySaleToCurrentHour(numeric(payload.total))
      addActivity({
        title: 'Venta registrada',
        description: `${money(numeric(payload.total))} agregado a ventas del dia.`,
        tone: 'success',
      })
    }

    if (event === 'low_stock') {
      const productName = String(payload.product_name ?? 'Producto')
      addActivity({
        title: 'Stock bajo',
        description: `${productName} necesita revision de inventario.`,
        tone: 'warning',
      })
      notifications.add({
        title: 'Stock bajo',
        description: `${productName} necesita revision de inventario.`,
        tone: 'warning',
      })
    }

    if (event === 'stock_updated') {
      addActivity({
        title: 'Inventario actualizado',
        description: String(payload.product_name ?? 'Movimiento de inventario recibido.'),
        tone: 'default',
      })
    }

    lastUpdated.value = new Date()
  }

  return {
    loading,
    error,
    lastUpdated,
    dailySales,
    grossMargin,
    topProducts,
    lowStockProducts,
    latestSales,
    paymentMethods,
    activity,
    hourlySales,
    metrics,
    load,
    applyRealtime,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDashboardStore, import.meta.hot))
}
