<script setup lang="ts">
import { ClipboardList, Plus, RefreshCw, RotateCcw, Search, Trash2 } from '@lucide/vue'
import type { PurchaseSummary } from '~/types/purchases'

definePageMeta({
  middleware: 'permission',
  permission: 'purchases.read',
})

const purchases = usePurchasesStore()
const { can } = usePermissions()
const filters = reactive({
  status: '',
  supplier_id: '',
  warehouse_id: '',
  from: '',
  to: '',
})
const voidPurchaseId = ref<number | null>(null)
const voidReason = ref('')

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

function statusLabel(status: string) {
  if (status === 'received') return 'Recibida'
  if (status === 'voided') return 'Anulada'
  if (status === 'draft') return 'Borrador'
  return status
}

function statusTone(status: string) {
  if (status === 'received') return 'success'
  if (status === 'voided') return 'danger'
  return 'muted'
}

async function refresh() {
  await purchases.load({
    status: filters.status,
    supplier_id: filters.supplier_id,
    warehouse_id: filters.warehouse_id,
    from: filters.from,
    to: filters.to,
  })
}

async function submitVoid(purchase: PurchaseSummary) {
  await purchases.voidPurchase(purchase.id, voidReason.value)
  voidPurchaseId.value = null
  voidReason.value = ''
}

