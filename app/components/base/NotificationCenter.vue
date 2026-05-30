<script setup lang="ts">
import { Bell, CheckCheck, CircleAlert, CircleCheck, CircleDot, TriangleAlert, Wifi, WifiOff } from '@lucide/vue'

const notifications = useNotificationsStore()
const online = useOnline()
const open = ref(false)

const toneIcon = {
  default: CircleDot,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
}

onMounted(() => {
  void notifications.refresh()
})

watch(online, (value) => {
  notifications.add({
    title: value ? 'Conexion restablecida' : 'Sin conexion',
    description: value ? 'El panel vuelve a comunicarse con el servidor.' : 'Revisaremos de nuevo cuando vuelva la red.',
    tone: value ? 'success' : 'warning',
  })
})
</script>

<template>
  <div class="relative">
    <UiButton variant="outline" size="icon" aria-label="Notificaciones" @click="open = !open">
      <Bell class="size-4" aria-hidden="true" />
      <span
        v-if="notifications.unreadCount"
        class="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground"
      >
        {{ notifications.unreadCount }}
      </span>
    </UiButton>

    <div
      v-if="open"
      class="absolute right-0 top-12 z-40 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg"
    >
      <div class="flex items-center justify-between border-b p-4">
        <div>
          <h2 class="text-sm font-semibold">Notificaciones</h2>
          <p class="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Wifi v-if="online" class="size-3.5 text-success" aria-hidden="true" />
            <WifiOff v-else class="size-3.5 text-warning" aria-hidden="true" />
            {{ online ? 'En linea' : 'Sin conexion' }}
          </p>
        </div>
        <UiButton variant="ghost" size="sm" @click="notifications.markAllRead">
          <CheckCheck class="size-4" aria-hidden="true" />
          Leidas
        </UiButton>
      </div>

      <div v-if="notifications.items.length" class="max-h-96 overflow-y-auto p-2">
        <div
          v-for="item in notifications.items"
          :key="item.id"
          class="flex gap-3 rounded-md px-3 py-3"
          :class="item.read ? 'opacity-72' : 'bg-muted/70'"
          role="button"
          tabindex="0"
          @click="notifications.markRead(item.id)"
          @keyup.enter="notifications.markRead(item.id)"
        >
          <component :is="toneIcon[item.tone]" class="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div class="min-w-0">
            <p class="text-sm font-medium">{{ item.title }}</p>
            <p class="mt-1 text-xs leading-5 text-muted-foreground">{{ item.description }}</p>
          </div>
        </div>
      </div>

      <div v-else class="p-5 text-sm text-muted-foreground">
        No hay notificaciones por ahora.
      </div>
    </div>
  </div>
</template>
