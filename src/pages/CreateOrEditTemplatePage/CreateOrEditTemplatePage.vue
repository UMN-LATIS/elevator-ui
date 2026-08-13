<template>
  <AdminLayout>
    <div
      v-if="editor.isLoading.value && editor.isEditMode.value"
      class="flex justify-center items-center py-12">
      <SpinnerIcon class="w-8 h-8 animate-spin" />
      <span class="ml-2">Loading template...</span>
    </div>

    <div
      v-else-if="editor.isError.value"
      class="text-error p-4 bg-error-container rounded-md border border-outline m-8">
      Failed to load template.
    </div>

    <EditTemplateForm
      v-else
      @save="handleSave"
      @cancel="router.push({ name: 'templatesIndex' })" />

    <Teleport to="body">
      <ConfirmModal
        v-if="leaveGuard.activeConfirmation.value"
        type="warning"
        :isOpen="leaveGuard.isConfirmingLeave.value"
        :title="leaveGuard.activeConfirmation.value.title"
        :confirmLabel="leaveGuard.activeConfirmation.value.confirmLabel"
        cancelLabel="Stay"
        @confirm="leaveGuard.confirmLeave"
        @close="leaveGuard.cancelLeave">
        {{ leaveGuard.activeConfirmation.value.message }}
      </ConfirmModal>
    </Teleport>
  </AdminLayout>
</template>

<script setup lang="ts">
import { provide } from "vue";
import { useRouter } from "vue-router";
import AdminLayout from "@/layouts/AdminLayout.vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import EditTemplateForm from "./EditTemplateForm/EditTemplateForm.vue";
import {
  useTemplateEditor,
  TEMPLATE_EDITOR_KEY,
} from "./useTemplateEditor/useTemplateEditor";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import {
  UNSAVED_CHANGES_CONFIRMATION,
  useLeaveGuard,
} from "@/composables/useLeaveGuard";

const props = defineProps<{ templateId: number | null }>();

const editor = useTemplateEditor(() => props.templateId);
provide(TEMPLATE_EDITOR_KEY, editor);

const leaveGuard = useLeaveGuard([
  {
    isBlocking: editor.hasUnsavedChanges,
    confirmation: UNSAVED_CHANGES_CONFIRMATION,
  },
]);

const router = useRouter();

async function handleSave() {
  const id = await editor.save();
  // After creating a new template, replace the create route with the edit
  // route so the URL reflects the now-persisted id without adding a history entry.
  if (!props.templateId) {
    router.replace({ name: "templatesEdit", params: { id } });
  }
}
</script>
