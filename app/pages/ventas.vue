<script setup lang="ts">
import { FileText, RefreshCw, Search, ShoppingCart } from '@lucide/vue'
import type { SaleSummary } from '~/types/pos'

definePageMeta({
  middleware: 'permission',
  permission: 'sales.read',
})

const pos = usePosStore()
const { can } = usePermissions()
const context = useBusinessContextStore()
const voidSaleId = ref<number | null>(null)
const voidReason = ref('')
const filters = reactive({
  status: '',
  from: '',
  to: '',
  sale_number: '',
  cash_session_id: '',
})

function money(value: number) {
  return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(value)
}

function dateTime(value?: string) {
  if (!value) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function saleTone(status: string) {
  return status === 'voided' ? 'danger' : status === 'paid' ? 'success' : 'muted'
}

function saleStatus(status: string) {
  if (status === 'voided') return 'Anulada'
  if (status === 'paid') return 'Pagada'
  return status
}

async function submitVoid(sale: SaleSummary) {
  try {
    await pos.voidSale(sale.id, voidReason.value)
    voidSaleId.value = null
    voidReason.value = ''
  }
  catch {
    // El store muestra el detalle que Rails devuelve.
  }
}

async function refreshSales() {
  await pos.refreshSales({
    status: filters.status,
    from: filters.from,
    to: filters.to,
    sale_number: filters.sale_number,
    cash_session_id: filters.cash_session_id,
    branch_id: context.selectedBranchId ?? '',
    limit: 50,
  })
}

onMounted(async () => {
  if (!context.loaded) await context.loadContext()
  await refreshSales()
})
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <div class="flex items-center gap-3">
          <div class="grid size-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <ShoppingCart class="size-5" aria-hidden="true" />
          </div>
          <div>
            <p class="text-sm font-medium text-muted-foreground">Operacion</p>
            <h1 class="text-2xl font-semibold tracking-normal">Ventas</h1>
          </div>
        </div>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Historial reciente de ventas con anulacion controlada por permisos.
        </p>
      </div>
      <div class="flex gap-2">
        <UiButton variant="outline" :disabled="pos.loading" @click="refreshSales">
          <RefreshCw class="size-4" aria-hidden="true" />
          Actualizar
        </UiButton>
        <NuxtLink to="/pos">
          <UiButton>
            <ShoppingCart class="size-4" aria-hidden="true" />
            Abrir POS
          </UiButton>
        </NuxtLink>
      </div>
    </div>

    <UiCard class="p-4">
      <form class="grid gap-3 md:grid-cols-[1fr_150px_150px_150px_150px_auto]" @submit.prevent="refreshSales">
        <UiInput v-model="filters.sale_number" placeholder="Numero de venta" />
        <select v-model="filters.status" class="h-10 rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Estado">
          <option value="">Todos</option>
          <option value="paid">Pagadas</option>
          <option value="voided">Anuladas</option>
        </select>
        <UiInput v-model="filters.from" type="date" aria-label="Desde" />
        <UiInput v-model="filters.to" type="date" aria-label="Hasta" />
        <UiInput v-model="filters.cash_session_id" type="number" placeholder="Sesion caja" />
        <UiButton type="submit" :disabled="pos.loading">
          <Search class="size-4" aria-hidden="true" />
          Buscar
        </UiButton>
      </form>
    </UiCard>

    <div v-if="pos.error" class="rounded-md border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
      {{ pos.error }}
    </div>
    <div v-if="pos.success" class="rounded-md border border-success/25 bg-success/8 px-4 py-3 text-sm text-success">
      {{ pos.success }}
    </div>

    <UiCard class="p-4">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[780px] text-sm">
          <thead class="text-left text-xs text-muted-foreground">
            <tr class="border-b">
              <th class="pb-2 font-medium">Venta</th>
              <th class="pb-2 font-medium">Cliente</th>
              <th class="pb-2 font-medium">Cajero</th>
              <th class="pb-2 font-medium">Fecha</th>
              <th class="pb-2 text-right font-medium">Total</th>
              <th class="pb-2 text-right font-medium">Estado</th>
              <th class="pb-2 text-right font-medium">Accion</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!pos.sales.length">
              <td colspan="7" class="py-10 text-center text-muted-foreground">Sin ventas recientes.</td>
            </tr>
            <template v-for="sale in pos.sales" :key="sale.id">
              <tr class="border-b last:border-0">
                <td class="py-3 font-medium">{{ sale.saleNumber }}</td>
                <td class="py-3">{{ sale.customerName }}</td>
                <td class="py-3">{{ sale.cashierName }}</td>
                <td class="py-3">{{ dateTime(sale.soldAt) }}</td>
                <td class="py-3 text-right font-medium">{{ money(sale.total) }}</td>
                <td class="py-3 text-right">
                  <UiBadge :variant="saleTone(sale.status)">
                    {{ saleStatus(sale.status) }}
                  </UiBadge>
                </td>
                <td class="py-3 text-right">
                  <UiButton
                    v-if="can('sales.write') && sale.status === 'paid'"
                    variant="ghost"
                    size="sm"
                    class="text-destructive"
                    @click="voidSaleId = voidSaleId === sale.id ? null : sale.id"
                  >
                    <FileText class="size-4" aria-hidden="true" />
                    Anular
                  </UiButton>
                </td>
              </tr>
              <tr v-if="voidSaleId === sale.id" class="border-b bg-muted/25">
                <td colspan="7" class="py-3">
                  <form class="flex flex-col gap-2 sm:flex-row" @submit.prevent="submitVoid(sale)">
                    <UiInput v-model="voidReason" placeholder="Motivo de anulacion" />
                    <UiButton type="submit" variant="destructive" :disabled="pos.saving || voidReason.trim().length < 5">
                      Confirmar anulacion
                    </UiButton>
                  </form>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </UiCard>
  </section>
</template>
