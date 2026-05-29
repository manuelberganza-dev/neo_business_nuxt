export type Role = {
  id?: number
  name: string
}

export type Permission = {
  id?: number
  name: string
}

export type StoreTenant = {
  id?: number
  name?: string
  legal_name?: string
  nit?: string
  nrc?: string
}

export type Branch = {
  id?: number
  name?: string
}

export type CurrentUser = {
  id?: number
  email: string
  full_name?: string
  active?: boolean
  store?: StoreTenant
  branch?: Branch | null
  roles: Role[]
  permissions: string[]
}

export type LoginCredentials = {
  email: string
  password: string
}

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeRole(value: unknown): Role | null {
  if (typeof value === 'string') return { name: value }
  if (isRecord(value) && typeof value.name === 'string') {
    return {
      id: typeof value.id === 'number' ? value.id : undefined,
      name: value.name,
    }
  }

  return null
}

function normalizePermission(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (isRecord(value) && typeof value.name === 'string') return value.name

  return null
}

function normalizeStore(value: unknown): StoreTenant | undefined {
  if (!isRecord(value)) return undefined

  return {
    id: typeof value.id === 'number' ? value.id : undefined,
    name: typeof value.name === 'string' ? value.name : undefined,
    legal_name: typeof value.legal_name === 'string' ? value.legal_name : undefined,
    nit: typeof value.nit === 'string' ? value.nit : undefined,
    nrc: typeof value.nrc === 'string' ? value.nrc : undefined,
  }
}

function normalizeBranch(value: unknown): Branch | null {
  if (!isRecord(value)) return null

  return {
    id: typeof value.id === 'number' ? value.id : undefined,
    name: typeof value.name === 'string' ? value.name : undefined,
  }
}

export function normalizeCurrentUser(payload: unknown): CurrentUser {
  const root = isRecord(payload) ? payload : {}
  const nestedUser = isRecord(root.user) ? root.user : root
  const rolesSource = Array.isArray(root.roles)
    ? root.roles
    : Array.isArray(nestedUser.roles)
      ? nestedUser.roles
      : []
  const permissionsSource = Array.isArray(root.permissions)
    ? root.permissions
    : Array.isArray(nestedUser.permissions)
      ? nestedUser.permissions
      : []
  const store = normalizeStore(root.store ?? nestedUser.store)
  const branch = normalizeBranch(root.branch ?? nestedUser.branch)
  const roles = rolesSource.map(normalizeRole).filter((role): role is Role => Boolean(role))
  const permissions = permissionsSource
    .map(normalizePermission)
    .filter((permission): permission is string => Boolean(permission))

  return {
    id: typeof nestedUser.id === 'number' ? nestedUser.id : undefined,
    email: typeof nestedUser.email === 'string' ? nestedUser.email : '',
    full_name: typeof nestedUser.full_name === 'string' ? nestedUser.full_name : undefined,
    active: typeof nestedUser.active === 'boolean' ? nestedUser.active : undefined,
    store,
    branch,
    roles,
    permissions,
  }
}
