<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '~/lib/utils'

const props = withDefaults(defineProps<{
  variant?: 'default' | 'secondary' | 'ghost' | 'outline' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  type?: 'button' | 'submit' | 'reset'
  class?: string
}>(), {
  variant: 'default',
  size: 'md',
  type: 'button',
})

const classes = computed(() => cn(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/92',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/82',
    ghost: 'text-foreground hover:bg-muted',
    outline: 'border bg-card text-foreground hover:bg-muted',
    destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/92',
  }[props.variant],
  {
    sm: 'h-8 px-3',
    md: 'h-10 px-4',
    lg: 'h-11 px-5',
    icon: 'size-10',
  }[props.size],
  props.class,
))
</script>

<template>
  <button :type="type" :class="classes">
    <slot />
  </button>
</template>
