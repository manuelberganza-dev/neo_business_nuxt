<script setup lang="ts">
import { Check, Edit3, Plus, RefreshCw, Search, Trash2, X } from '@lucide/vue'
import type { AdminField, AdminOption, AdminResourceConfig } from '~/types/admin'
import { isRecord, unwrapCollection } from '~/types/business'

type ResourceRecord = Record<string, unknown> & { id?: number | string }

const props = defineProps<{
  config: AdminResourceConfig
}>()

const api = useApi()
const auth = useAuthStore()

const records = ref<ResourceRecord[]>([])
const dependencyRecords = ref<Record<string, ResourceRecord[]>>({})
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const search = ref('')
const showForm = ref(false)
const editingRecord = ref<ResourceRecord | null>(null)
const form = reactive<Record<string, unknown>>({})

const canWrite = computed(() => auth.can(props.config.writePermission) && !props.config.disabled)
const visibleFields = computed(() => props.config.fields.filter((field) => {
  if (field.createOnly && editingRecord.value) return false
  if (field.editOnly && !editingRecord.value) return false

  return true
}))

function defaultValueFor(field: AdminField) {
  if (field.defaultValue !== undefined) return field.defaultValue
  if (field.type === 'boolean') return false
  if (field.type === 'multiselect') return []

  return ''
}

function optionLabel(record: ResourceRecord, labelField?: string) {
  const key = labelField ?? 'name'
  const value = record[key] ?? record.description ?? record.email ?? record.code ?? record.id

  return String(value ?? '')
}

function optionValue(record: ResourceRecord, valueField?: string) {
  return record[valueField ?? 'id'] as string | number
}

function fieldOptions(field: AdminField): AdminOption[] {
  if (field.options) return field.options
  if (!field.dependencyKey) return []

  const dependency = props.config.dependencies?.find((item) => item.key === field.dependencyKey)
  const source = dependencyRecords.value[field.dependencyKey] ?? []

  return source
    .filter((record) => dependency?.filter ? dependency.filter(record) : true)
    .filter((record) => {
      if (props.config.resourceKey !== 'category' || field.key !== 'parent_id') return true
      return record.id !== editingRecord.value?.id
    })
    .map((record) => ({
      label: optionLabel(record, dependency?.labelField),
      value: optionValue(record, dependency?.valueField),
    }))
}

function resetForm(record?: ResourceRecord) {
  props.config.fields.forEach((field) => {
    if (record) {
      if (field.key === 'role_ids' && Array.isArray(record.roles)) {
        form[field.key] = record.roles
          .filter(isRecord)
          .filter((role) => role.name !== 'superadmin')
          .map((role) => role.id)
        return
      }

      form[field.key] = record[field.key] ?? defaultValueFor(field)
      return
    }

    form[field.key] = defaultValueFor(field)
  })
}

function openCreate() {
  editingRecord.value = null
  resetForm()
  showForm.value = true
  errorMessage.value = ''
  successMessage.value = ''
}

function openEdit(record: ResourceRecord) {
  editingRecord.value = record
  resetForm(record)
  showForm.value = true
  errorMessage.value = ''
  successMessage.value = ''
}

function closeForm() {
  showForm.value = false
  editingRecord.value = null
}

function cleanPayload() {
  const payload: Record<string, unknown> = {}

  visibleFields.value.forEach((field) => {
    const value = form[field.key]

    if (field.type === 'password' && !value) return
    if ((field.type === 'select' || field.type === 'number') && value === '') {
      payload[field.key] = null
      return
    }

    payload[field.key] = value
  })

  return payload
}

async function loadDependencies() {
  const dependencies = props.config.dependencies ?? []

  await Promise.all(dependencies.map(async (dependency) => {
    const response = await api.get<unknown>(dependency.endpoint, { query: { limit: 200 } })
    dependencyRecords.value[dependency.key] = unwrapCollection<ResourceRecord>(response, dependency.collectionKey)
  }))
}

async function loadRecords() {
  if (props.config.disabled) {
    loading.value = false
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await loadDependencies()
    const query: Record<string, string | number | boolean> = { limit: 100 }
    if (props.config.searchParam && search.value.trim()) {
      query[props.config.searchParam] = search.value.trim()
    }

    const response = await api.get<unknown>(props.config.endpoint, { query })
    records.value = unwrapCollection<ResourceRecord>(response, props.config.collectionKey)
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No pudimos cargar la informacion.'
  }
  finally {
    loading.value = false
  }
}

