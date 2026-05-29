<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '~/lib/utils'

const model = defineModel<string | number>()

const props = defineProps<{
  class?: string
  placeholder?: string
  type?: string
  ariaLabel?: string
}>()

const classes = computed(() => cn(
  'h-10 w-full rounded-md border bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
  props.class,
))
</script>

<template>
  <input
    v-model="model"
    :type="type ?? 'text'"
    :placeholder="placeholder"
    :aria-label="ariaLabel ?? placeholder"
    :class="classes"
  >
</template>
