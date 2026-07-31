<template>
  <AdminLayout>
    <FormPageLayout
      :title="isNewPage ? 'Create Page' : 'Edit Page'"
      :backTo="{ name: 'customPagesIndex' }"
      backLabel="Custom Pages">
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <SpinnerIcon class="w-8 h-8 animate-spin" />
        <span class="ml-2">Loading page...</span>
      </div>

      <div
        v-else-if="isError"
        class="text-red-600 p-4 bg-red-50 rounded-md border border-red-200">
        Failed to load page.
      </div>

      <form v-else id="edit-page-form" @submit.prevent="handleSave">
        <FormSection id="content" title="Page Content" class="block my-6">
          <InputGroup
            v-model="form.title"
            label="Title"
            required
            placeholder="Page title" />
          <PageBodyEditor
            :html="bodyHtml"
            :markupStyle="markupStyle"
            :markupLostBySimplifying="markupLostBySimplifying"
            label="Body"
            @update:html="editBody"
            @chooseMarkupStyle="chooseMarkupStyle"
            @undoSimplifying="undoSimplifying" />
        </FormSection>

        <FormSection id="options" title="Options" class="block my-6">
          <SelectGroup
            :modelValue="form.parent ?? 0"
            :options="parentPageOptions"
            label="Parent Page"
            @update:modelValue="form.parent = $event === 0 ? null : $event" />

          <ToggleGroup v-model="form.includeInHeader" label="Include in Menu" />
        </FormSection>
      </form>

      <template #sidebar-actions>
        <div class="grid grid-cols-2 gap-2 items-center grid-flow-row-dense">
          <Button
            type="submit"
            form="edit-page-form"
            variant="primary"
            :class="['col-span-full']"
            :disabled="isSaving">
            <SpinnerIcon v-if="isSaving" class="w-4 h-4 animate-spin" />
            {{ isSaving ? "Saving..." : "Save" }}
          </Button>
          <Button
            v-if="!isNewPage"
            variant="secondary"
            :to="`/page/view/${pageId}`">
            View
          </Button>
          <Button
            v-if="!isNewPage"
            variant="danger"
            :disabled="isDeleting"
            @click="handleDelete">
            <SpinnerIcon v-if="isDeleting" class="w-4 h-4 animate-spin" />
            {{ isDeleting ? "Deleting..." : "Delete" }}
          </Button>
        </div>
      </template>

      <template #sidebar-nav>
        <FormToc :sections="tocSections" class="hidden lg:block" />
      </template>
    </FormPageLayout>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, watch, computed, toRef } from "vue";
import { useRouter } from "vue-router";
import FormPageLayout from "@/layouts/FormPageLayout.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import PageBodyEditor from "./PageBodyEditor.vue";
import { usePageBodyEditor } from "./usePageBodyEditor";
import { toSaveablePageBody } from "./toSaveablePageBody";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import ToggleGroup from "@/components/ToggleGroup/ToggleGroup.vue";
import Button from "@/components/Button/Button.vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import { FormSection, FormToc } from "@/components/Form";
import { useToastStore } from "@/stores/toastStore";
import {
  useCustomPageQuery,
  useSaveCustomPageMutation,
  useDeleteCustomPageMutation,
} from "@/queries/useCustomPageQuery";
import { useAllCustomPagesQuery } from "@/queries/useAllCustomPagesQuery";
import type { SelectOption, TocItem } from "@/types";
import AdminLayout from "@/layouts/AdminLayout.vue";

const props = defineProps<{
  pageId: number | null;
}>();

const router = useRouter();
const toastStore = useToastStore();

const isNewPage = computed(() => props.pageId === null);
const pageIdRef = toRef(props, "pageId");

const {
  data: pageData,
  isLoading: isLoadingPage,
  isError,
} = useCustomPageQuery(pageIdRef, {
  enabled: computed(() => !isNewPage.value),
});

const { data: allPages, isLoading: isLoadingPages } = useAllCustomPagesQuery();

const isLoading = computed(() => isLoadingPage.value || isLoadingPages.value);

const saveMutation = useSaveCustomPageMutation();
const isSaving = computed(() => saveMutation.isPending.value);

const deleteMutation = useDeleteCustomPageMutation();
const isDeleting = computed(() => deleteMutation.isPending.value);

interface FormState {
  title: string;
  parent: number | null;
  includeInHeader: boolean;
}

const getDefaultForm = (): FormState => ({
  title: "",
  parent: null,
  includeInHeader: false,
});

const form = ref<FormState>(getDefaultForm());

// The body lives here rather than on the form: it is the only field an
// editor rewrites, so every way it can change is named in one place.
const {
  html: bodyHtml,
  markupStyle,
  markupLostBySimplifying,
  loadStoredBody,
  editBody,
  chooseMarkupStyle,
  undoSimplifying,
} = usePageBodyEditor();

watch(
  pageData,
  (newData) => {
    if (newData) {
      form.value = {
        title: newData.title,
        parent: newData.parentId,
        includeInHeader: newData.includeInHeader,
      };
      loadStoredBody(newData.body);
    }
  },
  { immediate: true }
);

const parentPageOptions = computed((): SelectOption<number>[] => {
  const noneOption: SelectOption<number> = { id: 0, label: "None" };
  const pages = allPages.value ?? [];

  const pageOptions: SelectOption<number>[] = pages
    .filter((p) => p.id !== props.pageId)
    .map((p) => ({ id: p.id, label: p.title }));

  return [noneOption, ...pageOptions];
});

const tocSections: TocItem[] = [
  { id: "content", label: "Page Content" },
  { id: "options", label: "Options" },
];

async function handleSave() {
  if (!form.value.title.trim()) {
    toastStore.addToast({
      title: "Validation Error",
      message: "Title is required",
      variant: "error",
    });
    return;
  }

  // A body the admin never changed goes back exactly as it arrived, so
  // opening a page and pressing Save cannot alter what is stored.
  const storedBody = pageData.value?.body;
  const bodyToSave =
    bodyHtml.value === storedBody
      ? storedBody
      : toSaveablePageBody(bodyHtml.value);

  try {
    await saveMutation.mutateAsync(
      {
        id: props.pageId ?? undefined,
        title: form.value.title,
        body: bodyToSave,
        parent: form.value.parent,
        includeInHeader: form.value.includeInHeader,
      },
      {
        onSuccess: () => {
          toastStore.addToast({
            title: "Saved",
            message: isNewPage.value
              ? "Page created successfully."
              : "Page saved successfully.",
            variant: "success",
            duration: 3000,
          });
          router.push({ name: "customPagesIndex" });
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    toastStore.addToast({
      title: "Error",
      message: `Failed to save page: ${message}`,
      variant: "error",
    });
  }
}

async function handleDelete() {
  if (!props.pageId) return;

  if (!confirm("Are you sure you want to delete this page?")) {
    return;
  }

  try {
    await deleteMutation.mutateAsync(props.pageId);
    toastStore.addToast({
      title: "Page Deleted",
      message: "The page has been deleted successfully.",
      variant: "success",
      duration: 3000,
    });
    router.push({ name: "customPagesIndex" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    toastStore.addToast({
      title: "Error",
      message: `Failed to delete page: ${message}`,
      variant: "error",
    });
  }
}
</script>
