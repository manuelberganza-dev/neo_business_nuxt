<script setup lang="ts">
import { adminResourceConfigs } from '~/utils/adminResources'

definePageMeta({
  middleware: 'permission',
  permission: 'brands.read',
})
</script>

<template>
  <AdminResourcePage :config="adminResourceConfigs.brands" />
</template>
