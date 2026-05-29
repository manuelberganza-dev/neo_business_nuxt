export default defineEventHandler(async (event) => {
  const token = requireSessionToken(event)
  const path = event.context.params?.path

  if (!path) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ruta de backend requerida.',
    })
  }

  const method = event.method.toUpperCase()
  const body = method === 'GET' || method === 'HEAD' ? undefined : await readRawBody(event)
  const requestHeaders = getRequestHeaders(event)
  const headers: Record<string, string> = {
    ...authorizationHeader(token),
  }

  if (requestHeaders['content-type']) {
    headers['content-type'] = requestHeaders['content-type']
  }

  return await $fetch(`/${path}`, {
    baseURL: backendBaseUrl(),
    method,
    query: getQuery(event),
    body,
    headers,
  })
})
