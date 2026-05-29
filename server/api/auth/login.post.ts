export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const loginResponse = await $fetch.raw('/auth/login', {
    baseURL: backendBaseUrl(),
    method: 'POST',
    body,
  })
  const token = extractJwt(loginResponse.headers.get('authorization'))

  if (!token) {
    throw createError({
      statusCode: 502,
      statusMessage: 'El backend no devolvio un token de sesion.',
    })
  }

  setSessionToken(event, token)

  return await $fetch('/me', {
    baseURL: backendBaseUrl(),
    headers: authorizationHeader(token),
  })
})
