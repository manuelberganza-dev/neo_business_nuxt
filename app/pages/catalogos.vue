<script setup lang="ts">
definePageMeta({
  middleware: 'permission',
  permission: 'products.read',
})
</script>

<template>
  <AdminCatalogOverview />
</template>
