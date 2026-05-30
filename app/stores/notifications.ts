import { acceptHMRUpdate, defineStore } from 'pinia'
import { isRecord, unwrapCollection } from '~/types/business'

export type NotificationTone = 'default' | 'success' | 'warning' | 'danger'

export type ShellNotification = {
  id: string
  event?: string
  title: string
  description: string
  tone: NotificationTone
  read: boolean
  createdAt: string
  metadata?: Record<string, unknown>
}

function toneFromEvent(event: string): NotificationTone {
  if (event.includes('low_stock') || event.includes('alert')) return 'warning'
  if (event.includes('void') || event.includes('failed') || event.includes('error')) return 'danger'
  if (event.includes('received') || event.includes('finished') || event.includes('created')) return 'success'

  return 'default'
}

function normalizeNotification(value: unknown): ShellNotification | null {
  if (!isRecord(value)) return null
  const id = value.id
  const event = typeof value.event === 'string' ? value.event : 'system_alert'
  const title = typeof value.title === 'string' ? value.title : event.replaceAll('_', ' ')

  if (typeof id !== 'number' && typeof id !== 'string') return null

  return {
    id: String(id),
    event,
    title,
    description: typeof value.description === 'string'
      ? value.description
      : typeof value.message === 'string'
        ? value.message
        : 'Notificacion operativa del negocio.',
    tone: toneFromEvent(event),
    read: Boolean(value.read),
    createdAt: typeof value.created_at === 'string' ? value.created_at : new Date().toISOString(),
    metadata: isRecord(value.metadata) ? value.metadata : undefined,
  }
}

export const useNotificationsStore = defineStore('notifications', () => {
  const api = useApi()
  const auth = useAuthStore()
  const items = ref<ShellNotification[]>([])
  const loading = ref(false)

  const unreadCount = computed(() => items.value.filter((item) => !item.read).length)

  function add(notification: Omit<ShellNotification, 'id' | 'read' | 'createdAt'>) {
    const key = `${notification.title}:${notification.description}`

    if (items.value.some((item) => `${item.title}:${item.description}` === key)) return

    items.value.unshift({
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      read: false,
      createdAt: new Date().toISOString(),
      ...notification,
    })
  }

  async function markAllRead() {
    items.value = items.value.map((item) => ({ ...item, read: true }))

    if (!auth.isAuthenticated) return

    try {
      await api.patch('/notifications/read_all', undefined, { query: { unread: true } })
    }
    catch {
      // La marca local evita ruido visual aunque el backend no este disponible.
    }
  }

  async function markRead(id: string) {
    items.value = items.value.map((item) => item.id === id ? { ...item, read: true } : item)

    try {
      await api.patch(`/notifications/${id}/read`)
    }
    catch {
      // La accion local se conserva para no bloquear la UI por conectividad.
    }
  }

  async function refresh() {
    if (!auth.isAuthenticated) return

    loading.value = true

    try {
      const response = await api.get('/notifications', { query: { limit: 20 } })
      const persistent = unwrapCollection<unknown>(response, 'notifications')
        .map(normalizeNotification)
        .filter((item): item is ShellNotification => Boolean(item))

      if (persistent.length > 0) {
        items.value = persistent
        return
      }

      if (items.value.length === 0) {
        add({
          title: 'Sesion activa',
          description: 'Tu panel esta conectado al backend de Neo Business.',
          tone: 'success',
        })
      }

      if (auth.can('reports.read')) {
        const lowStock = await api.get('/reports/low_stock')
        const products = unwrapCollection<unknown>(lowStock, 'products')

        if (products.length > 0) {
          add({
            title: 'Productos bajo minimo',
            description: `${products.length} producto${products.length === 1 ? '' : 's'} requiere${products.length === 1 ? '' : 'n'} revision de inventario.`,
            tone: 'warning',
          })
        }
      }
    }
    catch {
      add({
        title: 'Notificaciones limitadas',
        description: 'No pudimos actualizar las alertas operativas.',
        tone: 'danger',
      })
    }
    finally {
      loading.value = false
    }
  }

  function reset() {
    items.value = []
  }

  return {
    items,
    loading,
    unreadCount,
    add,
    markAllRead,
    markRead,
    refresh,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNotificationsStore, import.meta.hot))
}
