<script setup lang="ts">
import type { StockMovement } from '~/types/inventory'

defineProps<{
  movements: StockMovement[]
  emptyText: string
}>()

function numberValue(value: number) {
  return new Intl.NumberFormat('es-SV', { maximumFractionDigits: 2 }).format(value)
}

function money(value: number) {
  return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(value)
}

function movementLabel(type: string) {
  const labels: Record<string, string> = {
    adjustment: 'Ajuste',
    purchase: 'Entrada',
    sale: 'Venta',
    transfer_in: 'Transferencia entrada',
    transfer_out: 'Transferencia salida',
    void: 'Anulacion',
  }

  return labels[type] ?? type
}

function movementVariant(type: string) {
  if (type === 'purchase' || type === 'transfer_in' || type === 'void') return 'success'
  if (type === 'sale' || type === 'transfer_out') return 'danger'

  return 'muted'
}

function movementQty(value: number) {
  return value > 0 ? `+${numberValue(value)}` : numberValue(value)
}

function dateTime(value: string) {
  if (!value) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
</script>

<template>
  <div v-if="movements.length === 0" class="grid min-h-56 place-items-center rounded-md border bg-background px-6 text-center text-sm text-muted-foreground">
    {{ emptyText }}
  </div>

  <div v-else class="overflow-x-auto rounded-md border">
    <table class="min-w-full divide-y text-sm">
      <thead class="bg-muted/45 text-left text-xs font-semibold uppercase text-muted-foreground">
        <tr>
          <th class="px-4 py-3">Fecha</th>
          <th class="px-4 py-3">Producto</th>
          <th class="px-4 py-3">Bodega</th>
          <th class="px-4 py-3">Tipo</th>
          <th class="px-4 py-3 text-right">Cantidad</th>
          <th class="px-4 py-3 text-right">Costo</th>
          <th class="px-4 py-3">Referencia</th>
          <th class="px-4 py-3">Notas</th>
        </tr>
      </thead>
      <tbody class="divide-y bg-card">
        <tr v-for="movement in movements" :key="movement.id">
          <td class="whitespace-nowrap px-4 py-3 text-muted-foreground">{{ dateTime(movement.occurredAt) }}</td>
          <td class="px-4 py-3 font-medium">{{ movement.productName }}</td>
          <td class="px-4 py-3">{{ movement.warehouseName }}</td>
          <td class="px-4 py-3">
            <UiBadge :variant="movementVariant(movement.movementType)">
              {{ movementLabel(movement.movementType) }}
            </UiBadge>
          </td>
          <td class="px-4 py-3 text-right font-semibold">{{ movementQty(movement.qty) }}</td>
          <td class="px-4 py-3 text-right">{{ money(movement.unitCost) }}</td>
          <td class="px-4 py-3 text-muted-foreground">
            {{ movement.referenceType || 'Manual' }}{{ movement.referenceId ? ` #${movement.referenceId}` : '' }}
          </td>
          <td class="max-w-72 truncate px-4 py-3 text-muted-foreground">{{ movement.notes || 'Sin notas' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
