<script setup lang="ts">
import { adminResourceConfigs } from '~/utils/adminResources'

definePageMeta({
  middleware: 'permission',
  permission: 'payment_methods.read',
})
</script>

<template>
  <AdminResourcePage :config="adminResourceConfigs.paymentMethods" />
</template>
