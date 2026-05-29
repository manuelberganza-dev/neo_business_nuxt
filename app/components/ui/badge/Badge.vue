<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '~/lib/utils'

const props = withDefaults(defineProps<{
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'muted'
  class?: string
}>(), {
  variant: 'default',
})

const classes = computed(() => cn(
  'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
  {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/12 text-success',
    warning: 'bg-warning/12 text-warning',
    danger: 'bg-destructive/12 text-destructive',
    muted: 'bg-muted text-muted-foreground',
  }[props.variant],
  props.class,
))
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
