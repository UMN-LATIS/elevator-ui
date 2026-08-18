<template>
  <AdminLayout class="all-custom-pages-page">
    <PageContent class="max-w-screen-lg">
      <PageHeader title="Custom Pages">
        <template #actions>
          <Button variant="primary" :to="{ name: 'createCustomPage' }">
            Create Page
          </Button>
        </template>
      </PageHeader>
      <Skeleton v-if="isPending" height="10rem" />
      <Notification
        v-else-if="isError"
        type="danger"
        title="Error Loading Custom Pages">
        An error occurred while loading custom pages.
      </Notification>
      <p v-else-if="!customPages?.length" class="text-lg">No pages found.</p>
      <CustomPagesTable v-else :columns="columns" :data="customPages" />
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
import { createColumns } from "./CustomPagesTableColumns";
import CustomPagesTable from "./CustomPagesTable.vue";
import Notification from "@/components/Notification/Notification.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import Button from "@/components/Button/Button.vue";

const { data: customPages, isPending, isError } = useAllCustomPagesQuery();

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

const columns = createColumns(handleDelete);
</script>
<style scoped></style>
