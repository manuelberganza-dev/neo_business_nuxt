<script setup lang="ts">
import {
  ArrowLeftRight,
  Bell,
  Boxes,
  ClipboardList,
  History,
  PackageSearch,
  RefreshCw,
  Save,
  SlidersHorizontal,
} from '@lucide/vue'
import type { StockAdjustmentPayload, StockTransferPayload } from '~/stores/inventory'
import type { InventoryItem, StockMovement } from '~/types/inventory'

definePageMeta({
  middleware: 'permission',
  permission: 'inventory_items.read',
})

const inventory = useInventoryStore()
const context = useBusinessContextStore()
const notifications = useNotificationsStore()
const { can } = usePermissions()

const activeTab = ref<'stock' | 'kardex' | 'minimums' | 'adjustments' | 'transfers' | 'history' | 'alerts'>('stock')
const selectedWarehouseId = ref<number | ''>('')
const selectedProductId = ref<number | ''>('')
const minStockDrafts = reactive<Record<number, string>>({})
const adjustment = reactive<StockAdjustmentPayload>({
  product_id: '',
  warehouse_id: '',
  movement_type: 'adjustment',
  qty: '',
  unit_cost: '',
  notes: '',
  allow_negative: false,
})
const transfer = reactive<StockTransferPayload>({
  product_id: '',
  from_warehouse_id: '',
  to_warehouse_id: '',
  qty: '',
  notes: '',
})

const tabs = [
  { key: 'stock', label: 'Existencias', icon: Boxes },
  { key: 'kardex', label: 'Kardex', icon: ClipboardList },
  { key: 'minimums', label: 'Minimos', icon: SlidersHorizontal },
  { key: 'adjustments', label: 'Ajustes', icon: Save },
  { key: 'transfers', label: 'Transferencias', icon: ArrowLeftRight },
  { key: 'history', label: 'Historial por bodega', icon: History },
  { key: 'alerts', label: 'Alertas', icon: Bell },
] as const

const movementTypes = [
  { value: 'adjustment', label: 'Ajuste manual' },
  { value: 'purchase', label: 'Entrada' },
  { value: 'sale', label: 'Salida' },
]

const canWriteInventory = computed(() => can('inventory_items.write') || can('stock_movements.write'))
const canMoveStock = computed(() => can('stock_movements.write'))
const selectedProduct = computed(() => inventory.products.find((item) => item.id === Number(selectedProductId.value)) ?? null)
const selectedWarehouse = computed(() => inventory.warehouses.find((item) => item.id === Number(selectedWarehouseId.value)) ?? null)

function money(value: number) {
  return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(value)
}

function numberValue(value: number) {
  return new Intl.NumberFormat('es-SV', { maximumFractionDigits: 2 }).format(value)
}

function movementLabel(type: string) {
  return movementTypes.find((item) => item.value === type)?.label ?? type
}

function movementTone(type: string) {
  if (type === 'purchase' || type === 'transfer_in') return 'success'
  if (type === 'sale' || type === 'transfer_out') return 'danger'

  return 'muted'
}

function movementSign(movement: StockMovement) {
  return movement.qty > 0 ? `+${numberValue(movement.qty)}` : numberValue(movement.qty)
}

