<script setup lang="ts">
import { Search, User, Package, ReceiptText, Truck, Loader2 } from '@lucide/vue'
import type { SearchResultType } from '~/types/business'

const search = useGlobalSearchStore()

const iconByType = {
  product: Package,
  customer: User,
  supplier: Truck,
  sale: ReceiptText,
}

const labelByType: Record<SearchResultType, string> = {
  product: 'Producto',
  customer: 'Cliente',
  supplier: 'Proveedor',
  sale: 'Venta',
}

watchDebounced(
  () => search.query,
  () => {
    void search.search()
  },
  { debounce: 300, maxWait: 900 },
)

function openResults() {
  if (search.hasQuery) {
    search.opened = true
  }
}
</script>

<template>
  <div class="relative w-full max-w-xl">
    <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
    <UiInput
      v-model="search.query"
      class="pl-9 pr-9"
      placeholder="Buscar productos, clientes o documentos"
      @focus="openResults"
      @keydown.esc="search.opened = false"
    />
    <Loader2
      v-if="search.loading"
      class="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
      aria-hidden="true"
    />

    <div
      v-if="search.opened && search.hasQuery"
      class="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg"
    >
      <div v-if="search.results.length > 0" class="max-h-96 overflow-y-auto p-2">
        <NuxtLink
          v-for="result in search.results"
          :key="`${result.type}-${result.id}`"
          :to="result.href"
          class="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
          @click="search.clear"
        >
          <div class="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <component :is="iconByType[result.type]" class="size-4" aria-hidden="true" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium">{{ result.title }}</p>
            <p class="truncate text-xs text-muted-foreground">{{ result.subtitle }}</p>
          </div>
          <UiBadge variant="muted">{{ labelByType[result.type] }}</UiBadge>
        </NuxtLink>
      </div>

      <div v-else class="p-4 text-sm text-muted-foreground">
        {{ search.loading ? 'Buscando...' : 'No encontramos resultados para esa busqueda.' }}
      </div>

      <p v-if="search.error" class="border-t px-4 py-2 text-xs text-warning">
        {{ search.error }}
      </p>
    </div>
  </div>
</template>
