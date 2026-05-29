export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  const permission = to.meta.permission
  const permissions = to.meta.permissions

  if (typeof permission === 'string' && !auth.can(permission)) {
    return abortNavigation(createError({
      statusCode: 403,
      statusMessage: 'No tienes permiso para acceder a esta seccion.',
    }))
  }

  if (Array.isArray(permissions) && !permissions.every((item) => typeof item === 'string' && auth.can(item))) {
    return abortNavigation(createError({
      statusCode: 403,
      statusMessage: 'No tienes permiso para acceder a esta seccion.',
    }))
  }
})
