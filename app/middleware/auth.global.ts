const publicRoutes = new Set(['/login'])

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  const isPublic = publicRoutes.has(to.path)

  if (!auth.initialized) {
    try {
      await auth.loadMe()
    }
    catch {
      if (!isPublic) {
        return navigateTo({
          path: '/login',
          query: { redirect: to.fullPath },
        })
      }
    }
  }

  if (!auth.isAuthenticated && !isPublic) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }

  if (auth.isAuthenticated && isPublic) {
    return navigateTo('/')
  }
})
