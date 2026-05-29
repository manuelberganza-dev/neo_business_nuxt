import { createConsumer } from '@rails/actioncable'
import type { DashboardRealtimeEvent } from '~/types/dashboard'

type CableConsumer = ReturnType<typeof createConsumer>
type CableSubscription = ReturnType<CableConsumer['subscriptions']['create']>

export function useDashboardRealtime() {
  const dashboard = useDashboardStore()
  const notifications = useNotificationsStore()
  const connected = ref(false)
  const error = ref('')
  let consumer: CableConsumer | null = null
  const subscriptions: CableSubscription[] = []

  async function connect() {
    if (!import.meta.client || consumer) return

    try {
      const credentials = await $fetch<{ cableUrl: string, token: string }>('/api/auth/cable-token')
      const url = `${credentials.cableUrl}?token=${encodeURIComponent(credentials.token)}`

      consumer = createConsumer(url)

      const received = (message: DashboardRealtimeEvent) => {
        dashboard.applyRealtime(message)
      }

      subscriptions.push(
        consumer.subscriptions.create(
          { channel: 'SalesChannel' },
          {
            connected: () => {
              connected.value = true
              notifications.add({
                title: 'Ventas en tiempo real',
                description: 'El dashboard esta escuchando actualizaciones de ventas.',
                tone: 'success',
              })
            },
            disconnected: () => {
              connected.value = false
            },
            rejected: () => {
              connected.value = false
              error.value = 'Rails rechazo el canal de ventas.'
            },
            received,
          },
        ),
        consumer.subscriptions.create(
          { channel: 'InventoryChannel' },
          {
            received,
          },
        ),
        consumer.subscriptions.create(
          { channel: 'NotificationChannel' },
          {
            received: (message: DashboardRealtimeEvent) => {
              dashboard.applyRealtime(message)
              notifications.add({
                title: String(message.event ?? 'Notificacion'),
                description: String(message.payload?.message ?? message.payload?.title ?? 'Evento recibido desde Rails.'),
                tone: 'default',
              })
            },
          },
        ),
      )
    }
    catch {
      connected.value = false
      error.value = 'No pudimos conectar el tiempo real.'
      notifications.add({
        title: 'Tiempo real no disponible',
        description: 'El dashboard seguira usando actualizacion manual.',
        tone: 'warning',
      })
    }
  }

  function disconnect() {
    subscriptions.splice(0).forEach((subscription) => subscription.unsubscribe())
    consumer?.disconnect()
    consumer = null
    connected.value = false
  }

  onBeforeUnmount(disconnect)

  return {
    connected,
    error,
    connect,
    disconnect,
  }
}
