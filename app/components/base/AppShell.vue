<script setup lang="ts">
import { Bell, Menu, Search, Store, UserRound } from '@lucide/vue'
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
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
        <p class="text-sm font-medium">Tienda demo</p>
        <p class="mt-1 text-xs text-sidebar-muted">Ambiente de diseno visual</p>
      </div>
    </aside>

    <div class="lg:pl-72">
      <header class="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
        <div class="flex min-h-16 items-center gap-3 px-4 sm:px-6">
          <UiButton variant="ghost" size="icon" class="lg:hidden" aria-label="Abrir menu">
            <Menu class="size-5" aria-hidden="true" />
          </UiButton>

          <div class="hidden min-w-0 sm:block">
            <p class="truncate text-sm font-medium">Tienda demo, S.A. de C.V.</p>
            <p class="truncate text-xs text-muted-foreground">Vista de negocio</p>
          </div>

          <div class="relative ml-auto w-full max-w-xl">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <UiInput class="pl-9" placeholder="Buscar productos, clientes o documentos" />
          </div>

          <UiButton variant="outline" size="icon" aria-label="Notificaciones">
            <Bell class="size-4" aria-hidden="true" />
          </UiButton>

          <div class="hidden items-center gap-2 rounded-md border bg-background px-3 py-2 md:flex">
            <div class="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <UserRound class="size-4" aria-hidden="true" />
            </div>
            <div>
              <p class="text-sm font-medium leading-4">Administrador</p>
              <p class="text-xs text-muted-foreground">En linea</p>
            </div>
          </div>
        </div>
      </header>

      <main class="px-4 py-6 sm:px-6 lg:px-8">
        <slot />
      </main>
    </div>
  </div>
</template>
