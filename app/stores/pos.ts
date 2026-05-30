import { acceptHMRUpdate, defineStore } from 'pinia'
import { isRecord } from '~/types/business'
import type { CashRegister, CashSession, PaymentMethodOption, PosCustomer, PosProduct, SaleSummary } from '~/types/pos'
import {
  normalizeCashSession,
  normalizeSaleSummary,
  unwrapCashRegisters,
  unwrapCustomers,
  unwrapPaymentMethods,
  unwrapProducts,
  unwrapSales,
} from '~/types/pos'

type CartItem = {
  productId: number
  name: string
  sku?: string
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
}

type PaymentDraft = {
  id: string
  paymentMethodId: number | ''
  method: string
  amount: string
  reference: string
}

export type FiscalCustomerDraft = {
  docType: 'ticket' | 'invoice' | 'ccf'
  customerId: number | ''
  customerName: string
  documentType: string
  documentNumber: string
  nit: string
  nrc: string
  email: string
}

export type SaleFilters = {
  status?: string
  from?: string
  to?: string
  sale_number?: string
  customer_id?: number | string
  cash_session_id?: number | string
  branch_id?: number | string
  cashier_id?: number | string
  limit?: number
}

const sessionStorageKey = 'neo_pos_cash_session'
const registerStorageKey = 'neo_pos_cash_register_id'

function moneyNumber(value: string | number) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function makeDraftId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function idempotencyKey() {
  return `pos-${makeDraftId()}`
}

function methodCode(methods: PaymentMethodOption[], id: number | '') {
  return methods.find((method) => method.id === Number(id))?.code ?? ''
}

function unwrapRecord(payload: unknown, key: string) {
  return isRecord(payload) && isRecord(payload[key]) ? payload[key] : payload
}

