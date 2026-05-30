import { acceptHMRUpdate, defineStore } from 'pinia'
import type { GrossMarginReport, PaymentMethodReport, SalesByCashierReport, SalesRangeReport, TopProductReport } from '~/types/reports'
import { normalizeGrossMargin, normalizeSalesRange, unwrapPaymentMethods, unwrapSalesByCashier, unwrapTopProducts } from '~/types/reports'

export type ReportFilters = {
  from: string
  to: string
  branch_id: number | ''
  warehouse_id: number | ''
}

function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function firstOfMonthStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

function downloadCsv(filename: string, content: string) {
  const bom = '﻿'
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const useReportsStore = defineStore('reports', () => {
  const api = useApi()
  const context = useBusinessContextStore()

  const filters = reactive<ReportFilters>({
    from: firstOfMonthStr(),
    to: todayStr(),
    branch_id: '',
    warehouse_id: '',
  })

  const loading = ref(false)
  const error = ref('')

  const salesRange = ref<SalesRangeReport | null>(null)
  const grossMargin = ref<GrossMarginReport | null>(null)
  const topProducts = ref<TopProductReport[]>([])
  const salesByCashier = ref<SalesByCashierReport[]>([])
  const paymentMethods = ref<PaymentMethodReport[]>([])

  function buildQuery() {
    const query: Record<string, string | number> = {}
    if (filters.from) query.from = filters.from
    if (filters.to) query.to = filters.to
    const branchId = filters.branch_id || context.selectedBranchId
    const warehouseId = filters.warehouse_id || context.selectedWarehouseId
    if (branchId) query.branch_id = branchId
    if (warehouseId) query.warehouse_id = warehouseId
    return query
  }

  async function load() {
    loading.value = true
    error.value = ''

    try {
      if (!context.loaded) await context.loadContext()
      const query = buildQuery()

      const [salesRes, marginRes, topRes, cashierRes, paymentsRes] = await Promise.all([
        api.get<unknown>('/reports/sales', { query }),
        api.get<unknown>('/reports/gross_margin', { query }),
        api.get<unknown>('/reports/top_products', { query: { ...query, limit: 20 } }),
        api.get<unknown>('/reports/sales_by_cashier', { query }),
        api.get<unknown>('/reports/payment_methods', { query }),
      ])

      salesRange.value = normalizeSalesRange(salesRes)
      grossMargin.value = normalizeGrossMargin(marginRes)
      topProducts.value = unwrapTopProducts(topRes)
      salesByCashier.value = unwrapSalesByCashier(cashierRes)
      paymentMethods.value = unwrapPaymentMethods(paymentsRes)
    }
    catch (loadError) {
      error.value = loadError instanceof Error ? loadError.message : 'No pudimos cargar los reportes.'
    }
    finally {
      loading.value = false
    }
  }

  function exportSalesRange() {
    if (!salesRange.value) return
    const header = 'Ventas,Subtotal,IVA,Descuento,Total,Desde,Hasta'
    const row = [
      salesRange.value.salesCount,
      salesRange.value.subtotal.toFixed(2),
      salesRange.value.tax.toFixed(2),
      salesRange.value.discount.toFixed(2),
      salesRange.value.total.toFixed(2),
      salesRange.value.from || filters.from,
      salesRange.value.to || filters.to,
    ].join(',')
    downloadCsv(`ventas_${filters.from}_${filters.to}.csv`, `${header}\n${row}`)
  }

  function exportTopProducts() {
    if (!topProducts.value.length) return
    const header = 'Producto,SKU,Unidades,Total'
    const rows = topProducts.value.map((item) =>
      `"${item.productName}","${item.sku}",${item.quantity},${item.total.toFixed(2)}`,
    )
    downloadCsv(`top_productos_${filters.from}_${filters.to}.csv`, [header, ...rows].join('\n'))
  }

  function exportSalesByCashier() {
    if (!salesByCashier.value.length) return
    const header = 'Cajero,Ventas,Total'
    const rows = salesByCashier.value.map((item) =>
      `"${item.cashierName}",${item.salesCount},${item.total.toFixed(2)}`,
    )
    downloadCsv(`ventas_cajero_${filters.from}_${filters.to}.csv`, [header, ...rows].join('\n'))
  }

  function exportGrossMargin() {
    if (!grossMargin.value) return
    const header = 'Ingresos,Costo,Margen Bruto'
    const row = [
      grossMargin.value.revenue.toFixed(2),
      grossMargin.value.cost.toFixed(2),
      grossMargin.value.grossMargin.toFixed(2),
    ].join(',')
    downloadCsv(`margen_bruto_${filters.from}_${filters.to}.csv`, `${header}\n${row}`)
  }

  function exportPaymentMethods() {
    if (!paymentMethods.value.length) return
    const header = 'Metodo,Monto,Transacciones'
    const rows = paymentMethods.value.map((item) =>
      `"${item.method}",${item.amount.toFixed(2)},${item.paymentsCount}`,
    )
    downloadCsv(`metodos_pago_${filters.from}_${filters.to}.csv`, [header, ...rows].join('\n'))
  }

  return {
    filters,
    loading,
    error,
    salesRange,
    grossMargin,
    topProducts,
    salesByCashier,
    paymentMethods,
    load,
    exportSalesRange,
    exportTopProducts,
    exportSalesByCashier,
    exportGrossMargin,
    exportPaymentMethods,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReportsStore, import.meta.hot))
}
