<script setup lang="ts">
import { ArrowRight, Boxes } from '@lucide/vue'

const { can } = usePermissions()

const sections = [
  { label: 'Productos', description: 'Precios, costos, SKU e impuesto.', to: '/productos', permission: 'products.read' },
  { label: 'Categorias', description: 'Familias y subfamilias del catalogo.', to: '/categorias', permission: 'categories.read' },
  { label: 'Unidades', description: 'UND, KG, caja y otras medidas.', to: '/unidades', permission: 'units.read' },
  { label: 'Marcas', description: 'Marcas comerciales por producto.', to: '/marcas', permission: 'brands.read' },
  { label: 'Clientes', description: 'Datos comerciales y fiscales.', to: '/clientes', permission: 'customers.read' },
  { label: 'Proveedores', description: 'Contactos para compras y entradas.', to: '/proveedores', permission: 'suppliers.read' },
  { label: 'Metodos de pago', description: 'Efectivo, tarjeta, transferencia y mas.', to: '/metodos-de-pago', permission: 'payment_methods.read' },
]

const visibleSections = computed(() => sections.filter((section) => can(section.permission)))
</script>

<template>
  <section class="space-y-5">
    <div class="flex items-start gap-3">
      <div class="grid size-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <Boxes class="size-5" aria-hidden="true" />
      </div>
      <div>
        <p class="text-sm font-medium text-muted-foreground">Administracion tenant</p>
        <h1 class="text-2xl font-semibold tracking-normal">Catalogos</h1>
        <p class="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Accesos rapidos a las entidades que sostienen productos, ventas, compras y facturacion diaria.
        </p>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <NuxtLink
        v-for="section in visibleSections"
        :key="section.to"
        :to="section.to"
        class="group rounded-md border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-muted/35"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold">{{ section.label }}</h2>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">{{ section.description }}</p>
          </div>
          <ArrowRight class="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
