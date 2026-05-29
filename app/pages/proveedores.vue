<script setup lang="ts">
import { adminResourceConfigs } from '~/utils/adminResources'

definePageMeta({
  middleware: 'permission',
  permission: 'suppliers.read',
})
</script>

<template>
  <AdminResourcePage :config="adminResourceConfigs.suppliers" />
</template>
