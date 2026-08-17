<template>
  <AdminLayout class="all-templates-page">
    <PageContent class="max-w-screen-lg">
      <PageHeader title="Templates">
        <template #actions>
          <Button variant="primary" to="/templates/edit">
            Create Template
          </Button>
        </template>
      </PageHeader>
      <Skeleton v-if="isPending" height="10rem" />
      <Notification
        v-else-if="isError"
        type="danger"
        title="Error Loading Templates">
        An error occurred while loading templates.
      </Notification>
      <p v-else-if="!templates?.length" class="text-lg">No templates found.</p>
      <TemplatesTable v-else :columns="columns" :data="templates" />

      <ConfirmModal
        :isOpen="Boolean(templatePendingDuplicate)"
        title="Duplicate Template"
        confirmLabel="Duplicate"
        @close="templatePendingDuplicate = null"
        @confirm="confirmDuplicate">
        <p>
          Create a copy of
          <b>{{ templatePendingDuplicate?.name }}</b>
          ?
        </p>
      </ConfirmModal>

      <ConfirmModal
        :isOpen="Boolean(templatePendingReindex)"
        title="Reindex Template"
        type="warning"
        confirmLabel="Reindex"
        @close="templatePendingReindex = null"
        @confirm="confirmReindex">
        <p>
          Reindex
          <b>{{ templatePendingReindex?.name }}</b>
          and any related templates?
        </p>
      </ConfirmModal>

      <ConfirmModal
        :isOpen="Boolean(templatePendingDelete)"
        title="Delete Template"
        type="danger"
        confirmLabel="Delete"
        @close="templatePendingDelete = null"
        @confirm="confirmDelete">
        <p>
          Are you sure you want to delete
          <b>{{ templatePendingDelete?.name }}</b>
          ? This action cannot be undone.
        </p>
      </ConfirmModal>
    </PageContent>
  </AdminLayout>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import AdminLayout from "@/layouts/AdminLayout.vue";
import PageContent from "@/components/PageContent/PageContent.vue";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
import { useToastStore } from "@/stores/toastStore";
import { createColumns } from "./TemplatesTableColumns";
import TemplatesTable from "./TemplatesTable.vue";
import Notification from "@/components/Notification/Notification.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import Button from "@/components/Button/Button.vue";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import {
  useAllTemplatesQuery,
  useCopyTemplateMutation,
  useDeleteTemplateMutation,
  useReindexTemplateMutation,
} from "@/queries/templateQueries";
import type { TemplateSummary } from "@/types";

const { data: templates, isPending, isError } = useAllTemplatesQuery();

const router = useRouter();
const toastStore = useToastStore();

const openEdit = (template: TemplateSummary): void => {
  router.push({ name: "templatesEdit", params: { id: template.id } });
};

const duplicateMutation = useCopyTemplateMutation();
const templatePendingDuplicate = ref<TemplateSummary | null>(null);

const askToDuplicateTemplate = (template: TemplateSummary): void => {
  templatePendingDuplicate.value = template;
};

const confirmDuplicate = (): void => {
  const template = templatePendingDuplicate.value;
  if (!template) return;
  duplicateMutation.mutate(template.id, {
    onSuccess: () =>
      toastStore.addToast({
        title: "Template Duplicated",
        message: `A copy of "${template.name}" was created.`,
        variant: "success",
        duration: 3000,
      }),
    onError: (error) =>
      toastStore.addToast({
        title: "Duplicate Failed",
        message: `Failed to duplicate template: ${error.message}`,
        variant: "error",
      }),
  });
  templatePendingDuplicate.value = null;
};

const reindexMutation = useReindexTemplateMutation();
const templatePendingReindex = ref<TemplateSummary | null>(null);

const askToReindexTemplate = (template: TemplateSummary): void => {
  templatePendingReindex.value = template;
};

const confirmReindex = (): void => {
  const template = templatePendingReindex.value;
  if (!template) return;
  reindexMutation.mutate(template.id, {
    onSuccess: () =>
      toastStore.addToast({
        title: "Reindex Started",
        message: `Reindexing "${template.name}" and any related templates.`,
        variant: "success",
        duration: 3000,
      }),
    onError: (error) =>
      toastStore.addToast({
        title: "Reindex Failed",
        message: `Failed to reindex template: ${error.message}`,
        variant: "error",
      }),
  });
  templatePendingReindex.value = null;
};

const deleteMutation = useDeleteTemplateMutation();
const templatePendingDelete = ref<TemplateSummary | null>(null);

const askToDeleteTemplate = (template: TemplateSummary): void => {
  templatePendingDelete.value = template;
};

const confirmDelete = (): void => {
  const template = templatePendingDelete.value;
  if (!template) return;
  deleteMutation.mutate(template.id, {
    onSuccess: () =>
      toastStore.addToast({
        title: "Template Deleted",
        message: `The template "${template.name}" has been deleted successfully.`,
        variant: "success",
        duration: 3000,
      }),
    onError: (error) =>
      toastStore.addToast({
        title: "Delete Failed",
        message: `Failed to delete template: ${error.message}`,
        variant: "error",
      }),
  });
  templatePendingDelete.value = null;
};

const columns = createColumns({
  onEdit: openEdit,
  onDuplicate: askToDuplicateTemplate,
  onReindex: askToReindexTemplate,
  onDelete: askToDeleteTemplate,
});
</script>
<style scoped></style>
