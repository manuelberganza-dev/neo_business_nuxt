<script setup lang="ts">
import { adminResourceConfigs } from '~/utils/adminResources'

definePageMeta({
  middleware: 'permission',
  permission: 'customers.read',
})
</script>

<template>
  <AdminResourcePage :config="adminResourceConfigs.customers" />
</template>
