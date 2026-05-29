<script setup lang="ts">
import { adminResourceConfigs } from '~/utils/adminResources'

definePageMeta({
  middleware: 'permission',
  permission: 'categories.read',
})
</script>

<template>
  <AdminResourcePage :config="adminResourceConfigs.categories" />
</template>
