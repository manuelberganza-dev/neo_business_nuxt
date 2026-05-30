<script setup lang="ts">
import {
  Banknote,
  Barcode,
  CircleDollarSign,
  CreditCard,
  FileText,
  Minus,
  PackageSearch,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  XCircle,
} from '@lucide/vue'
import type { PosProduct, SaleSummary } from '~/types/pos'

definePageMeta({
  middleware: 'permission',
  permission: 'sales.write',
})

const pos = usePosStore()
const context = useBusinessContextStore()
const notifications = useNotificationsStore()

const search = ref('')
const openingAmount = ref('0.00')
const closingAmount = ref('')
const voidSaleId = ref<number | null>(null)
const voidReason = ref('')

const filteredProducts = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return pos.products.slice(0, 18)

  return pos.products
    .filter((product) => {
      return [product.name, product.sku, product.barcode]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term))
    })
    .slice(0, 24)
})

const branchLabel = computed(() => context.selectedBranch?.name ?? 'Sucursal actual')
const warehouseLabel = computed(() => context.selectedWarehouse?.name ?? 'Bodega actual')
const activeSessionLabel = computed(() => pos.activeSession ? `Sesion #${pos.activeSession.id}` : 'Caja cerrada')
const cashRegisterLabel = computed(() => {
  const register = pos.selectedCashRegister
  if (!register) return pos.cashRegisterId ? `Caja ID ${pos.cashRegisterId}` : 'Caja sin seleccionar'

  return `${register.code} - ${register.name}`
})
const idempotencyLabel = computed(() => pos.currentIdempotencyKey.slice(0, 18))

function money(value: number) {
  return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(value)
}

