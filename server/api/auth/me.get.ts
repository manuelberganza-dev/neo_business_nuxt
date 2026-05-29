export default defineEventHandler(async (event) => {
  const token = requireSessionToken(event)

  return await $fetch('/me', {
    baseURL: backendBaseUrl(),
    headers: authorizationHeader(token),
  })
})
