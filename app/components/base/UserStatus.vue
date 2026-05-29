<script setup lang="ts">
import { LogOut, UserRound, Wifi, WifiOff } from '@lucide/vue'

const auth = useAuthStore()
const online = useOnline()

async function handleLogout() {
  await auth.logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="hidden items-center gap-2 rounded-md border bg-background px-3 py-2 md:flex">
    <div class="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <UserRound class="size-4" aria-hidden="true" />
    </div>
    <div>
      <p class="max-w-36 truncate text-sm font-medium leading-4">{{ auth.displayName }}</p>
      <p class="flex items-center gap-1 text-xs text-muted-foreground">
        <Wifi v-if="online" class="size-3 text-success" aria-hidden="true" />
        <WifiOff v-else class="size-3 text-warning" aria-hidden="true" />
        {{ online ? 'En linea' : 'Sin conexion' }}
      </p>
    </div>
    <UiButton variant="ghost" size="icon" class="-mr-2 size-8" aria-label="Cerrar sesion" @click="handleLogout">
      <LogOut class="size-4" aria-hidden="true" />
    </UiButton>
  </div>
</template>