async function saveRecord() {
  if (!canWrite.value) return

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const body = {
      [props.config.resourceKey]: cleanPayload(),
    }

    if (editingRecord.value?.id) {
      await api.patch(`${props.config.endpoint}/${editingRecord.value.id}`, body)
      successMessage.value = `${props.config.singularLabel} actualizado correctamente.`
    }
    else {
      await api.post(props.config.endpoint, body)
      successMessage.value = `${props.config.singularLabel} creado correctamente.`
    }

    closeForm()
    await loadRecords()
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No pudimos guardar los cambios.'
  }
  finally {
    saving.value = false
  }
}

async function deactivateRecord(record: ResourceRecord) {
  if (!canWrite.value || !record.id) return
  if (import.meta.client && !window.confirm(`Desactivar este ${props.config.singularLabel}?`)) return

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await api.delete(`${props.config.endpoint}/${record.id}`)
    successMessage.value = `${props.config.singularLabel} desactivado correctamente.`
    await loadRecords()
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No pudimos desactivar el registro.'
  }
  finally {
    saving.value = false
  }
}

function displayValue(record: ResourceRecord, key: string) {
  const value = record[key]

  if (key === 'parent_id' && value) {
    const parent = (dependencyRecords.value.categories ?? []).find((item) => item.id === value)
    return parent?.name ?? value
  }

  if (value === null || value === undefined || value === '') return 'No definido'

  return String(value)
}

function money(value: unknown) {
  const amount = Number(value ?? 0)

  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
  }).format(Number.isFinite(amount) ? amount : 0)
}

function badgeText(value: unknown) {
  if (typeof value === 'boolean') return value ? 'Activo' : 'Inactivo'
  if (value === 'active') return 'Activo'
  if (value === 'inactive') return 'Inactivo'

  return String(value ?? 'No definido')
}

function isActiveValue(value: unknown) {
  return value === true || value === 'active'
}

