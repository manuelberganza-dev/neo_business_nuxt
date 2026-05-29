<script setup lang="ts">
import { LogOut, Menu, PanelLeftClose, Store } from '@lucide/vue'

const auth = useAuthStore()
const context = useBusinessContextStore()
const mobileMenuOpen = ref(false)
const route = useRoute()

onMounted(() => {
  if (!context.loaded) {
    void context.loadContext()
  }
})

watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false
})

async function handleLogout() {
  await auth.logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <div v-if="mobileMenuOpen" class="fixed inset-0 z-40 bg-black/45 lg:hidden" @click="mobileMenuOpen = false" />

    <aside
      v-if="mobileMenuOpen"
      class="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100vw-2rem))] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground lg:hidden"
    >
      <div class="flex items-center justify-between gap-3 px-2">
        <div class="flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
            <Store class="size-5" aria-hidden="true" />
          </div>
          <div>
            <p class="text-lg font-semibold leading-5">Neo Business</p>
            <p class="text-xs text-sidebar-muted">POS e inventario</p>
          </div>
        </div>
        <UiButton variant="ghost" size="icon" class="text-sidebar-foreground hover:bg-white/10" aria-label="Cerrar menu" @click="mobileMenuOpen = false">
          <PanelLeftClose class="size-5" aria-hidden="true" />
        </UiButton>
      </div>

      <div class="mt-8 flex-1 overflow-y-auto pr-1">
        <BaseSidebarNav />
      </div>

      <div class="rounded-lg border border-white/10 bg-white/6 p-3">
        <p class="truncate text-sm font-medium">{{ auth.storeName }}</p>
        <p class="mt-1 truncate text-xs text-sidebar-muted">
          {{ context.selectedBranch?.name ?? 'Sucursal no seleccionada' }}
        </p>
        <button
          type="button"
          class="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-white/10 text-sm font-medium text-sidebar-foreground hover:bg-white/15"
          @click="handleLogout"
        >
          <LogOut class="size-4" aria-hidden="true" />
          Cerrar sesion
        </button>
      </div>
    </aside>

    <aside class="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-sidebar px-4 py-5 text-sidebar-foreground lg:flex">
      <div class="flex items-center gap-3 px-2">
        <div class="flex size-10 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
          <Store class="size-5" aria-hidden="true" />
        </div>
        <div>
          <p class="text-lg font-semibold leading-5">Neo Business</p>
          <p class="text-xs text-sidebar-muted">POS e inventario</p>
        </div>
      </div>

      <div class="mt-8 flex-1 overflow-y-auto pr-1">
        <BaseSidebarNav />
      </div>

      <div class="rounded-lg border border-white/10 bg-white/6 p-3">
        <p class="truncate text-sm font-medium">{{ auth.storeName }}</p>
        <p class="mt-1 truncate text-xs text-sidebar-muted">
          {{ context.selectedBranch?.name ?? 'Sucursal no seleccionada' }}
        </p>
      </div>
    </aside>

    <div class="lg:pl-72">
      <header class="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
        <div class="flex min-h-16 items-center gap-3 px-4 sm:px-6">
          <UiButton variant="ghost" size="icon" class="lg:hidden" aria-label="Abrir menu" @click="mobileMenuOpen = true">
            <Menu class="size-5" aria-hidden="true" />
          </UiButton>

          <div class="hidden min-w-0 sm:block">
            <p class="truncate text-sm font-medium">{{ auth.storeName }}</p>
            <p class="truncate text-xs text-muted-foreground">Vista de negocio</p>
          </div>

          <BaseBusinessContextSelector />

          <div class="ml-auto w-full max-w-xl">
            <BaseGlobalSearch />
          </div>

          <BaseNotificationCenter />
          <BaseUserStatus />
        </div>
      </header>

      <main class="px-4 py-6 sm:px-6 lg:px-8">
        <slot />
      </main>
    </div>
  </div>
</template>
