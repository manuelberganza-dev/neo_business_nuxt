export default defineEventHandler(async (event) => {
  const token = readSessionToken(event)

  if (token) {
    try {
      await $fetch('/auth/logout', {
        baseURL: backendBaseUrl(),
        method: 'DELETE',
        headers: authorizationHeader(token),
      })
    }
    catch {
      // Si Rails ya invalido el JWT, igual removemos la cookie local.
    }
  }

  clearSessionToken(event)

  return { ok: true }
})
