<script setup lang="ts">
import { AlertTriangle, ArrowLeft, Home, LockKeyhole, SearchX } from '@lucide/vue'

const props = defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}>()

const statusCode = computed(() => props.error?.statusCode ?? 500)

const config = computed(() => {
  if (statusCode.value === 403) {
    return {
      icon: LockKeyhole,
      title: 'Sin permiso de acceso',
      description: 'Tu rol no tiene acceso a esta seccion. Contacta al administrador si crees que es un error.',
      tone: 'text-warning',
      bg: 'bg-warning/10',
    }
  }
  if (statusCode.value === 404) {
    return {
      icon: SearchX,
      title: 'Pagina no encontrada',
      description: 'La ruta que buscas no existe o fue movida.',
      tone: 'text-muted-foreground',
      bg: 'bg-muted/40',
    }
  }
  return {
    icon: AlertTriangle,
    title: 'Algo salio mal',
    description: props.error?.statusMessage || props.error?.message || 'Ocurrio un error inesperado. Intenta de nuevo o contacta soporte.',
    tone: 'text-destructive',
    bg: 'bg-destructive/10',
  }
})

function goBack() {
  if (window.history.length > 1) window.history.back()
  else navigateTo('/')
}
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-background px-4 text-foreground">
    <div class="mx-auto w-full max-w-sm text-center">
      <div
        class="mx-auto grid size-20 place-items-center rounded-2xl"
        :class="config.bg"
      >
        <component :is="config.icon" class="size-9" :class="config.tone" aria-hidden="true" />
      </div>

      <p class="mt-6 text-6xl font-bold tracking-tight text-muted-foreground/40">{{ statusCode }}</p>
      <h1 class="mt-2 text-2xl font-semibold tracking-normal">{{ config.title }}</h1>
      <p class="mt-3 text-sm leading-6 text-muted-foreground">{{ config.description }}</p>

      <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <UiButton variant="outline" @click="goBack">
          <ArrowLeft class="size-4" aria-hidden="true" />
          Volver
        </UiButton>
        <NuxtLink to="/">
          <UiButton>
            <Home class="size-4" aria-hidden="true" />
            Ir al panel
          </UiButton>
        </NuxtLink>
      </div>
    </div>
  </main>
</template>
