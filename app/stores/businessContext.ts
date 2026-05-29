import { acceptHMRUpdate, defineStore } from 'pinia'
import type { BranchOption, WarehouseOption } from '~/types/business'
import { normalizeBranch, normalizeWarehouse, unwrapCollection } from '~/types/business'

export const useBusinessContextStore = defineStore('business-context', () => {
  const api = useApi()
  const auth = useAuthStore()
  const selectedBranchCookie = useCookie<string | null>('neo_branch_id', {
    maxAge: 60 * 60 * 24 * 90,
    path: '/',
    sameSite: 'strict',
    watch: true,
  })
  const selectedWarehouseCookie = useCookie<string | null>('neo_warehouse_id', {
    maxAge: 60 * 60 * 24 * 90,
    path: '/',
    sameSite: 'strict',
    watch: true,
  })

  const branches = ref<BranchOption[]>([])
  const warehouses = ref<WarehouseOption[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')

  const selectedBranchId = computed({
    get: () => selectedBranchCookie.value ? Number(selectedBranchCookie.value) : null,
    set: (value) => {
      selectedBranchCookie.value = value ? String(value) : null
    },
  })

  const selectedWarehouseId = computed({
    get: () => selectedWarehouseCookie.value ? Number(selectedWarehouseCookie.value) : null,
    set: (value) => {
      selectedWarehouseCookie.value = value ? String(value) : null
    },
  })

  const selectedBranch = computed(() => branches.value.find((branch) => branch.id === selectedBranchId.value) ?? null)
  const filteredWarehouses = computed(() => {
    if (!selectedBranchId.value) return warehouses.value

    return warehouses.value.filter((warehouse) => !warehouse.branch_id || warehouse.branch_id === selectedBranchId.value)
  })
  const selectedWarehouse = computed(() => filteredWarehouses.value.find((warehouse) => warehouse.id === selectedWarehouseId.value) ?? null)
  const hasBranchSelector = computed(() => branches.value.length > 1)
  const hasWarehouseSelector = computed(() => filteredWarehouses.value.length > 1)

  function ensureSelection() {
    const userBranchId = auth.user?.branch?.id
    const branchExists = branches.value.some((branch) => branch.id === selectedBranchId.value)

    if (!branchExists) {
      selectedBranchId.value = userBranchId && branches.value.some((branch) => branch.id === userBranchId)
        ? userBranchId
        : branches.value.find((branch) => branch.is_main)?.id ?? branches.value[0]?.id ?? null
    }

    const warehouseExists = filteredWarehouses.value.some((warehouse) => warehouse.id === selectedWarehouseId.value)

    if (!warehouseExists) {
      selectedWarehouseId.value = filteredWarehouses.value[0]?.id ?? null
    }
  }

  function setBranch(id: number | null) {
    selectedBranchId.value = id
    selectedWarehouseId.value = null
    ensureSelection()
  }

  function setWarehouse(id: number | null) {
    selectedWarehouseId.value = id
  }

  async function loadContext() {
    if (!auth.isAuthenticated) return

    loading.value = true
    error.value = ''

    try {
      const [branchesResponse, warehousesResponse] = await Promise.all([
        auth.can('branches.read')
          ? api.get('/branches')
          : Promise.resolve({ branches: auth.user?.branch ? [auth.user.branch] : [] }),
        auth.can('warehouses.read')
          ? api.get('/warehouses')
          : Promise.resolve({ warehouses: [] }),
      ])

      branches.value = unwrapCollection<unknown>(branchesResponse, 'branches')
        .map(normalizeBranch)
        .filter((branch): branch is BranchOption => Boolean(branch))
      warehouses.value = unwrapCollection<unknown>(warehousesResponse, 'warehouses')
        .map(normalizeWarehouse)
        .filter((warehouse): warehouse is WarehouseOption => Boolean(warehouse))

      ensureSelection()
      loaded.value = true
    }
    catch {
      error.value = 'No pudimos cargar sucursales y bodegas.'
    }
    finally {
      loading.value = false
    }
  }

  function reset() {
    branches.value = []
    warehouses.value = []
    selectedBranchId.value = null
    selectedWarehouseId.value = null
    loaded.value = false
    error.value = ''
  }

  return {
    branches,
    warehouses,
    loading,
    loaded,
    error,
    selectedBranchId,
    selectedWarehouseId,
    selectedBranch,
    selectedWarehouse,
    filteredWarehouses,
    hasBranchSelector,
    hasWarehouseSelector,
    loadContext,
    setBranch,
    setWarehouse,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBusinessContextStore, import.meta.hot))
}
