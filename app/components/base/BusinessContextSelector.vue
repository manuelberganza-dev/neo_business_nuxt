<script setup lang="ts">
import { Building2, Warehouse } from '@lucide/vue'

const context = useBusinessContextStore()

onMounted(() => {
  if (!context.loaded) {
    void context.loadContext()
  }
})

function readNumber(event: Event) {
  const value = (event.target as HTMLSelectElement).value

  return value ? Number(value) : null
}
</script>

<template>
  <div class="hidden min-w-0 items-center gap-2 xl:flex">
    <div class="flex min-w-44 items-center gap-2 rounded-md border bg-background px-3 py-2">
      <Building2 class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <label class="min-w-0 flex-1">
        <span class="sr-only">Sucursal</span>
        <select
          v-if="context.hasBranchSelector"
          class="w-full bg-transparent text-sm font-medium outline-none"
          :value="context.selectedBranchId ?? ''"
          @change="context.setBranch(readNumber($event))"
        >
          <option v-for="branch in context.branches" :key="branch.id" :value="branch.id">
            {{ branch.name }}
          </option>
        </select>
        <span v-else class="block truncate text-sm font-medium">
          {{ context.selectedBranch?.name ?? 'Sin sucursal' }}
        </span>
      </label>
    </div>

    <div class="flex min-w-44 items-center gap-2 rounded-md border bg-background px-3 py-2">
      <Warehouse class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <label class="min-w-0 flex-1">
        <span class="sr-only">Bodega</span>
        <select
          v-if="context.hasWarehouseSelector"
          class="w-full bg-transparent text-sm font-medium outline-none"
          :value="context.selectedWarehouseId ?? ''"
          @change="context.setWarehouse(readNumber($event))"
        >
          <option v-for="warehouse in context.filteredWarehouses" :key="warehouse.id" :value="warehouse.id">
            {{ warehouse.name }}
          </option>
        </select>
        <span v-else class="block truncate text-sm font-medium">
          {{ context.selectedWarehouse?.name ?? 'Sin bodega' }}
        </span>
      </label>
    </div>
  </div>
</template>