onMounted(() => {
  resetForm()
  void loadRecords()
})
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div class="min-w-0">
        <div class="flex items-center gap-3">
          <div class="grid size-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <component :is="config.icon" class="size-5" aria-hidden="true" />
          </div>
          <div>
            <p class="text-sm font-medium text-muted-foreground">Administracion tenant</p>
            <h1 class="text-2xl font-semibold tracking-normal">{{ config.title }}</h1>
          </div>
        </div>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{{ config.description }}</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <UiButton variant="outline" :disabled="loading" @click="loadRecords">
          <RefreshCw class="size-4" aria-hidden="true" />
          Actualizar
        </UiButton>
        <UiButton v-if="canWrite" @click="openCreate">
          <Plus class="size-4" aria-hidden="true" />
          {{ config.createLabel }}
        </UiButton>
      </div>
    </div>

    <UiCard v-if="config.disabled" class="p-6">
      <UiBadge variant="muted">Pendiente</UiBadge>
      <h2 class="mt-4 text-lg font-semibold">{{ config.disabledTitle }}</h2>
      <p class="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{{ config.disabledDescription }}</p>
    </UiCard>

    <template v-else>
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.38fr)]">
        <UiCard class="overflow-hidden">
          <div class="border-b p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label class="relative block w-full max-w-md">
                <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <UiInput v-model="search" class="pl-9" :placeholder="config.searchPlaceholder" @keyup.enter="loadRecords" />
              </label>
              <UiButton variant="secondary" :disabled="loading" @click="loadRecords">Buscar</UiButton>
              <p class="text-sm text-muted-foreground sm:ml-auto">{{ records.length }} registros</p>
            </div>
          </div>

          <div v-if="errorMessage" class="border-b border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            {{ errorMessage }}
          </div>
          <div v-if="successMessage" class="border-b border-success/20 bg-success/8 px-4 py-3 text-sm text-success">
            {{ successMessage }}
          </div>

          <div v-if="loading" class="grid min-h-72 place-items-center text-sm text-muted-foreground">
            Cargando informacion...
          </div>

          <div v-else-if="records.length === 0" class="grid min-h-72 place-items-center px-6 text-center">
            <div>
              <h2 class="text-lg font-semibold">{{ config.emptyTitle }}</h2>
              <p class="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{{ config.emptyDescription }}</p>
              <UiButton v-if="canWrite" class="mt-5" @click="openCreate">
                <Plus class="size-4" aria-hidden="true" />
                {{ config.createLabel }}
              </UiButton>
            </div>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y text-sm">
              <thead class="bg-muted/45 text-left text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th v-for="column in config.columns" :key="column.key" class="px-4 py-3">{{ column.label }}</th>
                  <th class="w-32 px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="record in records" :key="record.id" class="bg-card">
                  <td v-for="column in config.columns" :key="column.key" class="px-4 py-3 align-middle">
                    <UiBadge
                      v-if="column.type === 'boolean' || column.type === 'status'"
                      :variant="isActiveValue(record[column.key]) ? 'success' : 'muted'"
                    >
                      {{ badgeText(record[column.key]) }}
                    </UiBadge>
                    <span v-else-if="column.type === 'money'" class="font-medium">{{ money(record[column.key]) }}</span>
                    <div v-else-if="column.type === 'roles'" class="flex max-w-xs flex-wrap gap-1">
                      <UiBadge
                        v-for="role in (Array.isArray(record.roles) ? record.roles.filter(isRecord).filter((item) => item.name !== 'superadmin') : [])"
                        :key="String(role.id)"
                        variant="muted"
                      >
                        {{ role.description ?? role.name }}
                      </UiBadge>
                    </div>
                    <span v-else class="block max-w-64 truncate">{{ displayValue(record, column.key) }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex justify-end gap-2">
                      <UiButton v-if="canWrite" variant="outline" size="icon" aria-label="Editar" @click="openEdit(record)">
                        <Edit3 class="size-4" aria-hidden="true" />
                      </UiButton>
                      <UiButton v-if="canWrite" variant="ghost" size="icon" aria-label="Desactivar" @click="deactivateRecord(record)">
                        <Trash2 class="size-4" aria-hidden="true" />
                      </UiButton>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UiCard>

        <UiCard class="p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-base font-semibold">
                {{ showForm ? (editingRecord ? `Editar ${config.singularLabel}` : config.createLabel) : 'Detalle operativo' }}
              </h2>
              <p class="mt-1 text-sm leading-6 text-muted-foreground">
                {{ showForm ? 'Completa solo informacion del negocio cliente.' : 'Selecciona un registro o crea uno nuevo.' }}
              </p>
            </div>
            <UiButton v-if="showForm" variant="ghost" size="icon" aria-label="Cerrar formulario" @click="closeForm">
              <X class="size-4" aria-hidden="true" />
            </UiButton>
          </div>

          <form v-if="showForm" class="mt-5 grid gap-4" :class="config.formClass" @submit.prevent="saveRecord">
            <label
              v-for="field in visibleFields"
              :key="field.key"
              class="block space-y-2"
              :class="field.class"
            >
              <span class="text-sm font-medium">{{ field.label }}</span>

              <textarea
                v-if="field.type === 'textarea'"
                v-model="form[field.key] as string"
                class="min-h-24 w-full rounded-md border bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                :placeholder="field.placeholder"
              />

              <select
                v-else-if="field.type === 'select'"
                v-model="form[field.key]"
                class="h-10 w-full rounded-md border bg-card px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                :required="field.required"
              >
                <option value="">Seleccionar</option>
                <option v-for="option in fieldOptions(field)" :key="String(option.value)" :value="option.value">
                  {{ option.label }}
                </option>
              </select>

              <div v-else-if="field.type === 'multiselect'" class="rounded-md border bg-card p-3">
                <div v-if="fieldOptions(field).length" class="grid gap-2">
                  <label v-for="option in fieldOptions(field)" :key="String(option.value)" class="flex items-center gap-2 text-sm">
                    <input
                      v-model="form[field.key] as Array<string | number>"
                      type="checkbox"
                      class="size-4 rounded border"
                      :value="option.value"
                    >
                    <span>{{ option.label }}</span>
                  </label>
                </div>
                <p v-else class="text-sm text-muted-foreground">No hay opciones disponibles.</p>
              </div>

              <label v-else-if="field.type === 'boolean'" class="flex h-10 items-center gap-2 rounded-md border bg-card px-3 text-sm">
                <input v-model="form[field.key] as boolean" type="checkbox" class="size-4 rounded border">
                <span>{{ form[field.key] ? 'Si' : 'No' }}</span>
              </label>

              <UiInput
                v-else
                v-model="form[field.key] as string"
                :type="field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : field.type === 'email' ? 'email' : 'text'"
                :placeholder="field.placeholder"
                :required="field.required"
              />

              <span v-if="field.help" class="text-xs text-muted-foreground">{{ field.help }}</span>
            </label>

            <div class="flex flex-wrap gap-2" :class="config.formClass?.includes('md:grid-cols') ? 'md:col-span-2' : ''">
              <UiButton type="submit" :disabled="saving">
                <Check class="size-4" aria-hidden="true" />
                {{ saving ? 'Guardando' : 'Guardar cambios' }}
              </UiButton>
              <UiButton type="button" variant="outline" @click="closeForm">Cancelar</UiButton>
            </div>
          </form>

          <div v-else class="mt-5 space-y-3 text-sm text-muted-foreground">
            <p>Los registros se consultan directamente desde Rails y se guardan con permisos del usuario autenticado.</p>
            <p v-if="!canWrite">Tu rol actual permite lectura, pero no escritura en esta seccion.</p>
          </div>
        </UiCard>
      </div>
    </template>
  </section>
</template>
