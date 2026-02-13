<template>
  <DefaultLayout class="all-custom-pages-page">
    <div class="max-w-screen-xl w-full py-10 px-4 mx-auto">
      <div class="flex justify-between items-center">
        <h1 class="text-4xl font-bold my-8">Custom Pages</h1>
      </div>
      <Transition name="fade" mode="out-in">
        <Skeleton v-if="isLoading" height="10rem" />
        <Notification
          v-else-if="isError"
          type="danger"
          title="Error Loading Custom Pages">
          An error occurred while loading custom pages.
        </Notification>
        <p v-else-if="!customPages?.length" class="text-lg">No pages found.</p>
        <CustomPagesTable v-else :columns="columns" :data="customPages" />
      </Transition>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useAllCustomPagesQuery } from "@/queries/useAllCustomPagesQuery";
import { useDeleteCustomPageMutation } from "@/queries/useCustomPageQuery";
import { useToastStore } from "@/stores/toastStore";
import { createColumns } from "./CustomPagesTableColumns";
import CustomPagesTable from "./CustomPagesTable.vue";
import Notification from "@/components/Notification/Notification.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";

const { data: customPages, isLoading, isError } = useAllCustomPagesQuery();

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
