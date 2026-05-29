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

const route = useRoute()
const { can } = usePermissions()

const navGroups = [
  {
    label: 'Inicio',
    items: [
      { label: 'Panel', icon: Gauge, to: '/', permission: '' },
      { label: 'Ventas', icon: ShoppingCart, to: '/ventas', permission: 'sales.read' },
      { label: 'Reportes', icon: BarChart3, to: '/reportes', permission: 'reports.read' },
    ],
  },
  {
    label: 'Operacion',
    items: [
      { label: 'POS', icon: Receipt, to: '/pos', permission: 'sales.write' },
      { label: 'Productos', icon: Package, to: '/productos', permission: 'products.read' },
      { label: 'Inventario', icon: Boxes, to: '/inventario', permission: 'inventory.read' },
      { label: 'Bodegas', icon: Warehouse, to: '/bodegas', permission: 'warehouses.read' },
      { label: 'Compras', icon: ClipboardList, to: '/compras', permission: 'purchases.read' },
    ],
  },
  {
    label: 'Administracion',
    items: [
      { label: 'Mi negocio', icon: Store, to: '/mi-negocio', permission: 'stores.read' },
      { label: 'Sucursales', icon: Building2, to: '/sucursales', permission: 'branches.read' },
      { label: 'Clientes', icon: Users, to: '/clientes', permission: 'customers.read' },
      { label: 'Metodos de pago', icon: CreditCard, to: '/metodos-de-pago', permission: 'payment_methods.read' },
      { label: 'Configuracion', icon: Settings, to: '/configuracion', permission: 'users.read' },
    ],
  },
]

const groups = computed(() => navGroups
  .map((group) => ({
    ...group,
    items: group.items.filter((item) => can(item.permission)),
  }))
  .filter((group) => group.items.length > 0))
</script>

<template>
  <nav class="space-y-6" aria-label="Navegacion principal">
    <div v-for="group in groups" :key="group.label">
      <p class="px-3 text-xs font-semibold uppercase text-sidebar-muted">{{ group.label }}</p>
      <div class="mt-2 space-y-1">
        <NuxtLink
          v-for="item in group.items"
          :key="item.label"
          :to="item.to"
          :class="[
            'flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition-colors',
            route.path === item.to
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/82 hover:bg-white/8 hover:text-sidebar-foreground',
          ]"
        >
          <component :is="item.icon" class="size-4 shrink-0" aria-hidden="true" />
          <span class="truncate">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>
