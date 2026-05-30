<script setup lang="ts">
definePageMeta({
  middleware: 'permission',
  permission: 'reports.read',
})

await navigateTo('/', { replace: true })
</script>

<template>
  <span />
</template>