onMounted(refresh)
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div class="min-w-0">
        <div class="flex items-center gap-3">
          <div class="grid size-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <ClipboardList class="size-5" aria-hidden="true" />
          </div>
          <div>
            <p class="text-sm font-medium text-muted-foreground">Operacion</p>
            <h1 class="text-2xl font-semibold tracking-normal">Compras</h1>
          </div>
        </div>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Historial, registro y anulacion de compras con entrada y reversa de inventario desde Rails.
        </p>
      </div>
      <UiButton variant="outline" :disabled="purchases.loading" @click="refresh">
        <RefreshCw class="size-4" aria-hidden="true" />
        Actualizar
      </UiButton>
    </div>

    <div v-if="purchases.error" class="rounded-md border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
      {{ purchases.error }}
    </div>
    <div v-if="purchases.success" class="rounded-md border border-success/25 bg-success/8 px-4 py-3 text-sm text-success">
      {{ purchases.success }}
    </div>

    <div class="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div class="min-w-0 space-y-4">
        <UiCard class="p-4">
          <form class="grid gap-3 lg:grid-cols-[1fr_1fr_130px_130px_140px_auto]" @submit.prevent="refresh">
            <select v-model="filters.supplier_id" class="h-10 rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Proveedor">
              <option value="">Todos los proveedores</option>
              <option v-for="supplier in purchases.suppliers" :key="supplier.id" :value="supplier.id">
                {{ supplier.name }}
              </option>
            </select>
            <select v-model="filters.warehouse_id" class="h-10 rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Bodega">
              <option value="">Todas las bodegas</option>
              <option v-for="warehouse in purchases.warehouses" :key="warehouse.id" :value="warehouse.id">
                {{ warehouse.name }}
              </option>
            </select>
            <UiInput v-model="filters.from" type="date" aria-label="Desde" />
            <UiInput v-model="filters.to" type="date" aria-label="Hasta" />
            <select v-model="filters.status" class="h-10 rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Estado">
              <option value="">Todos</option>
              <option value="received">Recibidas</option>
              <option value="voided">Anuladas</option>
            </select>
            <UiButton type="submit" :disabled="purchases.loading">
              <Search class="size-4" aria-hidden="true" />
              Buscar
            </UiButton>
          </form>
        </UiCard>

        <UiCard class="overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[820px] text-sm">
              <thead class="bg-muted/70 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th class="px-4 py-3 font-medium">Documento</th>
                  <th class="px-4 py-3 font-medium">Proveedor</th>
                  <th class="px-4 py-3 font-medium">Bodega</th>
                  <th class="px-4 py-3 font-medium">Fecha</th>
                  <th class="px-4 py-3 text-right font-medium">Total</th>
                  <th class="px-4 py-3 text-right font-medium">Estado</th>
                  <th class="px-4 py-3 text-right font-medium">Accion</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-if="!purchases.purchases.length">
                  <td colspan="7" class="px-4 py-10 text-center text-muted-foreground">Sin compras registradas.</td>
                </tr>
                <template v-for="purchase in purchases.purchases" :key="purchase.id">
                  <tr>
                    <td class="px-4 py-3 font-medium">{{ purchase.invoiceNumber }}</td>
                    <td class="px-4 py-3">{{ purchase.supplierName }}</td>
                    <td class="px-4 py-3">{{ purchase.warehouseName }}</td>
                    <td class="px-4 py-3">{{ dateTime(purchase.purchasedAt ?? purchase.createdAt) }}</td>
                    <td class="px-4 py-3 text-right font-medium">{{ money(purchase.total) }}</td>
                    <td class="px-4 py-3 text-right">
                      <UiBadge :variant="statusTone(purchase.status)">{{ statusLabel(purchase.status) }}</UiBadge>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <UiButton
                        v-if="can('purchases.write') && purchase.status === 'received'"
                        variant="ghost"
                        size="sm"
                        class="text-destructive"
                        @click="voidPurchaseId = voidPurchaseId === purchase.id ? null : purchase.id"
                      >
                        <RotateCcw class="size-4" aria-hidden="true" />
                        Anular
                      </UiButton>
                    </td>
                  </tr>
                  <tr v-if="voidPurchaseId === purchase.id" class="bg-muted/25">
                    <td colspan="7" class="px-4 py-3">
                      <form class="flex flex-col gap-2 sm:flex-row" @submit.prevent="submitVoid(purchase)">
                        <UiInput v-model="voidReason" placeholder="Motivo de anulacion" />
                        <UiButton type="submit" variant="destructive" :disabled="purchases.saving || voidReason.trim().length < 5">
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
      </div>

      <UiCard class="min-w-0 p-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold">Nueva compra</h2>
            <p class="mt-1 text-sm text-muted-foreground">Registra entrada a inventario.</p>
          </div>
          <UiButton variant="ghost" size="sm" @click="purchases.resetDraft">Limpiar</UiButton>
        </div>

        <form class="mt-4 space-y-3" @submit.prevent="purchases.create">
          <select v-model="purchases.draft.supplier_id" required class="h-10 w-full rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Proveedor">
            <option value="">Proveedor</option>
            <option v-for="supplier in purchases.suppliers" :key="supplier.id" :value="supplier.id">{{ supplier.name }}</option>
          </select>
          <select v-model="purchases.draft.warehouse_id" required class="h-10 w-full rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Bodega">
            <option value="">Bodega</option>
            <option v-for="warehouse in purchases.warehouses" :key="warehouse.id" :value="warehouse.id">{{ warehouse.name }}</option>
          </select>
          <div class="grid grid-cols-2 gap-2">
            <UiInput v-model="purchases.draft.document_type" placeholder="Tipo doc." required />
            <UiInput v-model="purchases.draft.invoice_number" placeholder="Numero factura" required />
          </div>
          <UiInput v-model="purchases.draft.discount" type="number" placeholder="Descuento" />

          <div class="space-y-2">
            <div v-for="(item, index) in purchases.draft.items" :key="index" class="rounded-md border bg-background p-3">
              <div class="grid gap-2">
                <select v-model="item.product_id" required class="h-10 rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Producto">
                  <option value="">Producto</option>
                  <option v-for="product in purchases.products" :key="product.id" :value="product.id">{{ product.name }}</option>
                </select>
                <div class="grid grid-cols-3 gap-2">
                  <UiInput v-model="item.quantity" type="number" placeholder="Cantidad" required />
                  <UiInput v-model="item.cost" type="number" placeholder="Costo" required />
                  <UiInput v-model="item.tax_rate" type="number" placeholder="IVA" required />
                </div>
                <div class="flex items-center justify-between gap-2">
                  <label class="flex items-center gap-2 text-xs text-muted-foreground">
                    <input v-model="item.update_product_cost" type="checkbox" class="size-4 rounded border">
                    Actualizar costo
                  </label>
                  <UiButton variant="ghost" size="sm" class="text-destructive" @click="purchases.removeItem(index)">
                    <Trash2 class="size-4" aria-hidden="true" />
                    Quitar
                  </UiButton>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <UiButton type="button" variant="outline" @click="purchases.addItem">
              <Plus class="size-4" aria-hidden="true" />
              Producto
            </UiButton>
            <UiButton type="submit" :disabled="purchases.saving || !can('purchases.write')">
              Registrar compra
            </UiButton>
          </div>
        </form>
      </UiCard>
    </div>
  </section>
</template>
