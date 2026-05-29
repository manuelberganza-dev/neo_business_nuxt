<script setup lang="ts">
import { adminResourceConfigs } from '~/utils/adminResources'

definePageMeta({
  middleware: 'permission',
  permission: 'warehouses.read',
})
</script>

<template>
  <AdminResourcePage :config="adminResourceConfigs.warehouses" />
</template>
