<script setup lang="ts">
import { Building2, Fingerprint, Store } from '@lucide/vue'

definePageMeta({
  middleware: 'permission',
  permission: 'stores.read',
})

const auth = useAuthStore()
const store = computed(() => auth.user?.store)

const details = computed(() => [
  { label: 'Nombre comercial', value: store.value?.name },
  { label: 'Razon social', value: store.value?.legal_name },
  { label: 'NIT', value: store.value?.nit },
  { label: 'NRC', value: store.value?.nrc },
])
</script>

<template>
  <section class="space-y-5">
    <div class="flex items-start gap-3">
      <div class="grid size-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <Store class="size-5" aria-hidden="true" />
      </div>
      <div>
        <p class="text-sm font-medium text-muted-foreground">Administracion tenant</p>
        <h1 class="text-2xl font-semibold tracking-normal">Mi negocio</h1>
        <p class="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Datos fiscales y comerciales del negocio autenticado. Esta vista no expone administracion global de tiendas.
        </p>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-[minmax(0,0.7fr)_minmax(280px,0.3fr)]">
      <UiCard class="p-5">
        <div class="flex items-center gap-3">
          <Building2 class="size-5 text-muted-foreground" aria-hidden="true" />
          <h2 class="text-base font-semibold">Informacion fiscal</h2>
        </div>

        <dl class="mt-5 grid gap-4 sm:grid-cols-2">
          <div v-for="item in details" :key="item.label" class="rounded-md border bg-background p-4">
            <dt class="text-xs font-semibold uppercase text-muted-foreground">{{ item.label }}</dt>
            <dd class="mt-2 text-sm font-medium">{{ item.value || 'No definido' }}</dd>
          </div>
        </dl>
      </UiCard>

      <UiCard class="p-5">
        <Fingerprint class="size-5 text-muted-foreground" aria-hidden="true" />
        <h2 class="mt-4 text-base font-semibold">Alcance seguro</h2>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          La informacion viene de la sesion `/me`; los cambios globales de tenants quedan fuera de esta interfaz de negocio.
        </p>
      </UiCard>
    </div>
  </section>
</template>
