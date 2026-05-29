import type { Component } from 'vue'

export type AdminFieldType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'boolean' | 'select' | 'multiselect'

export type AdminOption = {
  label: string
  value: string | number | boolean
}

export type AdminDependency = {
  key: string
  endpoint: string
  collectionKey: string
  labelField?: string
  valueField?: string
  filter?: (record: Record<string, unknown>) => boolean
}

export type AdminField = {
  key: string
  label: string
  type?: AdminFieldType
  placeholder?: string
  required?: boolean
  defaultValue?: unknown
  options?: AdminOption[]
  dependencyKey?: string
  class?: string
  createOnly?: boolean
  editOnly?: boolean
  help?: string
}

export type AdminColumn = {
  key: string
  label: string
  type?: 'text' | 'money' | 'boolean' | 'status' | 'roles'
}

export type AdminResourceConfig = {
  title: string
  description: string
  endpoint: string
  collectionKey: string
  resourceKey: string
  permission: string
  writePermission: string
  icon: Component
  singularLabel: string
  createLabel: string
  emptyTitle: string
  emptyDescription: string
  searchPlaceholder: string
  searchParam?: string
  fields: AdminField[]
  columns: AdminColumn[]
  dependencies?: AdminDependency[]
  formClass?: string
  disabled?: boolean
  disabledTitle?: string
  disabledDescription?: string
}
