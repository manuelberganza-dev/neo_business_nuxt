export default defineEventHandler((event) => {
  const token = requireSessionToken(event)
  const config = useRuntimeConfig()

  return {
    cableUrl: String(config.cableUrl),
    token,
  }
})
