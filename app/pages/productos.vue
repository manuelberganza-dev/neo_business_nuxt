<script setup lang="ts">
import { adminResourceConfigs } from '~/utils/adminResources'

definePageMeta({
  middleware: 'permission',
  permission: 'products.read',
})
</script>

<template>
  <AdminResourcePage :config="adminResourceConfigs.products" />
</template>
