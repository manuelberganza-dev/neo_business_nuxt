export type BranchOption = {
  id: number
  name: string
  code?: string
  is_main?: boolean
  status?: string
}

export type WarehouseOption = {
  id: number
  branch_id?: number
  branch_name?: string
  name: string
  code?: string
  active?: boolean
}

export type SearchResultType = 'product' | 'customer' | 'supplier' | 'sale'

export type SearchResult = {
  id: number | string
  type: SearchResultType
  title: string
  subtitle: string
  href: string
}

type UnknownRecord = Record<string, unknown>

export function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function unwrapCollection<T>(payload: unknown, key: string): T[] {
  if (Array.isArray(payload)) return payload as T[]

  if (isRecord(payload) && Array.isArray(payload[key])) {
    return payload[key] as T[]
  }

  return []
}

export function toNumber(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return Number(value)

  return undefined
}

export function normalizeBranch(value: unknown): BranchOption | null {
  if (!isRecord(value)) return null
  const id = toNumber(value.id)
  const name = typeof value.name === 'string' ? value.name : undefined

  if (!id || !name) return null

  return {
    id,
    name,
    code: typeof value.code === 'string' ? value.code : undefined,
    is_main: typeof value.is_main === 'boolean' ? value.is_main : undefined,
    status: typeof value.status === 'string' ? value.status : undefined,
  }
}

export function normalizeWarehouse(value: unknown): WarehouseOption | null {
  if (!isRecord(value)) return null
  const id = toNumber(value.id)
  const name = typeof value.name === 'string' ? value.name : undefined

  if (!id || !name) return null

  return {
    id,
    name,
    branch_id: toNumber(value.branch_id),
    branch_name: typeof value.branch_name === 'string' ? value.branch_name : undefined,
    code: typeof value.code === 'string' ? value.code : undefined,
    active: typeof value.active === 'boolean' ? value.active : undefined,
  }
}
