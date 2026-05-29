import { acceptHMRUpdate, defineStore } from 'pinia'
import { unwrapCollection } from '~/types/business'

export type NotificationTone = 'default' | 'success' | 'warning' | 'danger'

export type ShellNotification = {
  id: string
  title: string
  description: string
  tone: NotificationTone
  read: boolean
  createdAt: string
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

  function markAllRead() {
    items.value = items.value.map((item) => ({ ...item, read: true }))
  }

  async function refresh() {
    if (!auth.isAuthenticated) return

    loading.value = true

    try {
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
    refresh,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNotificationsStore, import.meta.hot))
}
