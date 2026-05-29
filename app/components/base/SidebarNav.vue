<script setup lang="ts">
import {
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  CreditCard,
  Gauge,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Store,
  Users,
  Warehouse,
} from '@lucide/vue'

const groups = [
  {
    label: 'Inicio',
    items: [
      { label: 'Panel', icon: Gauge, active: true },
      { label: 'Ventas', icon: ShoppingCart },
      { label: 'Reportes', icon: BarChart3 },
    ],
  },
  {
    label: 'Operacion',
    items: [
      { label: 'POS', icon: Receipt },
      { label: 'Productos', icon: Package },
      { label: 'Inventario', icon: Boxes },
      { label: 'Bodegas', icon: Warehouse },
      { label: 'Compras', icon: ClipboardList },
    ],
  },
  {
    label: 'Administracion',
    items: [
      { label: 'Mi negocio', icon: Store },
      { label: 'Sucursales', icon: Building2 },
      { label: 'Clientes', icon: Users },
      { label: 'Metodos de pago', icon: CreditCard },
      { label: 'Configuracion', icon: Settings },
    ],
  },
]
</script>

<template>
  <nav class="space-y-6" aria-label="Navegacion principal">
    <div v-for="group in groups" :key="group.label">
      <p class="px-3 text-xs font-semibold uppercase text-sidebar-muted">{{ group.label }}</p>
      <div class="mt-2 space-y-1">
        <button
          v-for="item in group.items"
          :key="item.label"
          type="button"
          :class="[
            'flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition-colors',
            item.active
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/82 hover:bg-white/8 hover:text-sidebar-foreground',
          ]"
        >
          <component :is="item.icon" class="size-4 shrink-0" aria-hidden="true" />
          <span class="truncate">{{ item.label }}</span>
        </button>
      </div>
    </div>
  </nav>
</template>
