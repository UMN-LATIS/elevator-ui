<template>
  <DefaultLayout class="all-templates-page">
    <div class="max-w-screen-xl w-full py-10 px-4 mx-auto">
      <div class="flex justify-between items-center">
        <h1 class="text-4xl font-bold my-8">Templates</h1>
        <Button
          variant="primary"
          :href="`${config.instance.base.url}/templates/edit`">
          Create Template
        </Button>
      </div>
      <Skeleton v-if="isPending" height="10rem" />
      <Notification
        v-else-if="isError"
        type="danger"
        title="Error Loading Templates">
        An error occurred while loading templates.
      </Notification>
      <p v-else-if="!templates?.length" class="text-lg">No templates found.</p>
      <TemplatesTable v-else :columns="columns" :data="templates" />
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
import {
  useAllTemplatesQuery,
  useDeleteTemplateMutation,
} from "@/queries/useTemplateQuery";
import config from "@/config";

const { data: templates, isPending, isError } = useAllTemplatesQuery();
const { mutateAsync: deleteTemplate } = useDeleteTemplateMutation();

const toastStore = useToastStore();

const handleDelete = async (templateId: number) => {
  const template = templates.value?.find((t) => t.id === templateId);

  if (!template) {
    toastStore.addToast({
      title: "Error",
      message: "Template not found.",
      variant: "error",
    });
    return;
  }

  if (
    !confirm(`Are you sure you want to delete template "${template.name}"?`)
  ) {
    return;
  }

  try {
    await deleteTemplate(templateId);
    toastStore.addToast({
      title: "Template Deleted",
      message: `The template "${template.name}" has been deleted successfully.`,
      variant: "success",
      duration: 3000,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    toastStore.addToast({
      title: "Error",
      message: `Failed to delete template: ${message}`,
      variant: "error",
    });
  }
};

const columns = createColumns(handleDelete);
</script>
<style scoped></style>
