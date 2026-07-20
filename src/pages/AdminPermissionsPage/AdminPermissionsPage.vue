<template>
  <AdminLayout>
    <PageContent class="max-w-screen-lg">
      <PageHeader
        title="Permissions"
        description="Grant access to any collection in this instance" />
      <PermissionsTable />
    </PageContent>
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from "@/layouts/AdminLayout.vue";
import PageContent from "@/components/PageContent/PageContent.vue";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
import PermissionsTable from "./PermissionsTable.vue";
</script>
