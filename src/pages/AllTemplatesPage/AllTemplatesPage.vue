<template>
  <DefaultLayout class="all-templates-page">
    <div class="max-w-screen-xl w-full py-10 px-4 mx-auto">
      <div class="flex justify-between items-center">
        <h1 class="text-4xl font-bold my-8">Templates</h1>
        <!-- <Button variant="primary" :to="{ name: 'createTemplate' }">
          Create Template
        </Button> -->
      </div>
      <Transition name="fade" mode="out-in">
        <Skeleton v-if="isLoading" height="10rem" />
        <Notification
          v-else-if="isError"
          type="danger"
          title="Error Loading Custom Pages">
          An error occurred while loading templates.
        </Notification>
        <p v-else-if="!templates?.length" class="text-lg">No pages found.</p>
        <TemplatesTable v-else :columns="columns" :data="templates" />
      </Transition>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useToastStore } from "@/stores/toastStore";
import { createColumns } from "./TemplatesTableColumns";
import TemplatesTable from "./TemplatesTable.vue";
import Notification from "@/components/Notification/Notification.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import Button from "@/components/Button/Button.vue";
import { useAllTemplatesQuery } from "@/queries/useTemplateQuery";

const { data: templates, isLoading, isError } = useAllTemplatesQuery();

// const deleteMutation = useDeleteCustomPageMutation();
const toastStore = useToastStore();

const handleDelete = async (pageId: number) => {
  if (!confirm("Are you sure you want to delete this page?")) {
    return;
  }

  // try {
  //   await deleteMutation.mutateAsync(pageId);
  //   toastStore.addToast({
  //     title: "Page Deleted",
  //     message: "The page has been deleted successfully.",
  //     variant: "success",
  //     duration: 3000,
  //   });
  // } catch (error) {
  //   const message =
  //     error instanceof Error ? error.message : "Unknown error occurred";
  //   toastStore.addToast({
  //     title: "Error",
  //     message: `Failed to delete page: ${message}`,
  //     variant: "error",
  //   });
  // }
};

const columns = createColumns(handleDelete);
</script>
<style scoped></style>