export const usePosStore = defineStore('pos', () => {
  const api = useApi()
  const context = useBusinessContextStore()
  const auth = useAuthStore()

  const products = ref<PosProduct[]>([])
  const customers = ref<PosCustomer[]>([])
  const paymentMethods = ref<PaymentMethodOption[]>([])
  const cashRegisters = ref<CashRegister[]>([])
  const sales = ref<SaleSummary[]>([])
  const activeSession = ref<CashSession | null>(null)
  const cashRegisterId = ref<number | ''>(1)
  const cart = ref<CartItem[]>([])
  const payments = ref<PaymentDraft[]>([])
  const fiscalCustomer = reactive<FiscalCustomerDraft>({
    docType: 'ticket',
    customerId: '',
    customerName: 'Cliente final',
    documentType: 'dui',
    documentNumber: '',
    nit: '',
    nrc: '',
    email: '',
  })
  const currentIdempotencyKey = ref(idempotencyKey())
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const success = ref('')

  const subtotal = computed(() => roundMoney(cart.value.reduce((sum, item) => {
    return sum + Math.max(0, (item.unitPrice * item.quantity) - item.discount)
  }, 0)))

  const tax = computed(() => roundMoney(cart.value.reduce((sum, item) => {
    const lineBase = Math.max(0, (item.unitPrice * item.quantity) - item.discount)
    return sum + (lineBase * item.taxRate)
  }, 0)))

  const total = computed(() => roundMoney(subtotal.value + tax.value))
  const paidTotal = computed(() => roundMoney(payments.value.reduce((sum, payment) => sum + moneyNumber(payment.amount), 0)))
  const positivePayments = computed(() => payments.value.filter((payment) => moneyNumber(payment.amount) > 0))
  const hasValidPayments = computed(() => {
    return positivePayments.value.length > 0 && positivePayments.value.every((payment) => {
      return Boolean(payment.paymentMethodId) && Boolean(methodCode(paymentMethods.value, payment.paymentMethodId))
    })
  })
  const balance = computed(() => roundMoney(Math.max(0, total.value - paidTotal.value)))
  const change = computed(() => roundMoney(Math.max(0, paidTotal.value - total.value)))
  const canCheckout = computed(() => {
    return Boolean(activeSession.value?.id)
      && cart.value.length > 0
      && total.value > 0
      && hasValidPayments.value
      && paidTotal.value >= total.value
  })
  const selectedCashRegister = computed(() => {
    return cashRegisters.value.find((register) => register.id === Number(cashRegisterId.value)) ?? null
  })
  const availableCashRegisters = computed(() => {
    return cashRegisters.value.filter((register) => {
      return register.status === 'available'
        || register.status === 'in_use'
        || register.currentCashSessionId
        || register.id === Number(cashRegisterId.value)
    })
  })

  function persistSession() {
    if (!import.meta.client) return
    if (activeSession.value) {
      localStorage.setItem(sessionStorageKey, JSON.stringify(activeSession.value))
    }
    else {
      localStorage.removeItem(sessionStorageKey)
    }

    if (cashRegisterId.value) {
      localStorage.setItem(registerStorageKey, String(cashRegisterId.value))
    }
  }

  function restoreSession() {
    if (!import.meta.client) return
    const storedRegister = Number(localStorage.getItem(registerStorageKey))
    if (storedRegister) cashRegisterId.value = storedRegister

    const storedSession = localStorage.getItem(sessionStorageKey)
    if (!storedSession) return

    try {
      const parsed = JSON.parse(storedSession)
      const normalized = normalizeCashSession(parsed)
      if (normalized?.status === 'open') activeSession.value = normalized
    }
    catch {
      localStorage.removeItem(sessionStorageKey)
    }
  }

  function ensureCashRegisterSelection() {
    const exists = cashRegisters.value.some((register) => register.id === Number(cashRegisterId.value))
    if (!exists) {
      const preferred = cashRegisters.value.find((register) => register.status === 'available')
        ?? cashRegisters.value.find((register) => register.status === 'in_use')
        ?? cashRegisters.value[0]
      cashRegisterId.value = preferred?.id ?? ''
    }
    persistSession()
  }

  function clearMessages() {
    error.value = ''
    success.value = ''
  }

  async function loadReferenceData() {
    loading.value = true
    clearMessages()

    try {
      if (!context.loaded) await context.loadContext()

      const registerQuery: Record<string, string | number> = { limit: 100 }
      if (context.selectedBranchId) registerQuery.branch_id = context.selectedBranchId

      const [productsResponse, customersResponse, paymentMethodsResponse, cashRegistersResponse, salesResponse] = await Promise.all([
        api.get<unknown>('/products', { query: { limit: 300, active: true } }),
        api.get<unknown>('/customers', { query: { limit: 300, active: true } }),
        api.get<unknown>('/payment_methods', { query: { limit: 100, active: true } }),
        auth.can('cash_registers.read') ? api.get<unknown>('/cash_registers', { query: registerQuery }) : Promise.resolve({ cash_registers: [] }),
        api.get<unknown>('/sales', { query: { limit: 20 } }),
      ])

      products.value = unwrapProducts(productsResponse).filter((product) => product.active)
      customers.value = unwrapCustomers(customersResponse)
      paymentMethods.value = unwrapPaymentMethods(paymentMethodsResponse).filter((method) => method.active)
      cashRegisters.value = unwrapCashRegisters(cashRegistersResponse)
      sales.value = unwrapSales(salesResponse)

      if (cashRegisters.value.length > 0) ensureCashRegisterSelection()
      await loadCurrentCashSession()
      ensurePaymentRows()
    }
    catch (loadError) {
      error.value = loadError instanceof Error ? loadError.message : 'No pudimos cargar datos del POS.'
    }
    finally {
      loading.value = false
    }
  }

  async function refreshSales(filters: SaleFilters = {}) {
    const query: Record<string, string | number> = { limit: filters.limit ?? 20 }
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query[key] = value
    })

    const response = await api.get<unknown>('/sales', { query })
    sales.value = unwrapSales(response)
  }

  async function loadCurrentCashSession() {
    if (!cashRegisterId.value) {
      activeSession.value = null
      persistSession()
      return null
    }

    const response = await api.get<unknown>('/cash_sessions/current', {
      query: { cash_register_id: Number(cashRegisterId.value) },
    })
    const normalized = normalizeCashSession(unwrapRecord(response, 'cash_session'))

    activeSession.value = normalized?.status === 'open' ? normalized : null
    persistSession()

    return activeSession.value
  }

  async function selectCashRegister(registerId: number | '') {
    cashRegisterId.value = registerId
    activeSession.value = null
    persistSession()
    if (registerId) await loadCurrentCashSession()
  }

  async function openCashSession(openingAmount: string | number) {
    saving.value = true
    clearMessages()

    try {
      const response = await api.post<unknown>('/cash_sessions/open', {
        cash_session: {
          cash_register_id: Number(cashRegisterId.value),
          opening_amount: moneyNumber(openingAmount).toFixed(2),
        },
      })
      const normalized = normalizeCashSession(unwrapRecord(response, 'cash_session'))
      if (!normalized) throw new Error('Rails no devolvio una sesion de caja valida.')

      activeSession.value = normalized
      cashRegisterId.value = normalized.cashRegisterId
      persistSession()
      await loadCashRegisters()
      success.value = 'Caja abierta correctamente.'
    }
    catch (openError) {
      error.value = openError instanceof Error ? openError.message : 'No pudimos abrir la caja.'
      throw openError
    }
    finally {
      saving.value = false
    }
  }

  async function closeCashSession(closingAmount: string | number) {
    if (!activeSession.value) return
    saving.value = true
    clearMessages()

    try {
      const response = await api.post<unknown>(`/cash_sessions/${activeSession.value.id}/close`, {
        cash_session: {
          closing_amount: moneyNumber(closingAmount).toFixed(2),
        },
      })
      const normalized = normalizeCashSession(unwrapRecord(response, 'cash_session'))
      activeSession.value = normalized
      persistSession()
      activeSession.value = null
      persistSession()
      await loadCashRegisters()
      success.value = 'Caja cerrada correctamente.'
    }
    catch (closeError) {
      error.value = closeError instanceof Error ? closeError.message : 'No pudimos cerrar la caja.'
      throw closeError
    }
    finally {
      saving.value = false
    }
  }

  function addProduct(product: PosProduct) {
    clearMessages()
    const existing = cart.value.find((item) => item.productId === product.id)
    if (existing) {
      existing.quantity += 1
    }
    else {
      cart.value.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        taxRate: product.taxRate,
      })
    }
    syncSinglePaymentToBalance()
  }

  function updateQuantity(productId: number, quantity: string | number) {
    const item = cart.value.find((line) => line.productId === productId)
    if (!item) return
    item.quantity = Math.max(1, moneyNumber(quantity))
    syncSinglePaymentToBalance()
  }

  function updateDiscount(productId: number, discount: string | number) {
    const item = cart.value.find((line) => line.productId === productId)
    if (!item) return
    item.discount = Math.max(0, moneyNumber(discount))
    syncSinglePaymentToBalance()
  }

  function removeProduct(productId: number) {
    cart.value = cart.value.filter((item) => item.productId !== productId)
    syncSinglePaymentToBalance()
  }

  function clearCart() {
    cart.value = []
    payments.value = []
    currentIdempotencyKey.value = idempotencyKey()
    resetFiscalCustomer()
    ensurePaymentRows()
  }

  function resetFiscalCustomer() {
    fiscalCustomer.docType = 'ticket'
    fiscalCustomer.customerId = ''
    fiscalCustomer.customerName = 'Cliente final'
    fiscalCustomer.documentType = 'dui'
    fiscalCustomer.documentNumber = ''
    fiscalCustomer.nit = ''
    fiscalCustomer.nrc = ''
    fiscalCustomer.email = ''
  }

  function applyCustomer(customerId: number | '') {
    fiscalCustomer.customerId = customerId
    const customer = customers.value.find((item) => item.id === Number(customerId))

    if (!customer) {
      fiscalCustomer.customerName = 'Cliente final'
      fiscalCustomer.documentNumber = ''
      fiscalCustomer.nit = ''
      fiscalCustomer.nrc = ''
      fiscalCustomer.email = ''
      return
    }

    fiscalCustomer.customerName = customer.name
    fiscalCustomer.documentType = customer.documentType ?? 'dui'
    fiscalCustomer.documentNumber = customer.documentNumber ?? ''
    fiscalCustomer.nit = customer.nit ?? ''
    fiscalCustomer.nrc = customer.nrc ?? ''
    fiscalCustomer.email = customer.email ?? ''
  }

  function ensurePaymentRows() {
    if (payments.value.length > 0 || paymentMethods.value.length === 0) return
    const cashMethod = paymentMethods.value.find((method) => method.code.toUpperCase() === 'EFECTIVO') ?? paymentMethods.value[0]
    payments.value.push({
      id: makeDraftId(),
      paymentMethodId: cashMethod.id,
      method: cashMethod.code,
      amount: total.value > 0 ? total.value.toFixed(2) : '',
      reference: '',
    })
  }

  function addPaymentRow() {
    const firstMethod = paymentMethods.value[0]
    payments.value.push({
      id: makeDraftId(),
      paymentMethodId: firstMethod?.id ?? '',
      method: firstMethod?.code ?? '',
      amount: balance.value > 0 ? balance.value.toFixed(2) : '',
      reference: '',
    })
  }

  function removePaymentRow(id: string) {
    payments.value = payments.value.filter((payment) => payment.id !== id)
    ensurePaymentRows()
  }

  function updatePaymentMethod(payment: PaymentDraft) {
    payment.method = methodCode(paymentMethods.value, payment.paymentMethodId)
  }

  function coverBalance(payment: PaymentDraft) {
    const othersPaid = payments.value
      .filter((item) => item.id !== payment.id)
      .reduce((sum, item) => sum + moneyNumber(item.amount), 0)
    payment.amount = Math.max(0, roundMoney(total.value - othersPaid)).toFixed(2)
  }

  function syncSinglePaymentToBalance() {
    if (payments.value.length === 1) {
      payments.value[0].amount = total.value > 0 ? total.value.toFixed(2) : ''
    }
  }

  async function checkout() {
    if (!activeSession.value) throw new Error('Abre caja antes de vender.')
    if (!canCheckout.value) throw new Error('Completa productos y pagos antes de cobrar.')

    saving.value = true
    clearMessages()

    try {
      if (!hasValidPayments.value) throw new Error('Selecciona un metodo valido para cada pago.')

      const payload = {
        sale: {
          branch_id: context.selectedBranchId,
          warehouse_id: context.selectedWarehouseId,
          customer_id: fiscalCustomer.customerId || undefined,
          cash_session_id: activeSession.value.id,
          discount: '0.00',
          idempotency_key: currentIdempotencyKey.value,
          items: cart.value.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity.toString(),
            unit_price: item.unitPrice.toFixed(2),
            discount: item.discount.toFixed(2),
          })),
          payments: positivePayments.value
            .map((payment) => ({
              payment_method_id: Number(payment.paymentMethodId),
              method: payment.method,
              amount: moneyNumber(payment.amount).toFixed(2),
              reference: payment.reference || undefined,
            })),
          invoice: {
            doc_type: fiscalCustomer.docType,
            customer_name: fiscalCustomer.customerName || 'Cliente final',
            customer_document_type: fiscalCustomer.documentType,
            customer_document_number: fiscalCustomer.documentNumber || undefined,
            customer_nit: fiscalCustomer.nit || undefined,
            customer_nrc: fiscalCustomer.nrc || undefined,
            customer_email: fiscalCustomer.email || undefined,
          },
        },
      }

      const response = await api.post<unknown>('/sales', payload)
      const sale = normalizeSaleSummary(unwrapRecord(response, 'sale'))
      success.value = sale ? `Venta ${sale.saleNumber} registrada.` : 'Venta registrada correctamente.'
      clearCart()
      await refreshSales()
    }
    catch (checkoutError) {
      error.value = checkoutError instanceof Error ? checkoutError.message : 'No pudimos registrar la venta.'
      throw checkoutError
    }
    finally {
      saving.value = false
    }
  }

  async function voidSale(saleId: number, reason: string) {
    if (!reason.trim()) throw new Error('Escribe un motivo para anular la venta.')

    saving.value = true
    clearMessages()

    try {
      await api.post(`/sales/${saleId}/void`, {
        sale: {
          reason: reason.trim(),
        },
      })
      success.value = 'Venta anulada correctamente.'
      await refreshSales()
    }
    catch (voidError) {
      error.value = voidError instanceof Error ? voidError.message : 'No pudimos anular la venta.'
      throw voidError
    }
    finally {
      saving.value = false
    }
  }

  async function loadCashRegisters() {
    if (!auth.can('cash_registers.read')) return
    const query: Record<string, string | number> = { limit: 100 }
    if (context.selectedBranchId) query.branch_id = context.selectedBranchId
    const response = await api.get<unknown>('/cash_registers', { query })
    cashRegisters.value = unwrapCashRegisters(response)
    ensureCashRegisterSelection()
  }

  return {
    products,
    customers,
    paymentMethods,
    cashRegisters,
    sales,
    activeSession,
    cashRegisterId,
    cart,
    payments,
    fiscalCustomer,
    currentIdempotencyKey,
    loading,
    saving,
    error,
    success,
    subtotal,
    tax,
    total,
    paidTotal,
    balance,
    change,
    canCheckout,
    selectedCashRegister,
    availableCashRegisters,
    restoreSession,
    loadReferenceData,
    refreshSales,
    loadCashRegisters,
    loadCurrentCashSession,
    selectCashRegister,
    openCashSession,
    closeCashSession,
    addProduct,
    updateQuantity,
    updateDiscount,
    removeProduct,
    clearCart,
    applyCustomer,
    addPaymentRow,
    removePaymentRow,
    updatePaymentMethod,
    coverBalance,
    checkout,
    voidSale,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePosStore, import.meta.hot))
}
