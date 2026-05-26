<template>
  <AdminLayout>
    <PageContent>
      <PageHeader
        title="Permissions"
        description="Baseline access across this Elevator instance. Rules are additive — a user gets the highest grant that matches them." />

      <div
        class="border border-dashed border-outline-variant rounded-md p-10 text-center text-sm text-on-surface-variant">
        Permissions admin coming soon.
      </div>
    </PageContent>
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from "@/layouts/AdminLayout.vue";
import PageContent from "@/components/PageContent/PageContent.vue";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
</script>
