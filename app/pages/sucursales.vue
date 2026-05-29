<script setup lang="ts">
import { adminResourceConfigs } from '~/utils/adminResources'

definePageMeta({
  middleware: 'permission',
  permission: 'branches.read',
})
</script>

<template>
  <AdminResourcePage :config="adminResourceConfigs.branches" />
</template>
