import type { FetchOptions } from 'ofetch'

type ApiOptions = FetchOptions<'json'>

export function useApi() {
  async function request<T>(path: string, options: ApiOptions = {}) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return await $fetch<T>(normalizedPath, {
      ...options,
      baseURL: '/api/backend',
      headers: options.headers,
      query: options.query,
      body: options.body,
      method: options.method,
    })
  }

  return {
    request,
    get: <T>(path: string, options?: ApiOptions) => request<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, body?: unknown, options?: ApiOptions) => request<T>(path, { ...options, method: 'POST', body }),
    patch: <T>(path: string, body?: unknown, options?: ApiOptions) => request<T>(path, { ...options, method: 'PATCH', body }),
    delete: <T>(path: string, options?: ApiOptions) => request<T>(path, { ...options, method: 'DELETE' }),
  }
}
