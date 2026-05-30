<script setup lang="ts">
import { ArrowRight, LockKeyhole, Store } from '@lucide/vue'

definePageMeta({
  layout: false,
})

const route = useRoute()
const auth = useAuthStore()
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const sessionExpired = computed(() => route.query.reason === 'expired')

async function handleSubmit() {
  errorMessage.value = ''

  try {
    await auth.login({
      email: email.value,
      password: password.value,
    })

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await navigateTo(redirect)
  }
  catch (error) {
    const fallback = 'No pudimos iniciar sesion. Revisa tus credenciales e intenta de nuevo.'

    if (error instanceof Error) {
      errorMessage.value = error.message || fallback
      return
    }

    errorMessage.value = fallback
  }
}
</script>

<template>
  <main class="grid min-h-screen bg-background text-foreground lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.65fr)]">
    <section class="hidden border-r bg-sidebar px-10 py-10 text-sidebar-foreground lg:flex lg:flex-col">
      <div class="flex items-center gap-3">
        <div class="flex size-11 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
          <Store class="size-5" aria-hidden="true" />
        </div>
        <div>
          <p class="text-xl font-semibold leading-5">Neo Business</p>
          <p class="text-sm text-sidebar-muted">POS e inventario</p>
        </div>
      </div>

      <div class="mt-auto max-w-xl">
        <p class="text-sm font-medium uppercase text-sidebar-muted">Panel de negocio</p>
        <h1 class="mt-4 text-5xl font-semibold leading-tight tracking-normal">
          Control claro para ventas, stock y operaciones diarias.
        </h1>
        <p class="mt-5 max-w-lg text-base leading-7 text-sidebar-foreground/72">
          Accede con tu usuario del negocio. La interfaz muestra solo las secciones permitidas para tu rol.
        </p>
      </div>
    </section>

    <section class="flex items-center justify-center px-4 py-10 sm:px-6">
      <UiCard class="w-full max-w-md p-6 sm:p-8">
        <div class="flex items-center gap-3 lg:hidden">
          <div class="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Store class="size-5" aria-hidden="true" />
          </div>
          <div>
            <p class="text-lg font-semibold leading-5">Neo Business</p>
            <p class="text-xs text-muted-foreground">POS e inventario</p>
          </div>
        </div>

        <div class="mt-8 lg:mt-0">
          <UiBadge variant="muted">
            <LockKeyhole class="size-3.5" aria-hidden="true" />
            Acceso protegido
          </UiBadge>
          <h2 class="mt-4 text-2xl font-semibold tracking-normal">Iniciar sesion</h2>
          <p class="mt-2 text-sm leading-6 text-muted-foreground">
            Usa las credenciales asignadas a tu negocio.
          </p>
          <p v-if="sessionExpired" class="mt-3 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning" role="alert">
            Tu sesion expiro. Inicia sesion de nuevo para continuar.
          </p>
        </div>

        <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
          <label class="block space-y-2">
            <span class="text-sm font-medium">Correo electronico</span>
            <UiInput
              v-model="email"
              type="email"
              placeholder="admin@example.com"
              autocomplete="email"
              required
            />
          </label>

          <label class="block space-y-2">
            <span class="text-sm font-medium">Contrasena</span>
            <UiInput
              v-model="password"
              type="password"
              placeholder="Ingresa tu contrasena"
              autocomplete="current-password"
              required
            />
          </label>

          <p v-if="errorMessage" class="rounded-md border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm text-destructive">
            {{ errorMessage }}
          </p>

          <UiButton type="submit" class="w-full" :disabled="auth.loading">
            <span>{{ auth.loading ? 'Validando acceso' : 'Entrar al panel' }}</span>
            <ArrowRight class="size-4" aria-hidden="true" />
          </UiButton>
        </form>
      </UiCard>
    </section>
  </main>
</template>
