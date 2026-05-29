export function usePermissions() {
  const auth = useAuthStore()

  function can(permission: string) {
    return auth.can(permission)
  }

  function canAny(permissions: string[]) {
    return permissions.some((permission) => can(permission))
  }

  function canAll(permissions: string[]) {
    return permissions.every((permission) => can(permission))
  }

  return {
    can,
    canAny,
    canAll,
  }
}
