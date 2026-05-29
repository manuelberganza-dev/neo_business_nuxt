<script setup lang="ts">
import { adminResourceConfigs } from '~/utils/adminResources'

definePageMeta({
  middleware: 'permission',
  permission: 'cash_registers.read',
})
</script>

<template>
  <AdminResourcePage :config="adminResourceConfigs.registers" />
</template>
