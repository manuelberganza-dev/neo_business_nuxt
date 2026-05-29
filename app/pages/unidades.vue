<script setup lang="ts">
import { adminResourceConfigs } from '~/utils/adminResources'

definePageMeta({
  middleware: 'permission',
  permission: 'units.read',
})
</script>

<template>
  <AdminResourcePage :config="adminResourceConfigs.units" />
</template>
