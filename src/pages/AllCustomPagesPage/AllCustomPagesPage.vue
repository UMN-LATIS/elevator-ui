<template>
  <AdminLayout class="all-custom-pages-page">
    <PageContent class="max-w-screen-lg">
      <PageHeader title="Custom Pages" />
      <CustomPagesTable
        :pages="customPages ?? []"
        :status="status"
        @delete="handleDelete" />
    </PageContent>
  </AdminLayout>
</template>
<script setup lang="ts">
import AdminLayout from "@/layouts/AdminLayout.vue";
import PageContent from "@/components/PageContent/PageContent.vue";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
import { useAllCustomPagesQuery } from "@/queries/customPageQueries";
import { useDeleteCustomPageMutation } from "@/queries/customPageQueries";
import { useToastStore } from "@/stores/toastStore";
import CustomPagesTable from "./CustomPagesTable.vue";

const { data: customPages, status } = useAllCustomPagesQuery();

const deleteMutation = useDeleteCustomPageMutation();
const toastStore = useToastStore();

const handleDelete = async (pageId: number) => {
  if (!confirm("Are you sure you want to delete this page?")) {
    return;
  }

  try {
    await deleteMutation.mutateAsync(pageId);
    toastStore.addToast({
      title: "Page Deleted",
      message: "The page has been deleted successfully.",
      variant: "success",
      duration: 3000,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    toastStore.addToast({
      title: "Error",
      message: `Failed to delete page: ${message}`,
      variant: "error",
    });
  }
};
</script>
<style scoped></style>
