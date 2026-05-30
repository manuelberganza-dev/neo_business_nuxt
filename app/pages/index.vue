<script setup lang="ts">
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Boxes,
  ChartNoAxesCombined,
  ClipboardCheck,
  CreditCard,
  PackageSearch,
  ReceiptText,
  RefreshCcw,
  ShoppingCart,
  TrendingUp,
} from '@lucide/vue'

const auth = useAuthStore()
const dashboard = useDashboardStore()
const realtime = useDashboardRealtime()

const metricIcons = [TrendingUp, ChartNoAxesCombined, ReceiptText, PackageSearch]

const maxHourly = computed(() => Math.max(...dashboard.hourlySales.map((item) => item.total), 1))
const paymentColors = ['var(--success)', 'var(--primary)', 'var(--warning)', 'var(--destructive)', '#64748b']
const paymentGradient = computed(() => {
  if (!dashboard.paymentMethods.length) return ''

  let cursor = 0
  const stops = dashboard.paymentMethods.map((method, index) => {
    const start = cursor
    cursor += method.percent

    return `${paymentColors[index % paymentColors.length]} ${start}% ${cursor}%`
  })

  return `conic-gradient(${stops.join(', ')})`
})
const lastUpdated = computed(() => {
  if (!dashboard.lastUpdated) return 'Sin actualizar'

  return new Intl.DateTimeFormat('es-SV', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dashboard.lastUpdated)
})

