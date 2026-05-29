<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  title: string
  value: string
  helper: string
  tone: 'blue' | 'green' | 'amber' | 'rose'
  icon: Component
}>()

const toneClasses = {
  blue: 'bg-primary/10 text-primary',
  green: 'bg-success/12 text-success',
  amber: 'bg-warning/12 text-warning',
  rose: 'bg-destructive/12 text-destructive',
}
</script>

<template>
  <UiCard class="p-4">
    <div class="flex items-start gap-3">
      <div :class="['flex size-10 shrink-0 items-center justify-center rounded-md', toneClasses[tone]]">
        <component :is="icon" class="size-5" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <p class="text-sm text-muted-foreground">{{ title }}</p>
        <p class="mt-1 text-2xl font-semibold tracking-normal text-foreground">{{ value }}</p>
        <p class="mt-1 text-xs text-muted-foreground">{{ helper }}</p>
      </div>
    </div>
  </UiCard>
</template>
