import { acceptHMRUpdate, defineStore } from 'pinia'
import type { CurrentUser, LoginCredentials } from '~/types/auth'
import { normalizeCurrentUser } from '~/types/auth'

function isPrivilegedRole(role: string) {
  return role === 'admin' || role === 'superadmin'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<CurrentUser | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  const isAuthenticated = computed(() => Boolean(user.value))
  const roles = computed(() => user.value?.roles.map((role) => role.name) ?? [])
  const permissions = computed(() => user.value?.permissions ?? [])
  const displayName = computed(() => user.value?.full_name || user.value?.email || 'Usuario')
  const storeName = computed(() => user.value?.store?.legal_name || user.value?.store?.name || 'Mi negocio')

  function clearSession() {
    user.value = null
    initialized.value = true
  }

  function can(permission: string) {
    if (!permission) return true
    if (roles.value.some(isPrivilegedRole)) return true

    return permissions.value.includes(permission)
  }

  async function loadMe() {
    loading.value = true

    try {
      const response = await $fetch('/api/auth/me', {
        headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
      })

      user.value = normalizeCurrentUser(response)
      initialized.value = true

      return user.value
    }
    catch (error) {
      clearSession()
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function login(credentials: LoginCredentials) {
    loading.value = true

    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          user: credentials,
        },
      })
      user.value = normalizeCurrentUser(response)
      initialized.value = true

      return user.value
    }
    finally {
      loading.value = false
    }
  }

  async function logout() {
    const businessContext = useBusinessContextStore()
    const notifications = useNotificationsStore()

    try {
      await $fetch('/api/auth/logout', {
        method: 'DELETE',
      })
    }
    catch {
      // La sesion local siempre se limpia aunque el token ya haya expirado en Rails.
    }

    businessContext.reset()
    notifications.reset()
    clearSession()
  }

  return {
    user,
    loading,
    initialized,
    isAuthenticated,
    roles,
    permissions,
    displayName,
    storeName,
    can,
    loadMe,
    login,
    logout,
    clearSession,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