function dateTime(value: string) {
  if (!value) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function setMinDraft(item: InventoryItem) {
  if (minStockDrafts[item.id] === undefined) {
    minStockDrafts[item.id] = String(item.minStock)
  }
}

function resetOperationForms() {
  adjustment.product_id = selectedProductId.value
  adjustment.warehouse_id = selectedWarehouseId.value || context.selectedWarehouseId || ''
  adjustment.movement_type = 'adjustment'
  adjustment.qty = ''
  adjustment.unit_cost = selectedProduct.value?.cost ? String(selectedProduct.value.cost) : ''
  adjustment.notes = ''
  adjustment.allow_negative = false

  transfer.product_id = selectedProductId.value
  transfer.from_warehouse_id = selectedWarehouseId.value || context.selectedWarehouseId || ''
  transfer.to_warehouse_id = ''
  transfer.qty = ''
  transfer.notes = ''
}

async function refreshInventory() {
  await inventory.loadInventory({
    warehouseId: selectedWarehouseId.value ? Number(selectedWarehouseId.value) : null,
    productId: selectedProductId.value ? Number(selectedProductId.value) : null,
  })
  inventory.items.forEach(setMinDraft)
}

async function saveMinimum(item: InventoryItem) {
  await inventory.updateMinStock(item.id, minStockDrafts[item.id] ?? item.minStock)
  if (inventory.lowStockItems.length > 0) {
    notifications.add({
      title: 'Stock bajo actualizado',
      description: `${inventory.lowStockItems.length} producto${inventory.lowStockItems.length === 1 ? '' : 's'} sigue${inventory.lowStockItems.length === 1 ? '' : 'n'} bajo minimo.`,
      tone: 'warning',
    })
  }
}

async function submitAdjustment() {
  await inventory.createAdjustment({ ...adjustment })
  resetOperationForms()
}

async function submitTransfer() {
  await inventory.createTransfer({ ...transfer })
  resetOperationForms()
}

watch(selectedProductId, async (productId) => {
  resetOperationForms()
  if (productId) await inventory.loadProductKardex(productId)
})

watch(selectedWarehouseId, async (warehouseId) => {
  resetOperationForms()
  await refreshInventory()
  if (warehouseId) await inventory.loadWarehouseHistory(warehouseId)
})

onMounted(async () => {
  if (!context.loaded) {
    await context.loadContext()
  }

  selectedWarehouseId.value = context.selectedWarehouseId ?? ''
  await refreshInventory()
  resetOperationForms()
})
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div class="min-w-0">
        <div class="flex items-center gap-3">
          <div class="grid size-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <Boxes class="size-5" aria-hidden="true" />
          </div>
          <div>
            <p class="text-sm font-medium text-muted-foreground">Operacion</p>
            <h1 class="text-2xl font-semibold tracking-normal">Inventario</h1>
          </div>
        </div>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Existencias por bodega, kardex, minimos, ajustes, transferencias y alertas de stock bajo desde Rails.
        </p>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          v-model="selectedWarehouseId"
          class="h-10 rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Filtrar por bodega"
        >
          <option value="">Todas las bodegas</option>
          <option v-for="warehouse in inventory.warehouses" :key="warehouse.id" :value="warehouse.id">
            {{ warehouse.name }}
          </option>
        </select>
        <select
          v-model="selectedProductId"
          class="h-10 rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Filtrar por producto"
        >
          <option value="">Todos los productos</option>
          <option v-for="product in inventory.products" :key="product.id" :value="product.id">
            {{ product.name }}
          </option>
        </select>
        <UiButton variant="outline" :disabled="inventory.loading" @click="refreshInventory">
          <RefreshCw class="size-4" aria-hidden="true" />
          Actualizar
        </UiButton>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-4">
      <BaseMetricCard title="Unidades" :value="numberValue(inventory.totalUnits)" helper="Existencia filtrada" tone="blue" :icon="Boxes" />
      <BaseMetricCard title="Productos con stock" :value="String(inventory.stockedProducts)" helper="Segun bodega seleccionada" tone="green" :icon="PackageSearch" />
      <BaseMetricCard title="Bodegas activas" :value="String(inventory.activeWarehouses)" helper="Con movimientos o existencia" tone="amber" :icon="History" />
      <BaseMetricCard title="Bajo minimo" :value="String(inventory.lowStockItems.length)" helper="Requieren revision" tone="rose" :icon="Bell" />
    </div>

    <div v-if="inventory.error" class="rounded-md border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
      {{ inventory.error }}
    </div>
    <div v-if="inventory.success" class="rounded-md border border-success/20 bg-success/8 px-4 py-3 text-sm text-success">
      {{ inventory.success }}
    </div>

    <div class="overflow-x-auto">
      <div class="flex min-w-max gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors"
          :class="activeTab === tab.key ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" class="size-4" aria-hidden="true" />
          {{ tab.label }}
        </button>
      </div>
    </div>

    <UiCard v-if="activeTab === 'stock'" class="overflow-hidden">
      <div class="border-b p-4">
        <h2 class="text-base font-semibold">Existencias</h2>
        <p class="mt-1 text-sm text-muted-foreground">Stock actual por producto y bodega.</p>
      </div>
      <div v-if="inventory.loading" class="grid min-h-72 place-items-center text-sm text-muted-foreground">Cargando inventario...</div>
      <div v-else-if="inventory.items.length === 0" class="grid min-h-72 place-items-center px-6 text-center">
        <div>
          <PackageSearch class="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <h3 class="mt-3 text-lg font-semibold">Sin existencias registradas</h3>
          <p class="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Crea productos y registra compras, ajustes o transferencias para ver existencias aqui.
          </p>
        </div>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y text-sm">
          <thead class="bg-muted/45 text-left text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th class="px-4 py-3">Producto</th>
              <th class="px-4 py-3">SKU</th>
              <th class="px-4 py-3">Bodega</th>
              <th class="px-4 py-3 text-right">Cantidad</th>
              <th class="px-4 py-3 text-right">Minimo</th>
              <th class="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="item in inventory.items" :key="item.id">
              <td class="px-4 py-3 font-medium">{{ item.productName }}</td>
              <td class="px-4 py-3 text-muted-foreground">{{ item.sku || 'No definido' }}</td>
              <td class="px-4 py-3">{{ item.warehouseName }}</td>
              <td class="px-4 py-3 text-right font-semibold">{{ numberValue(item.quantity) }}</td>
              <td class="px-4 py-3 text-right">{{ numberValue(item.minStock) }}</td>
              <td class="px-4 py-3">
                <UiBadge :variant="item.lowStock ? 'warning' : 'success'">{{ item.lowStock ? 'Bajo minimo' : 'Suficiente' }}</UiBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <UiCard v-if="activeTab === 'minimums'" class="overflow-hidden">
      <div class="border-b p-4">
        <h2 class="text-base font-semibold">Minimos de stock</h2>
        <p class="mt-1 text-sm text-muted-foreground">Actualiza el umbral de alerta por producto y bodega.</p>
      </div>
      <div v-if="inventory.items.length === 0" class="grid min-h-72 place-items-center px-6 text-center text-sm text-muted-foreground">
        No hay existencias para configurar minimos.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y text-sm">
          <thead class="bg-muted/45 text-left text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th class="px-4 py-3">Producto</th>
              <th class="px-4 py-3">Bodega</th>
              <th class="px-4 py-3 text-right">Existencia</th>
              <th class="px-4 py-3">Minimo</th>
              <th class="px-4 py-3 text-right">Accion</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="item in inventory.items" :key="item.id">
              <td class="px-4 py-3 font-medium">{{ item.productName }}</td>
              <td class="px-4 py-3">{{ item.warehouseName }}</td>
              <td class="px-4 py-3 text-right">{{ numberValue(item.quantity) }}</td>
              <td class="px-4 py-3">
                <UiInput v-model="minStockDrafts[item.id]" type="number" class="w-28" />
              </td>
              <td class="px-4 py-3 text-right">
                <UiButton size="sm" :disabled="!can('inventory_items.write') || inventory.saving" @click="saveMinimum(item)">
                  Guardar
                </UiButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <UiCard v-if="activeTab === 'kardex'" class="p-5">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-base font-semibold">Kardex por producto</h2>
          <p class="mt-1 text-sm text-muted-foreground">Selecciona un producto para consultar sus movimientos cronologicos.</p>
        </div>
        <UiButton :disabled="!selectedProductId" @click="selectedProductId && inventory.loadProductKardex(selectedProductId)">
          Consultar kardex
        </UiButton>
      </div>
      <div class="mt-5">
        <InventoryMovementTable :movements="inventory.kardex" empty-text="Selecciona un producto para ver su kardex." />
      </div>
    </UiCard>

    <UiCard v-if="activeTab === 'adjustments'" class="p-5">
      <div class="max-w-3xl">
        <h2 class="text-base font-semibold">Ajustes de inventario</h2>
        <p class="mt-1 text-sm text-muted-foreground">Registra entradas o salidas manuales. Los ajustes requieren una razon.</p>
        <form class="mt-5 grid gap-4 md:grid-cols-2" @submit.prevent="submitAdjustment">
          <label class="space-y-2">
            <span class="text-sm font-medium">Producto</span>
            <select v-model="adjustment.product_id" required class="h-10 w-full rounded-md border bg-card px-3 text-sm">
              <option value="">Seleccionar</option>
              <option v-for="product in inventory.products" :key="product.id" :value="product.id">{{ product.name }}</option>
            </select>
          </label>
          <label class="space-y-2">
            <span class="text-sm font-medium">Bodega</span>
            <select v-model="adjustment.warehouse_id" required class="h-10 w-full rounded-md border bg-card px-3 text-sm">
              <option value="">Seleccionar</option>
              <option v-for="warehouse in inventory.warehouses" :key="warehouse.id" :value="warehouse.id">{{ warehouse.name }}</option>
            </select>
          </label>
          <label class="space-y-2">
            <span class="text-sm font-medium">Tipo</span>
            <select v-model="adjustment.movement_type" required class="h-10 w-full rounded-md border bg-card px-3 text-sm">
              <option v-for="type in movementTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
            </select>
          </label>
          <label class="space-y-2">
            <span class="text-sm font-medium">Cantidad</span>
            <UiInput v-model="adjustment.qty" type="number" required placeholder="5" />
          </label>
          <label class="space-y-2">
            <span class="text-sm font-medium">Costo unitario</span>
            <UiInput v-model="adjustment.unit_cost" type="number" placeholder="2.50" />
          </label>
          <label class="flex h-10 items-center gap-2 self-end rounded-md border bg-card px-3 text-sm">
            <input v-model="adjustment.allow_negative" type="checkbox" class="size-4 rounded border">
            Permitir negativo
          </label>
          <label class="space-y-2 md:col-span-2">
            <span class="text-sm font-medium">Notas</span>
            <textarea v-model="adjustment.notes" required class="min-h-24 w-full rounded-md border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Conteo fisico, merma, correccion u otra razon." />
          </label>
          <div class="md:col-span-2">
            <UiButton type="submit" :disabled="!canMoveStock || inventory.saving">
              <Save class="size-4" aria-hidden="true" />
              Registrar ajuste
            </UiButton>
          </div>
        </form>
      </div>
    </UiCard>

    <UiCard v-if="activeTab === 'transfers'" class="p-5">
      <div class="max-w-3xl">
        <h2 class="text-base font-semibold">Transferencias entre bodegas</h2>
        <p class="mt-1 text-sm text-muted-foreground">Mueve stock entre ubicaciones del mismo negocio.</p>
        <form class="mt-5 grid gap-4 md:grid-cols-2" @submit.prevent="submitTransfer">
          <label class="space-y-2 md:col-span-2">
            <span class="text-sm font-medium">Producto</span>
            <select v-model="transfer.product_id" required class="h-10 w-full rounded-md border bg-card px-3 text-sm">
              <option value="">Seleccionar</option>
              <option v-for="product in inventory.products" :key="product.id" :value="product.id">{{ product.name }}</option>
            </select>
          </label>
          <label class="space-y-2">
            <span class="text-sm font-medium">Desde</span>
            <select v-model="transfer.from_warehouse_id" required class="h-10 w-full rounded-md border bg-card px-3 text-sm">
              <option value="">Seleccionar</option>
              <option v-for="warehouse in inventory.warehouses" :key="warehouse.id" :value="warehouse.id">{{ warehouse.name }}</option>
            </select>
          </label>
          <label class="space-y-2">
            <span class="text-sm font-medium">Hacia</span>
            <select v-model="transfer.to_warehouse_id" required class="h-10 w-full rounded-md border bg-card px-3 text-sm">
              <option value="">Seleccionar</option>
              <option v-for="warehouse in inventory.warehouses.filter((item) => item.id !== Number(transfer.from_warehouse_id))" :key="warehouse.id" :value="warehouse.id">{{ warehouse.name }}</option>
            </select>
          </label>
          <label class="space-y-2">
            <span class="text-sm font-medium">Cantidad</span>
            <UiInput v-model="transfer.qty" type="number" required placeholder="3" />
          </label>
          <label class="space-y-2 md:col-span-2">
            <span class="text-sm font-medium">Notas</span>
            <textarea v-model="transfer.notes" class="min-h-24 w-full rounded-md border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Reabastecimiento, traslado a sala de ventas, etc." />
          </label>
          <div class="md:col-span-2">
            <UiButton type="submit" :disabled="!canMoveStock || inventory.saving || inventory.warehouses.length < 2">
              <ArrowLeftRight class="size-4" aria-hidden="true" />
              Registrar transferencia
            </UiButton>
            <p v-if="inventory.warehouses.length < 2" class="mt-2 text-sm text-muted-foreground">Necesitas al menos dos bodegas activas para transferir.</p>
          </div>
        </form>
      </div>
    </UiCard>

    <UiCard v-if="activeTab === 'history'" class="p-5">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-base font-semibold">Historial por bodega</h2>
          <p class="mt-1 text-sm text-muted-foreground">Ultimos movimientos de {{ selectedWarehouse?.name ?? 'la bodega seleccionada' }}.</p>
        </div>
        <UiButton :disabled="!selectedWarehouseId" @click="selectedWarehouseId && inventory.loadWarehouseHistory(selectedWarehouseId)">
          Consultar historial
        </UiButton>
      </div>
      <div class="mt-5">
        <InventoryMovementTable :movements="inventory.warehouseHistory" empty-text="Selecciona una bodega para ver su historial." />
      </div>
    </UiCard>

    <UiCard v-if="activeTab === 'alerts'" class="overflow-hidden">
      <div class="border-b p-4">
        <h2 class="text-base font-semibold">Alertas de stock bajo</h2>
        <p class="mt-1 text-sm text-muted-foreground">Productos cuya existencia esta igual o debajo del minimo configurado.</p>
      </div>
      <div v-if="inventory.lowStockItems.length === 0" class="grid min-h-72 place-items-center px-6 text-center">
        <div>
          <Bell class="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <h3 class="mt-3 text-lg font-semibold">Sin alertas activas</h3>
          <p class="mt-2 max-w-md text-sm leading-6 text-muted-foreground">No hay productos por debajo del minimo en este momento.</p>
        </div>
      </div>
      <div v-else class="divide-y">
        <div v-for="item in inventory.lowStockItems" :key="item.id" class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="font-medium">{{ item.productName }}</p>
            <p class="mt-1 text-sm text-muted-foreground">{{ item.warehouseName }} · SKU {{ item.sku || 'No definido' }}</p>
          </div>
          <div class="flex items-center gap-3">
            <UiBadge variant="warning">{{ numberValue(item.quantity) }} / min {{ numberValue(item.minStock) }}</UiBadge>
            <UiButton size="sm" variant="outline" @click="activeTab = 'minimums'">Revisar minimo</UiButton>
          </div>
        </div>
      </div>
    </UiCard>

    <UiCard v-if="!canWriteInventory" class="p-4 text-sm text-muted-foreground">
      Tu rol actual permite consultar inventario, pero no modificar minimos ni registrar movimientos.
    </UiCard>
  </section>
</template>
