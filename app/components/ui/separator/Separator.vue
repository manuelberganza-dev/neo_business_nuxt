<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '~/lib/utils'

const props = withDefaults(defineProps<{
  orientation?: 'horizontal' | 'vertical'
  class?: string
}>(), {
  orientation: 'horizontal',
})

const classes = computed(() => cn(
  'shrink-0 bg-border',
  props.orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full',
  props.class,
))
</script>

<template>
  <div role="separator" :aria-orientation="orientation" :class="classes" />
</template>
