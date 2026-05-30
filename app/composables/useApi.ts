import type { FetchOptions } from 'ofetch'

type ApiOptions = FetchOptions<'json'>

type RailsErrorBody = {
  error?: string
  errors?: string | string[] | Record<string, string[]>
  message?: string
}

function extractErrorMessage(data: RailsErrorBody): string | null {
  if (typeof data.error === 'string' && data.error) return data.error

  if (data.errors) {
    if (typeof data.errors === 'string') return data.errors
    if (Array.isArray(data.errors)) return data.errors.join(', ')
    if (typeof data.errors === 'object') {
      const lines = Object.entries(data.errors).flatMap(([field, msgs]) =>
        Array.isArray(msgs) ? msgs.map((m) => `${field} ${m}`) : [`${field} ${msgs}`],
      )
      if (lines.length) return lines.join(', ')
    }
  }

  if (typeof data.message === 'string' && data.message) return data.message

  return null
}

export function useApi() {
  async function request<T>(path: string, options: ApiOptions = {}) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`

    try {
      return await $fetch<T>(normalizedPath, {
        ...options,
        baseURL: '/api/backend',
        headers: options.headers,
        query: options.query,
        body: options.body,
        method: options.method,
      })
    }
    catch (fetchError: unknown) {
      const err = fetchError as {
        statusCode?: number
        data?: RailsErrorBody
        message?: string
      }

      // Session expired — clear local auth and redirect to login
      if (import.meta.client && err.statusCode === 401) {
        const auth = useAuthStore()
        auth.clearSession()
        await navigateTo({ path: '/login', query: { reason: 'expired' } })
        throw new Error('Tu sesion ha expirado. Inicia sesion de nuevo.')
      }

      // Extract human-readable error from Rails JSON body
      if (err.data) {
        const message = extractErrorMessage(err.data)
        if (message) throw new Error(message)
      }

      throw fetchError
    }
  }

  return {
    request,
    get: <T>(path: string, options?: ApiOptions) => request<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, body?: unknown, options?: ApiOptions) => request<T>(path, { ...options, method: 'POST', body }),
    patch: <T>(path: string, body?: unknown, options?: ApiOptions) => request<T>(path, { ...options, method: 'PATCH', body }),
    delete: <T>(path: string, options?: ApiOptions) => request<T>(path, { ...options, method: 'DELETE' }),
  }
}