function numberValue(value: number) {
  return new Intl.NumberFormat('es-SV', { maximumFractionDigits: 2 }).format(value)
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

function addProduct(product: PosProduct) {
  pos.addProduct(product)
}

async function openCashSession() {
  try {
    await pos.openCashSession(openingAmount.value)
    notifications.add({
      title: 'Caja abierta',
      description: `${activeSessionLabel.value} lista para vender.`,
      tone: 'success',
    })
  }
  catch {
    // El store muestra el detalle que Rails devuelve.
  }
}

async function closeCashSession() {
  try {
    await pos.closeCashSession(closingAmount.value)
    closingAmount.value = ''
    notifications.add({
      title: 'Caja cerrada',
      description: 'La sesion quedo cerrada en Rails.',
      tone: 'success',
    })
  }
  catch {
    // El store muestra el detalle que Rails devuelve.
  }
}

async function selectCashRegister(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  await pos.selectCashRegister(value ? Number(value) : '')
}

async function checkout() {
  try {
    await pos.checkout()
    notifications.add({
      title: 'Venta registrada',
      description: 'La venta fue enviada una sola vez con clave idempotente.',
      tone: 'success',
    })
  }
  catch {
    // El store muestra el detalle que Rails devuelve.
  }
}

async function submitVoid(sale: SaleSummary) {
  try {
    await pos.voidSale(sale.id, voidReason.value)
    voidSaleId.value = null
    voidReason.value = ''
    notifications.add({
      title: 'Venta anulada',
      description: `${sale.saleNumber} fue anulada con motivo.`,
      tone: 'warning',
    })
  }
  catch {
    // El store muestra el detalle que Rails devuelve.
  }
}

watch(() => pos.fiscalCustomer.customerId, (customerId) => {
  pos.applyCustomer(customerId)
})

onMounted(async () => {
  pos.restoreSession()
  await pos.loadReferenceData()
})
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div class="min-w-0">
        <div class="flex items-center gap-3">
          <div class="grid size-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <Receipt class="size-5" aria-hidden="true" />
          </div>
          <div>
            <p class="text-sm font-medium text-muted-foreground">Operacion</p>
            <h1 class="text-2xl font-semibold tracking-normal">POS y caja</h1>
          </div>
        </div>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Venta rapida con pagos mixtos, cliente fiscal, caja activa, anulacion con motivo y clave idempotente por cobro.
        </p>
      </div>

      <div class="grid gap-2 text-sm sm:grid-cols-2 xl:min-w-[360px]">
        <div class="rounded-md border bg-card px-3 py-2">
          <p class="text-xs text-muted-foreground">Sucursal</p>
          <p class="truncate font-medium">{{ branchLabel }}</p>
        </div>
        <div class="rounded-md border bg-card px-3 py-2">
          <p class="text-xs text-muted-foreground">Bodega</p>
          <p class="truncate font-medium">{{ warehouseLabel }}</p>
        </div>
      </div>
    </div>

    <div v-if="pos.error" class="rounded-md border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
      {{ pos.error }}
    </div>
    <div v-if="pos.success" class="rounded-md border border-success/25 bg-success/8 px-4 py-3 text-sm text-success">
      {{ pos.success }}
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
      <div class="space-y-4">
        <UiCard class="p-4">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <UiBadge :variant="pos.activeSession ? 'success' : 'warning'">
                  {{ activeSessionLabel }}
                </UiBadge>
                <UiBadge variant="muted">{{ cashRegisterLabel }}</UiBadge>
              </div>
              <p class="mt-2 text-sm text-muted-foreground">
                Selecciona una caja de la sucursal. El POS recupera la sesion abierta actual desde Rails.
              </p>
              <div v-if="pos.activeSession" class="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <span>Fondo: {{ money(pos.activeSession.openingAmount) }}</span>
                <span>Esperado: {{ money(pos.activeSession.expectedAmount ?? pos.activeSession.openingAmount) }}</span>
                <span>{{ dateTime(pos.activeSession.openedAt) }}</span>
              </div>
            </div>

            <form v-if="!pos.activeSession" class="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_130px_auto]" @submit.prevent="openCashSession">
              <select
                v-if="pos.availableCashRegisters.length"
                :value="pos.cashRegisterId"
                class="h-10 rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Caja"
                @change="selectCashRegister"
              >
                <option value="">Seleccionar caja</option>
                <option v-for="register in pos.availableCashRegisters" :key="register.id" :value="register.id">
                  {{ register.code }} - {{ register.name }} ({{ register.status }})
                </option>
              </select>
              <UiInput v-else v-model="pos.cashRegisterId" type="number" aria-label="ID de caja" placeholder="Caja ID" />
              <UiInput v-model="openingAmount" type="number" aria-label="Fondo inicial" placeholder="Fondo" />
              <UiButton type="submit" :disabled="pos.saving || !pos.cashRegisterId">
                <Banknote class="size-4" aria-hidden="true" />
                Abrir caja
              </UiButton>
            </form>

            <form v-else class="grid gap-2 sm:grid-cols-[130px_auto]" @submit.prevent="closeCashSession">
              <UiInput v-model="closingAmount" type="number" aria-label="Monto de cierre" placeholder="Cierre real" />
              <UiButton type="submit" variant="outline" :disabled="pos.saving">
                <XCircle class="size-4" aria-hidden="true" />
                Cerrar caja
              </UiButton>
            </form>
          </div>
          <div v-if="pos.activeSession?.paymentSummary.length" class="mt-4 grid gap-2 border-t pt-4 sm:grid-cols-3">
            <div v-for="payment in pos.activeSession.paymentSummary" :key="payment.method" class="rounded-md bg-muted/35 px-3 py-2 text-sm">
              <p class="font-medium">{{ payment.method }}</p>
              <p class="text-muted-foreground">{{ money(payment.amount) }} · {{ numberValue(payment.paymentsCount) }} pagos</p>
            </div>
          </div>
        </UiCard>

        <UiCard class="p-4">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 class="text-base font-semibold">Productos</h2>
              <p class="text-sm text-muted-foreground">Busca por nombre, SKU o codigo de barras.</p>
            </div>
            <div class="relative w-full md:max-w-sm">
              <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <UiInput v-model="search" class="pl-9" placeholder="Buscar producto" />
            </div>
          </div>

          <div v-if="pos.loading" class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div v-for="item in 6" :key="item" class="h-28 animate-pulse rounded-md bg-muted" />
          </div>

          <div v-else-if="filteredProducts.length" class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <button
              v-for="product in filteredProducts"
              :key="product.id"
              type="button"
              class="min-h-28 rounded-md border bg-background p-3 text-left transition-colors hover:border-primary/45 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              @click="addProduct(product)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="line-clamp-2 text-sm font-semibold">{{ product.name }}</p>
                  <p class="mt-1 truncate text-xs text-muted-foreground">{{ product.sku || product.barcode || 'Sin codigo' }}</p>
                </div>
                <Barcode class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </div>
              <div class="mt-4 flex items-end justify-between gap-2">
                <span class="text-lg font-semibold">{{ money(product.price) }}</span>
                <UiBadge :variant="product.trackInventory ? 'default' : 'muted'">
                  {{ product.trackInventory ? 'Inventario' : 'Servicio' }}
                </UiBadge>
              </div>
            </button>
          </div>

          <div v-else class="mt-4 rounded-md border border-dashed bg-muted/35 px-4 py-10 text-center">
            <PackageSearch class="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
            <p class="mt-3 font-medium">No hay productos para vender</p>
            <p class="mt-1 text-sm text-muted-foreground">Agrega productos activos en catalogos para habilitar la venta rapida.</p>
          </div>
        </UiCard>

        <UiCard class="p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-semibold">Carrito</h2>
              <p class="text-sm text-muted-foreground">{{ pos.cart.length }} linea{{ pos.cart.length === 1 ? '' : 's' }} en venta.</p>
            </div>
            <UiButton variant="ghost" size="sm" :disabled="!pos.cart.length" @click="pos.clearCart">
              <Trash2 class="size-4" aria-hidden="true" />
              Limpiar
            </UiButton>
          </div>

          <div class="mt-4 overflow-x-auto">
            <table class="w-full min-w-[720px] text-sm">
              <thead class="text-left text-xs text-muted-foreground">
                <tr class="border-b">
                  <th class="pb-2 font-medium">Producto</th>
                  <th class="pb-2 font-medium">Cantidad</th>
                  <th class="pb-2 font-medium">Precio</th>
                  <th class="pb-2 font-medium">Descuento</th>
                  <th class="pb-2 text-right font-medium">Total</th>
                  <th class="pb-2" />
                </tr>
              </thead>
              <tbody>
                <tr v-if="!pos.cart.length">
                  <td colspan="6" class="py-8 text-center text-muted-foreground">Selecciona productos para iniciar la venta.</td>
                </tr>
                <tr v-for="item in pos.cart" :key="item.productId" class="border-b last:border-0">
                  <td class="py-3">
                    <p class="font-medium">{{ item.name }}</p>
                    <p class="text-xs text-muted-foreground">{{ item.sku || 'Sin SKU' }}</p>
                  </td>
                  <td class="py-3">
                    <div class="flex items-center gap-1">
                      <UiButton size="icon" variant="outline" class="size-8" @click="pos.updateQuantity(item.productId, item.quantity - 1)">
                        <Minus class="size-3" aria-hidden="true" />
                      </UiButton>
                      <UiInput
                        :model-value="item.quantity"
                        type="number"
                        class="h-8 w-20 text-center"
                        aria-label="Cantidad"
                        @update:model-value="pos.updateQuantity(item.productId, $event)"
                      />
                      <UiButton size="icon" variant="outline" class="size-8" @click="pos.updateQuantity(item.productId, item.quantity + 1)">
                        <Plus class="size-3" aria-hidden="true" />
                      </UiButton>
                    </div>
                  </td>
                  <td class="py-3">{{ money(item.unitPrice) }}</td>
                  <td class="py-3">
                    <UiInput
                      :model-value="item.discount"
                      type="number"
                      class="h-8 w-24"
                      aria-label="Descuento"
                      @update:model-value="pos.updateDiscount(item.productId, $event)"
                    />
                  </td>
                  <td class="py-3 text-right font-medium">
                    {{ money(Math.max(0, (item.unitPrice * item.quantity) - item.discount)) }}
                  </td>
                  <td class="py-3 text-right">
                    <UiButton size="icon" variant="ghost" class="size-8 text-destructive" @click="pos.removeProduct(item.productId)">
                      <Trash2 class="size-4" aria-hidden="true" />
                    </UiButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UiCard>
      </div>

      <aside class="space-y-4">
        <UiCard class="p-4">
          <div class="flex items-center gap-2">
            <UserRound class="size-4 text-muted-foreground" aria-hidden="true" />
            <h2 class="text-base font-semibold">Cliente fiscal</h2>
          </div>

          <div class="mt-4 grid gap-3">
            <select
              v-model="pos.fiscalCustomer.customerId"
              class="h-10 rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Cliente"
            >
              <option value="">Cliente final</option>
              <option v-for="customer in pos.customers" :key="customer.id" :value="customer.id">
                {{ customer.name }}
              </option>
            </select>

            <div class="grid grid-cols-2 gap-2">
              <select
                v-model="pos.fiscalCustomer.docType"
                class="h-10 rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Tipo de documento fiscal"
              >
                <option value="ticket">Ticket</option>
                <option value="invoice">Factura</option>
                <option value="ccf">Credito fiscal</option>
              </select>
              <select
                v-model="pos.fiscalCustomer.documentType"
                class="h-10 rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Tipo de identificacion"
              >
                <option value="dui">DUI</option>
                <option value="nit">NIT</option>
                <option value="passport">Pasaporte</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <UiInput v-model="pos.fiscalCustomer.customerName" placeholder="Nombre fiscal" />
            <div class="grid grid-cols-2 gap-2">
              <UiInput v-model="pos.fiscalCustomer.documentNumber" placeholder="Documento" />
              <UiInput v-model="pos.fiscalCustomer.nit" placeholder="NIT" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <UiInput v-model="pos.fiscalCustomer.nrc" placeholder="NRC" />
              <UiInput v-model="pos.fiscalCustomer.email" type="email" placeholder="Correo" />
            </div>
          </div>
        </UiCard>

        <UiCard class="p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <CreditCard class="size-4 text-muted-foreground" aria-hidden="true" />
              <h2 class="text-base font-semibold">Pagos mixtos</h2>
            </div>
            <UiButton size="sm" variant="outline" @click="pos.addPaymentRow">
              <Plus class="size-4" aria-hidden="true" />
              Pago
            </UiButton>
          </div>

          <div class="mt-4 space-y-3">
            <div v-for="payment in pos.payments" :key="payment.id" class="rounded-md border bg-background p-3">
              <div class="grid gap-2">
                <select
                  v-model="payment.paymentMethodId"
                  class="h-10 rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Metodo de pago"
                  @change="pos.updatePaymentMethod(payment)"
                >
                  <option value="">Metodo</option>
                  <option v-for="method in pos.paymentMethods" :key="method.id" :value="method.id">
                    {{ method.name }}
                  </option>
                </select>
                <div class="grid grid-cols-[1fr_auto] gap-2">
                  <UiInput v-model="payment.amount" type="number" placeholder="Monto" />
                  <UiButton variant="outline" size="sm" @click="pos.coverBalance(payment)">
                    Cubrir
                  </UiButton>
                </div>
                <div class="grid grid-cols-[1fr_auto] gap-2">
                  <UiInput v-model="payment.reference" placeholder="Referencia" />
                  <UiButton variant="ghost" size="icon" class="text-destructive" @click="pos.removePaymentRow(payment.id)">
                    <Trash2 class="size-4" aria-hidden="true" />
                  </UiButton>
                </div>
              </div>
            </div>
          </div>
        </UiCard>

        <UiCard class="p-4">
          <div class="space-y-2 text-sm">
            <div class="flex justify-between gap-3">
              <span class="text-muted-foreground">Subtotal</span>
              <span>{{ money(pos.subtotal) }}</span>
            </div>
            <div class="flex justify-between gap-3">
              <span class="text-muted-foreground">Impuestos</span>
              <span>{{ money(pos.tax) }}</span>
            </div>
            <div class="flex justify-between gap-3 border-t pt-3 text-base font-semibold">
              <span>Total</span>
              <span>{{ money(pos.total) }}</span>
            </div>
            <div class="flex justify-between gap-3">
              <span class="text-muted-foreground">Pagado</span>
              <span>{{ money(pos.paidTotal) }}</span>
            </div>
            <div class="flex justify-between gap-3">
              <span class="text-muted-foreground">Saldo</span>
              <span :class="pos.balance > 0 ? 'text-warning' : 'text-success'">{{ money(pos.balance) }}</span>
            </div>
            <div class="flex justify-between gap-3">
              <span class="text-muted-foreground">Cambio</span>
              <span>{{ money(pos.change) }}</span>
            </div>
          </div>

          <div class="mt-4 rounded-md bg-muted/45 px-3 py-2 text-xs text-muted-foreground">
            <ShieldCheck class="mr-1 inline size-3.5" aria-hidden="true" />
            Clave anti duplicado: {{ idempotencyLabel }}
          </div>

          <UiButton class="mt-4 w-full" size="lg" :disabled="!pos.canCheckout || pos.saving" @click="checkout">
            <CircleDollarSign class="size-4" aria-hidden="true" />
            Cobrar venta
          </UiButton>
        </UiCard>
      </aside>
    </div>

    <UiCard class="p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-base font-semibold">Ventas recientes</h2>
          <p class="text-sm text-muted-foreground">Anulaciones con motivo y reversion de stock desde Rails.</p>
        </div>
        <UiButton variant="outline" size="sm" :disabled="pos.loading" @click="pos.refreshSales">
          <RefreshCw class="size-4" aria-hidden="true" />
          Actualizar
        </UiButton>
      </div>

      <div class="mt-4 overflow-x-auto">
        <table class="w-full min-w-[760px] text-sm">
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
              <td colspan="7" class="py-8 text-center text-muted-foreground">Sin ventas recientes.</td>
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
                    v-if="sale.status === 'paid'"
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
