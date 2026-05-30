<script setup lang="ts">
import {
  BarChart3,
  CreditCard,
  Download,
  Package,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
} from '@lucide/vue'

definePageMeta({
  middleware: 'permission',
  permission: 'reports.read',
})

const reports = useReportsStore()
const context = useBusinessContextStore()

const activeTab = ref<'ventas' | 'margen' | 'productos' | 'cajeros' | 'pagos'>('ventas')

const tabs = [
  { key: 'ventas', label: 'Ventas por rango', icon: TrendingUp },
  { key: 'margen', label: 'Margen bruto', icon: BarChart3 },
  { key: 'productos', label: 'Productos mas vendidos', icon: Package },
  { key: 'cajeros', label: 'Ventas por cajero', icon: Users },
  { key: 'pagos', label: 'Metodos de pago', icon: CreditCard },
] as const

function money(value: number) {
  return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(value)
}

function percent(part: number, total: number) {
  if (!total) return '0%'
  return `${((part / total) * 100).toFixed(1)}%`
}

onMounted(async () => {
  if (!context.loaded) await context.loadContext()
  await reports.load()
})
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div class="min-w-0">
        <div class="flex items-center gap-3">
          <div class="grid size-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <BarChart3 class="size-5" aria-hidden="true" />
          </div>
          <div>
            <p class="text-sm font-medium text-muted-foreground">Analisis</p>
            <h1 class="text-2xl font-semibold tracking-normal">Reportes</h1>
          </div>
        </div>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Ventas por rango, margen bruto, productos mas vendidos, ventas por cajero y metodos de pago. Exportables a CSV.
        </p>
      </div>
      <UiButton variant="outline" :disabled="reports.loading" @click="reports.load">
        <RefreshCw class="size-4" aria-hidden="true" />
        Actualizar
      </UiButton>
    </div>

    <UiCard class="p-4">
      <form class="grid gap-3 sm:grid-cols-[150px_150px_1fr_1fr_auto]" @submit.prevent="reports.load">
        <UiInput v-model="reports.filters.from" type="date" aria-label="Desde" />
        <UiInput v-model="reports.filters.to" type="date" aria-label="Hasta" />
        <select
          v-model="reports.filters.branch_id"
          class="h-10 rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Sucursal"
        >
          <option value="">Todas las sucursales</option>
          <option v-for="branch in context.branches" :key="branch.id" :value="branch.id">
            {{ branch.name }}
          </option>
        </select>
        <select
          v-model="reports.filters.warehouse_id"
          class="h-10 rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Bodega"
        >
          <option value="">Todas las bodegas</option>
          <option v-for="warehouse in context.filteredWarehouses" :key="warehouse.id" :value="warehouse.id">
            {{ warehouse.name }}
          </option>
        </select>
        <UiButton type="submit" :disabled="reports.loading">
          <Search class="size-4" aria-hidden="true" />
          Aplicar
        </UiButton>
      </form>
    </UiCard>

    <div v-if="reports.error" role="alert" class="rounded-md border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
      {{ reports.error }}
    </div>

    <div class="overflow-x-auto">
      <div class="flex min-w-max gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors"
          :class="activeTab === tab.key
            ? 'border-primary bg-primary text-primary-foreground'
            : 'bg-card text-muted-foreground hover:bg-muted'"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" class="size-4" aria-hidden="true" />
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div v-if="reports.loading" class="grid min-h-64 place-items-center text-sm text-muted-foreground">
      Cargando reportes...
    </div>

    <template v-else>
      <UiCard v-if="activeTab === 'ventas'" class="overflow-hidden">
        <div class="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-base font-semibold">Ventas por rango</h2>
            <p class="mt-1 text-sm text-muted-foreground">
              Periodo: {{ reports.filters.from }} al {{ reports.filters.to }}
            </p>
          </div>
          <UiButton variant="outline" size="sm" :disabled="!reports.salesRange" @click="reports.exportSalesRange">
            <Download class="size-4" aria-hidden="true" />
            Exportar CSV
          </UiButton>
        </div>
        <div v-if="!reports.salesRange" class="grid min-h-40 place-items-center text-sm text-muted-foreground">
          Sin datos para el periodo seleccionado.
        </div>
        <div v-else class="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div class="flex flex-col gap-1 bg-card p-5">
            <span class="text-xs font-medium uppercase text-muted-foreground">Ventas</span>
            <span class="text-2xl font-semibold">{{ reports.salesRange.salesCount }}</span>
          </div>
          <div class="flex flex-col gap-1 bg-card p-5">
            <span class="text-xs font-medium uppercase text-muted-foreground">Subtotal</span>
            <span class="text-2xl font-semibold">{{ money(reports.salesRange.subtotal) }}</span>
          </div>
          <div class="flex flex-col gap-1 bg-card p-5">
            <span class="text-xs font-medium uppercase text-muted-foreground">IVA</span>
            <span class="text-2xl font-semibold">{{ money(reports.salesRange.tax) }}</span>
          </div>
          <div class="flex flex-col gap-1 bg-card p-5">
            <span class="text-xs font-medium uppercase text-muted-foreground">Descuento</span>
            <span class="text-2xl font-semibold">{{ money(reports.salesRange.discount) }}</span>
          </div>
          <div class="col-span-full flex flex-col gap-1 bg-card p-5 lg:col-span-2">
            <span class="text-xs font-medium uppercase text-muted-foreground">Total</span>
            <span class="text-3xl font-bold text-primary">{{ money(reports.salesRange.total) }}</span>
          </div>
        </div>
      </UiCard>

      <UiCard v-if="activeTab === 'margen'" class="overflow-hidden">
        <div class="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-base font-semibold">Margen bruto</h2>
            <p class="mt-1 text-sm text-muted-foreground">
              Ingresos vs costo de ventas para el periodo.
            </p>
          </div>
          <UiButton variant="outline" size="sm" :disabled="!reports.grossMargin" @click="reports.exportGrossMargin">
            <Download class="size-4" aria-hidden="true" />
            Exportar CSV
          </UiButton>
        </div>
        <div v-if="!reports.grossMargin" class="grid min-h-40 place-items-center text-sm text-muted-foreground">
          Sin datos para el periodo seleccionado.
        </div>
        <div v-else class="grid gap-px bg-border sm:grid-cols-3">
          <div class="flex flex-col gap-1 bg-card p-5">
            <span class="text-xs font-medium uppercase text-muted-foreground">Ingresos</span>
            <span class="text-2xl font-semibold text-primary">{{ money(reports.grossMargin.revenue) }}</span>
          </div>
          <div class="flex flex-col gap-1 bg-card p-5">
            <span class="text-xs font-medium uppercase text-muted-foreground">Costo</span>
            <span class="text-2xl font-semibold text-destructive">{{ money(reports.grossMargin.cost) }}</span>
          </div>
          <div class="flex flex-col gap-1 bg-card p-5">
            <span class="text-xs font-medium uppercase text-muted-foreground">Margen bruto</span>
            <span class="text-2xl font-semibold text-success">{{ money(reports.grossMargin.grossMargin) }}</span>
            <span class="text-sm text-muted-foreground">
              {{ percent(reports.grossMargin.grossMargin, reports.grossMargin.revenue) }} del ingreso
            </span>
          </div>
        </div>
      </UiCard>

      <UiCard v-if="activeTab === 'productos'" class="overflow-hidden">
        <div class="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-base font-semibold">Productos mas vendidos</h2>
            <p class="mt-1 text-sm text-muted-foreground">Top 20 por volumen de ventas en el periodo.</p>
          </div>
          <UiButton variant="outline" size="sm" :disabled="!reports.topProducts.length" @click="reports.exportTopProducts">
            <Download class="size-4" aria-hidden="true" />
            Exportar CSV
          </UiButton>
        </div>
        <div v-if="!reports.topProducts.length" class="grid min-h-40 place-items-center text-sm text-muted-foreground">
          Sin datos para el periodo seleccionado.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[560px] text-sm">
            <thead class="bg-muted/70 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" class="px-4 py-3 font-medium">#</th>
                <th scope="col" class="px-4 py-3 font-medium">Producto</th>
                <th scope="col" class="px-4 py-3 font-medium">SKU</th>
                <th scope="col" class="px-4 py-3 text-right font-medium">Unidades</th>
                <th scope="col" class="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="(item, index) in reports.topProducts" :key="item.productId">
                <td class="px-4 py-3 text-muted-foreground">{{ index + 1 }}</td>
                <td class="px-4 py-3 font-medium">{{ item.productName }}</td>
                <td class="px-4 py-3 text-muted-foreground">{{ item.sku || '—' }}</td>
                <td class="px-4 py-3 text-right">{{ item.quantity }}</td>
                <td class="px-4 py-3 text-right font-semibold">{{ money(item.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UiCard>

      <UiCard v-if="activeTab === 'cajeros'" class="overflow-hidden">
        <div class="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-base font-semibold">Ventas por cajero</h2>
            <p class="mt-1 text-sm text-muted-foreground">Totales por usuario en el periodo seleccionado.</p>
          </div>
          <UiButton variant="outline" size="sm" :disabled="!reports.salesByCashier.length" @click="reports.exportSalesByCashier">
            <Download class="size-4" aria-hidden="true" />
            Exportar CSV
          </UiButton>
        </div>
        <div v-if="!reports.salesByCashier.length" class="grid min-h-40 place-items-center text-sm text-muted-foreground">
          Sin datos para el periodo seleccionado.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[420px] text-sm">
            <thead class="bg-muted/70 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" class="px-4 py-3 font-medium">Cajero</th>
                <th scope="col" class="px-4 py-3 text-right font-medium">Ventas</th>
                <th scope="col" class="px-4 py-3 text-right font-medium">Total</th>
                <th scope="col" class="px-4 py-3 text-right font-medium">Participacion</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="item in reports.salesByCashier" :key="item.cashierId">
                <td class="px-4 py-3 font-medium">{{ item.cashierName }}</td>
                <td class="px-4 py-3 text-right">{{ item.salesCount }}</td>
                <td class="px-4 py-3 text-right font-semibold">{{ money(item.total) }}</td>
                <td class="px-4 py-3 text-right text-muted-foreground">
                  {{ percent(item.total, reports.salesByCashier.reduce((sum, r) => sum + r.total, 0)) }}
                </td>
              </tr>
            </tbody>
            <tfoot class="border-t bg-muted/40">
              <tr>
                <td class="px-4 py-3 font-semibold">Total</td>
                <td class="px-4 py-3 text-right font-semibold">
                  {{ reports.salesByCashier.reduce((sum, r) => sum + r.salesCount, 0) }}
                </td>
                <td class="px-4 py-3 text-right font-semibold">
                  {{ money(reports.salesByCashier.reduce((sum, r) => sum + r.total, 0)) }}
                </td>
                <td class="px-4 py-3 text-right text-muted-foreground">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </UiCard>

      <UiCard v-if="activeTab === 'pagos'" class="overflow-hidden">
        <div class="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-base font-semibold">Metodos de pago</h2>
            <p class="mt-1 text-sm text-muted-foreground">Distribucion de ingresos por metodo en el periodo.</p>
          </div>
          <UiButton variant="outline" size="sm" :disabled="!reports.paymentMethods.length" @click="reports.exportPaymentMethods">
            <Download class="size-4" aria-hidden="true" />
            Exportar CSV
          </UiButton>
        </div>
        <div v-if="!reports.paymentMethods.length" class="grid min-h-40 place-items-center text-sm text-muted-foreground">
          Sin datos para el periodo seleccionado.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[420px] text-sm">
            <thead class="bg-muted/70 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" class="px-4 py-3 font-medium">Metodo</th>
                <th scope="col" class="px-4 py-3 text-right font-medium">Transacciones</th>
                <th scope="col" class="px-4 py-3 text-right font-medium">Monto</th>
                <th scope="col" class="px-4 py-3 text-right font-medium">Participacion</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="item in reports.paymentMethods" :key="item.method">
                <td class="px-4 py-3 font-medium capitalize">{{ item.method }}</td>
                <td class="px-4 py-3 text-right">{{ item.paymentsCount }}</td>
                <td class="px-4 py-3 text-right font-semibold">{{ money(item.amount) }}</td>
                <td class="px-4 py-3 text-right text-muted-foreground">
                  {{ percent(item.amount, reports.paymentMethods.reduce((sum, r) => sum + r.amount, 0)) }}
                </td>
              </tr>
            </tbody>
            <tfoot class="border-t bg-muted/40">
              <tr>
                <td class="px-4 py-3 font-semibold">Total</td>
                <td class="px-4 py-3 text-right font-semibold">
                  {{ reports.paymentMethods.reduce((sum, r) => sum + r.paymentsCount, 0) }}
                </td>
                <td class="px-4 py-3 text-right font-semibold">
                  {{ money(reports.paymentMethods.reduce((sum, r) => sum + r.amount, 0)) }}
                </td>
                <td class="px-4 py-3 text-right text-muted-foreground">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </UiCard>
    </template>
  </section>
</template>
