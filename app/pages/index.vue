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

const metrics = [
  {
    title: 'Ventas del dia',
    value: '$2,458.75',
    helper: '12.5% sobre ayer',
    tone: 'blue' as const,
    icon: TrendingUp,
  },
  {
    title: 'Ventas del mes',
    value: '$58,965.40',
    helper: '8.3% sobre mes anterior',
    tone: 'green' as const,
    icon: ChartNoAxesCombined,
  },
  {
    title: 'Transacciones',
    value: '48',
    helper: 'Promedio estable',
    tone: 'amber' as const,
    icon: ReceiptText,
  },
  {
    title: 'Stock bajo',
    value: '23',
    helper: 'Requieren revision',
    tone: 'rose' as const,
    icon: PackageSearch,
  },
]

const lowStock = [
  ['Cafe Supremo 400g', 'Bodega principal', '5', '10'],
  ['Azucar 1kg', 'Bodega principal', '8', '20'],
  ['Aceite vegetal 900ml', 'Bodega 1', '6', '15'],
  ['Arroz blanco 1kg', 'Bodega 2', '7', '20'],
]

const sales = [
  ['V-0001234', '11:42 AM', 'Juan Perez', '$24.50', 'Efectivo'],
  ['V-0001233', '11:30 AM', 'Maria Lopez', '$18.75', 'Tarjeta'],
  ['V-0001232', '11:21 AM', 'Ana Garcia', '$37.10', 'Efectivo'],
  ['V-0001231', '11:15 AM', 'Carlos Ruiz', '$52.00', 'Tarjeta'],
]

const activity = [
  { label: 'Venta realizada', detail: 'Caja 1 - Juan Perez', tone: 'success' as const },
  { label: 'Stock bajo', detail: 'Cafe Supremo 400g', tone: 'danger' as const },
  { label: 'Transferencia completada', detail: 'Bodega 1 a Bodega 2', tone: 'default' as const },
  { label: 'Ajuste de inventario', detail: 'Leche entera 1L', tone: 'warning' as const },
]

const chartBars = [18, 22, 31, 28, 42, 48, 65, 58, 73, 69, 88, 76, 91]
</script>

<template>
  <div class="mx-auto max-w-[1500px] space-y-6">
    <section class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-sm font-medium text-muted-foreground">Resumen general</p>
        <h1 class="mt-1 text-3xl font-semibold tracking-normal text-foreground">Bienvenido, Administrador</h1>
      </div>
      <div class="flex flex-wrap gap-2">
        <UiBadge variant="success">En linea</UiBadge>
        <UiBadge variant="muted">Hoy</UiBadge>
        <UiBadge variant="muted">25 mayo 2026</UiBadge>
      </div>
    </section>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Metricas principales">
      <BaseMetricCard
        v-for="metric in metrics"
        :key="metric.title"
        v-bind="metric"
      />
    </section>

    <section class="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
      <UiCard class="p-5">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold">Ventas por hora</h2>
            <p class="mt-1 text-sm text-muted-foreground">Movimiento del dia actual</p>
          </div>
          <UiButton variant="outline" size="sm">
            <RefreshCcw class="size-4" aria-hidden="true" />
            Actualizar
          </UiButton>
        </div>

        <div class="mt-6 h-72 rounded-md border bg-background p-4">
          <div class="flex h-full items-end gap-2">
            <div
              v-for="(height, index) in chartBars"
              :key="index"
              class="flex-1 rounded-t-md bg-primary/85"
              :style="{ height: `${height}%` }"
            />
          </div>
        </div>
      </UiCard>

      <UiCard class="p-5">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold">Metodos de pago</h2>
          <CreditCard class="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <div class="mt-6 grid gap-4 sm:grid-cols-[150px_1fr] xl:grid-cols-1">
          <div class="mx-auto grid size-36 place-items-center rounded-full bg-[conic-gradient(var(--success)_0_48%,var(--primary)_48%_76%,var(--warning)_76%_100%)]">
            <div class="size-20 rounded-full bg-card" />
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="flex items-center gap-2"><span class="size-2 rounded-full bg-success" />Efectivo</span>
              <span class="font-medium">45.6%</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="flex items-center gap-2"><span class="size-2 rounded-full bg-primary" />Tarjeta</span>
              <span class="font-medium">28.3%</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="flex items-center gap-2"><span class="size-2 rounded-full bg-warning" />Transferencia</span>
              <span class="font-medium">26.1%</span>
            </div>
          </div>
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
          <table class="w-full min-w-[560px] text-sm">
            <thead class="bg-muted/70 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th class="px-5 py-3 font-medium">Producto</th>
                <th class="px-5 py-3 font-medium">Bodega</th>
                <th class="px-5 py-3 font-medium">Actual</th>
                <th class="px-5 py-3 font-medium">Minimo</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="item in lowStock" :key="item[0]">
                <td class="px-5 py-4 font-medium">{{ item[0] }}</td>
                <td class="px-5 py-4 text-muted-foreground">{{ item[1] }}</td>
                <td class="px-5 py-4">{{ item[2] }}</td>
                <td class="px-5 py-4">{{ item[3] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UiCard>

      <UiCard class="overflow-hidden">
        <div class="flex items-center justify-between p-5">
          <h2 class="text-base font-semibold">Ultimas ventas</h2>
          <UiButton variant="ghost" size="sm">Ver todas</UiButton>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[580px] text-sm">
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
              <tr v-for="sale in sales" :key="sale[0]">
                <td class="px-5 py-4 font-medium text-primary">{{ sale[0] }}</td>
                <td class="px-5 py-4 text-muted-foreground">{{ sale[1] }}</td>
                <td class="px-5 py-4">{{ sale[2] }}</td>
                <td class="px-5 py-4 font-medium">{{ sale[3] }}</td>
                <td class="px-5 py-4">
                  <UiBadge :variant="sale[4] === 'Efectivo' ? 'success' : 'default'">{{ sale[4] }}</UiBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UiCard>

      <UiCard class="p-5">
        <h2 class="text-base font-semibold">Actividad reciente</h2>
        <div class="mt-4 space-y-4">
          <div v-for="item in activity" :key="item.label" class="flex gap-3">
            <UiBadge :variant="item.tone" class="mt-0.5 size-7 justify-center p-0">
              <ArrowUpRight v-if="item.tone === 'success'" class="size-3.5" aria-hidden="true" />
              <ArrowDownLeft v-else-if="item.tone === 'danger'" class="size-3.5" aria-hidden="true" />
              <ClipboardCheck v-else-if="item.tone === 'warning'" class="size-3.5" aria-hidden="true" />
              <Boxes v-else class="size-3.5" aria-hidden="true" />
            </UiBadge>
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{{ item.label }}</p>
              <p class="truncate text-xs text-muted-foreground">{{ item.detail }}</p>
            </div>
          </div>
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