function money(value: number) {
  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

onMounted(async () => {
  await dashboard.load()
  await realtime.connect()
})
</script>

<template>
  <div class="mx-auto max-w-[1500px] space-y-6">
    <section class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-sm font-medium text-muted-foreground">Resumen general</p>
        <h1 class="mt-1 text-3xl font-semibold tracking-normal text-foreground">Bienvenido, {{ auth.displayName }}</h1>
      </div>
      <div class="flex flex-wrap gap-2">
        <UiBadge :variant="realtime.connected ? 'success' : 'warning'">
          {{ realtime.connected ? 'Tiempo real activo' : 'Tiempo real pendiente' }}
        </UiBadge>
        <UiBadge variant="muted">Actualizado {{ lastUpdated }}</UiBadge>
      </div>
    </section>

    <p v-if="dashboard.error" class="rounded-md border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm text-destructive">
      {{ dashboard.error }}
    </p>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Metricas principales">
      <BaseMetricCard
        v-for="(metric, index) in dashboard.metrics"
        :key="metric.title"
        v-bind="{ ...metric, icon: metricIcons[index] }"
      />
    </section>

    <section class="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.75fr)_minmax(280px,0.7fr)]">
      <UiCard class="p-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold">Ventas por hora</h2>
            <p class="mt-1 text-sm text-muted-foreground">Movimiento construido con ventas recientes</p>
          </div>
          <UiButton variant="outline" size="sm" :disabled="dashboard.loading" @click="dashboard.load">
            <RefreshCcw class="size-4" aria-hidden="true" />
            {{ dashboard.loading ? 'Actualizando' : 'Actualizar' }}
          </UiButton>
        </div>

        <div class="mt-6 h-72 rounded-md border bg-background p-4">
          <div v-if="dashboard.hourlySales.some((value) => value.total > 0)" class="flex h-full items-end gap-2">
            <div
              v-for="hour in dashboard.hourlySales"
              :key="hour.label"
              class="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
              :title="`${hour.label}: ${money(hour.total)} (${hour.salesCount} ventas)`"
            >
              <div
                class="w-full rounded-t-md bg-primary/85"
                :style="{ height: `${Math.max(4, (hour.total / maxHourly) * 100)}%` }"
              />
              <span class="hidden max-w-full truncate text-[10px] text-muted-foreground sm:block">{{ hour.label }}</span>
            </div>
          </div>
          <div v-else class="grid h-full place-items-center text-center text-sm text-muted-foreground">
            Aun no hay ventas para graficar.
          </div>
        </div>
      </UiCard>

      <UiCard class="p-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold">Top productos</h2>
            <p class="mt-1 text-sm text-muted-foreground">Mas vendidos del dia</p>
          </div>
          <PackageSearch class="size-5 text-muted-foreground" aria-hidden="true" />
        </div>

        <div v-if="dashboard.topProducts.length" class="mt-5 space-y-3">
          <div
            v-for="(product, index) in dashboard.topProducts"
            :key="product.id"
            class="flex items-center gap-3 rounded-md border bg-background p-3"
          >
            <div class="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
              {{ index + 1 }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ product.name }}</p>
              <p class="text-xs text-muted-foreground">{{ product.quantity }} unidades</p>
            </div>
            <p class="text-sm font-semibold">{{ money(product.total) }}</p>
          </div>
        </div>

        <div v-else class="mt-6 grid h-56 place-items-center text-center text-sm text-muted-foreground">
          Los productos mas vendidos apareceran cuando existan ventas.
        </div>
      </UiCard>

      <UiCard class="p-5">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold">Metodos de pago</h2>
          <CreditCard class="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <div v-if="dashboard.paymentMethods.length" class="mt-6 grid gap-4 sm:grid-cols-[150px_1fr] xl:grid-cols-1">
          <div class="mx-auto grid size-36 place-items-center rounded-full" :style="{ background: paymentGradient }">
            <div class="size-20 rounded-full bg-card" />
          </div>
          <div class="space-y-3">
            <div v-for="(method, index) in dashboard.paymentMethods" :key="method.method" class="flex items-center justify-between text-sm">
              <span class="flex items-center gap-2">
                <span class="size-2 rounded-full" :style="{ background: paymentColors[index % paymentColors.length] }" />
                {{ method.method }}
              </span>
              <span class="font-medium">{{ method.percent }}%</span>
            </div>
          </div>
        </div>
        <div v-else class="mt-6 grid h-48 place-items-center text-center text-sm text-muted-foreground">
          Los metodos de pago apareceran cuando existan ventas.
        </div>
      </UiCard>
    </section>

    <section class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px]">
      <UiCard class="overflow-hidden">
        <div class="flex items-center justify-between p-5">
          <h2 class="text-base font-semibold">Productos bajo minimo</h2>
          <UiButton variant="ghost" size="sm">Ver todos</UiButton>
        </div>
        <div class="overflow-x-auto">
          <table v-if="dashboard.lowStockProducts.length" class="w-full min-w-[560px] text-sm">
            <thead class="bg-muted/70 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th class="px-5 py-3 font-medium">Producto</th>
                <th class="px-5 py-3 font-medium">Bodega</th>
                <th class="px-5 py-3 font-medium">Actual</th>
                <th class="px-5 py-3 font-medium">Minimo</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="item in dashboard.lowStockProducts" :key="item.id">
                <td class="px-5 py-4 font-medium">{{ item.name }}</td>
                <td class="px-5 py-4 text-muted-foreground">{{ item.warehouse }}</td>
                <td class="px-5 py-4">{{ item.quantity }}</td>
                <td class="px-5 py-4">{{ item.minStock }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="p-8 text-center text-sm text-muted-foreground">
            No hay productos bajo minimo.
          </div>
        </div>
      </UiCard>

      <UiCard class="overflow-hidden">
        <div class="flex items-center justify-between p-5">
          <h2 class="text-base font-semibold">Ultimas ventas</h2>
          <UiButton variant="ghost" size="sm">Ver todas</UiButton>
        </div>
        <div class="overflow-x-auto">
          <table v-if="dashboard.latestSales.length" class="w-full min-w-[580px] text-sm">
            <thead class="bg-muted/70 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th class="px-5 py-3 font-medium">Venta</th>
                <th class="px-5 py-3 font-medium">Hora</th>
                <th class="px-5 py-3 font-medium">Cajero</th>
                <th class="px-5 py-3 font-medium">Total</th>
                <th class="px-5 py-3 font-medium">Metodo</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="sale in dashboard.latestSales" :key="sale.id">
                <td class="px-5 py-4 font-medium text-primary">{{ sale.number }}</td>
                <td class="px-5 py-4 text-muted-foreground">{{ sale.time }}</td>
                <td class="px-5 py-4">{{ sale.cashier }}</td>
                <td class="px-5 py-4 font-medium">{{ money(sale.total) }}</td>
                <td class="px-5 py-4">
                  <UiBadge :variant="sale.method === 'Efectivo' ? 'success' : 'default'">{{ sale.method }}</UiBadge>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="p-8 text-center text-sm text-muted-foreground">
            Aun no hay ventas registradas.
          </div>
        </div>
      </UiCard>

      <UiCard class="p-5">
        <h2 class="text-base font-semibold">Actividad reciente</h2>
        <div class="mt-4 space-y-4">
          <div v-for="item in dashboard.activity" :key="item.id" class="flex gap-3">
            <UiBadge :variant="item.tone" class="mt-0.5 size-7 justify-center p-0">
              <ArrowUpRight v-if="item.tone === 'success'" class="size-3.5" aria-hidden="true" />
              <ArrowDownLeft v-else-if="item.tone === 'danger'" class="size-3.5" aria-hidden="true" />
              <ClipboardCheck v-else-if="item.tone === 'warning'" class="size-3.5" aria-hidden="true" />
              <Boxes v-else class="size-3.5" aria-hidden="true" />
            </UiBadge>
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{{ item.title }}</p>
              <p class="truncate text-xs text-muted-foreground">{{ item.description }}</p>
            </div>
          </div>
          <p v-if="!dashboard.activity.length" class="text-sm text-muted-foreground">
            La actividad reciente aparecera cuando lleguen eventos.
          </p>
        </div>
      </UiCard>
    </section>

    <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <UiButton variant="outline" class="h-16 justify-start bg-card">
        <ShoppingCart class="size-5 text-primary" aria-hidden="true" />
        Nueva venta
      </UiButton>
      <UiButton variant="outline" class="h-16 justify-start bg-card">
        <ClipboardCheck class="size-5 text-warning" aria-hidden="true" />
        Registrar compra
      </UiButton>
      <UiButton variant="outline" class="h-16 justify-start bg-card">
        <Boxes class="size-5 text-destructive" aria-hidden="true" />
        Ajuste de inventario
      </UiButton>
      <UiButton variant="outline" class="h-16 justify-start bg-card">
        <ArrowUpRight class="size-5 text-primary" aria-hidden="true" />
        Transferir productos
      </UiButton>
      <UiButton variant="outline" class="h-16 justify-start bg-card">
        <Banknote class="size-5 text-success" aria-hidden="true" />
        Ver reportes
      </UiButton>
    </section>
  </div>
</template>
