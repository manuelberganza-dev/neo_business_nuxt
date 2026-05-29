<script setup lang="ts">
import { adminResourceConfigs } from '~/utils/adminResources'

definePageMeta({
  middleware: 'permission',
  permission: 'users.read',
})
</script>

<template>
  <AdminResourcePage :config="adminResourceConfigs.users" />
</template>
