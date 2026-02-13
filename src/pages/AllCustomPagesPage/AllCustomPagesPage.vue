<template>
  <DefaultLayout class="all-custom-pages-page">
    <div class="max-w-screen-xl py-10 px-4 mx-auto">
      <div class="flex justify-between items-center">
        <h1 class="text-4xl font-bold my-8">Custom Pages</h1>
        <RouterLink :to="{ name: 'createCustomPage' }">
          <Button variant="primary">Create New Page</Button>
        </RouterLink>
      </div>
      <p v-if="!customPages.length" class="text-lg">No pages found.</p>
      <CustomPagesTable v-else :columns="columns" :data="customPages" />
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import Button from "@/components/Button/Button.vue";
import { useAllCustomPagesQuery } from "@/queries/useAllCustomPagesQuery";
import { useDeleteCustomPageMutation } from "@/queries/useCustomPageQuery";
import { useToastStore } from "@/stores/toastStore";
import { createColumns } from "./CustomPagesTableColumns";
import CustomPagesTable from "./CustomPagesTable.vue";

const { data: customPages } = useAllCustomPagesQuery();
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
