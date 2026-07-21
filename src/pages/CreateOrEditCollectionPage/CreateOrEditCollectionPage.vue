<template>
  <AdminLayout>
    <PageContent class="max-w-screen-md">
      <PageHeader
        :title="
          collectionId === null ? 'Create Collection' : 'Edit Collection'
        " />

      <div
        v-if="isEditMode && isLoadingCollection"
        class="flex justify-center items-center py-12">
        <SpinnerIcon class="w-8 h-8 animate-spin" />
        <span class="ml-2">Loading collection...</span>
      </div>

      <!-- only when there's no data to edit, a failed background
           refetch must not hide the form mid-edit -->
      <div
        v-else-if="isEditMode && isLoadError && !collectionDetail"
        class="text-error p-4 bg-error-container rounded-md border border-outline mt-4">
        Failed to load collection.
      </div>

      <form
        v-else
        class="mt-4 flex flex-col gap-6"
        @submit.prevent="handleSave">
        <InputGroup
          v-model="form.title"
          label="Title"
          required
          placeholder="Collection title" />

        <SelectGroup
          v-model="parentSelection"
          label="Parent"
          :options="parentOptions" />

        <ToggleGroup v-model="form.showInBrowse" label="Show in Browse" />

        <div class="flex flex-col gap-1">
          <!-- span, not label: TextEditor renders no focusable control
               to associate a label with -->
          <span class="text-xs uppercase font-medium text-on-surface">
            Description
          </span>
          <TextEditor v-model="form.description" />
        </div>

        <InputGroup
          v-model="form.previewImageId"
          label="Preview Image Asset ID"
          placeholder="Asset ID shown on the browse page" />

        <Accordion type="single" collapsible>
          <AccordionItem value="bucket">
            <AccordionTrigger>
              <span class="text-sm font-medium">Bucket Settings</span>
              <span
                class="ml-auto text-xs text-on-surface-variant font-mono truncate max-w-40">
                {{ form.bucket || "Instance default" }}
              </span>
            </AccordionTrigger>
            <AccordionContent class="flex flex-col gap-4">
              <div class="grid sm:grid-cols-2 gap-4">
                <InputGroup
                  v-model="form.bucket"
                  label="Bucket"
                  :placeholder="s3Placeholder" />
                <InputGroup
                  v-model="form.bucketRegion"
                  label="Bucket Region"
                  :placeholder="s3Placeholder" />
              </div>
              <InputGroup
                v-model="form.s3Key"
                label="S3 Key"
                :placeholder="s3Placeholder" />
              <InputGroup
                v-model="form.s3Secret"
                label="S3 Secret"
                :type="isS3SecretRevealed ? 'text' : 'password'"
                :placeholder="s3Placeholder">
                <template #append>
                  <button
                    type="button"
                    class="p-1.5 text-on-surface-variant hover:text-on-surface focus:outline-none"
                    :aria-label="
                      isS3SecretRevealed ? 'Hide S3 secret' : 'Reveal S3 secret'
                    "
                    @click="isS3SecretRevealed = !isS3SecretRevealed">
                    <EyeIcon v-if="isS3SecretRevealed" class="w-5 h-5" />
                    <EyeOffIcon v-else class="w-5 h-5" />
                  </button>
                </template>
              </InputGroup>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div class="flex justify-end gap-2">
          <Button variant="tertiary" :to="{ name: 'adminCollections' }">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            :disabled="isSaving || !form.title.trim()">
            <LoaderCircleIcon v-if="isSaving" class="size-4 animate-spin" />
            {{ collectionId === null ? "Create Collection" : "Save Changes" }}
          </Button>
        </div>
      </form>
    </PageContent>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import { LoaderCircleIcon } from "lucide-vue-next";
import AdminLayout from "@/layouts/AdminLayout.vue";
import PageContent from "@/components/PageContent/PageContent.vue";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
import Button from "@/components/Button/Button.vue";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import ToggleGroup from "@/components/ToggleGroup/ToggleGroup.vue";
import TextEditor from "@/components/TextEditor/TextEditor.vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import EyeIcon from "@/icons/EyeIcon.vue";
import EyeOffIcon from "@/icons/EyeOffIcon.vue";
import type { SaveCollectionPayload } from "@/api/fetchers";
import type { AdminCollectionDetail, SelectOption } from "@/types";
import {
  adminCollectionQuery,
  adminCollectionsQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
} from "../AdminCollectionsPage/adminCollectionQueries";
import { collectDescendantIds } from "./collectDescendantIds";

const props = defineProps<{
  collectionId: number | null;
}>();

const router = useRouter();

const isEditMode = computed(() => props.collectionId !== null);

// the full collection list feeds the parent select
const { data: collections } = useQuery(adminCollectionsQuery());

const {
  data: collectionDetail,
  isLoading: isLoadingCollection,
  isError: isLoadError,
} = useQuery(
  computed(() => ({
    ...adminCollectionQuery(props.collectionId ?? 0),
    enabled: props.collectionId !== null,
  }))
);

function makeEmptyCollectionForm(): SaveCollectionPayload {
  return {
    title: "",
    parentId: null,
    // legacy parity: new collections default to browseable
    showInBrowse: true,
    description: "",
    previewImageId: "",
    bucket: "",
    bucketRegion: "",
    s3Key: "",
    s3Secret: "",
  };
}

const form = ref<SaveCollectionPayload>(makeEmptyCollectionForm());

function toSaveCollectionPayload(
  detail: AdminCollectionDetail
): SaveCollectionPayload {
  return {
    title: detail.title,
    parentId: detail.parentId,
    showInBrowse: detail.showInBrowse,
    description: detail.description ?? "",
    previewImageId: detail.previewImageId ?? "",
    bucket: detail.bucket ?? "",
    bucketRegion: detail.bucketRegion ?? "",
    s3Key: detail.s3Key ?? "",
    s3Secret: detail.s3Secret ?? "",
  };
}

// Router reuses this component across create/edit routes, so the form
// re-seeds whenever the target collection changes. Without this a
// previous collection's edits would linger on the next one.
const hasHydratedForm = ref(false);
watch(
  () => props.collectionId,
  () => {
    hasHydratedForm.value = false;
    form.value = makeEmptyCollectionForm();
    // never carry one collection's revealed secret to the next
    isS3SecretRevealed.value = false;
  }
);

// Hydrate exactly once per collection. A background refetch must not
// clobber in-progress edits.
watch(
  collectionDetail,
  (detail) => {
    if (props.collectionId === null || !detail || hasHydratedForm.value) {
      return;
    }
    hasHydratedForm.value = true;
    form.value = toSaveCollectionPayload(detail);
  },
  // immediate: a cached detail can already be present on mount
  { immediate: true }
);

// blank S3 fields fall back to the instance defaults on create
const s3Placeholder = computed(() =>
  isEditMode.value ? "" : "Instance default"
);

const isS3SecretRevealed = ref(false);

const TOP_LEVEL_OPTION_ID = 0;

// The select needs a non-null value, so the top-level choice uses the
// API's 0 sentinel and converts back to null on the way out.
const parentSelection = computed<number>({
  get: () => form.value.parentId ?? TOP_LEVEL_OPTION_ID,
  set: (selectedId) => {
    form.value.parentId =
      selectedId === TOP_LEVEL_OPTION_ID ? null : selectedId;
  },
});

const parentOptions = computed((): SelectOption<number>[] => {
  const list = collections.value ?? [];

  // the collection itself and its descendants would create a cycle
  const disabledIds = new Set<number>();
  if (props.collectionId !== null) {
    disabledIds.add(props.collectionId);
    for (const descendantId of collectDescendantIds(list, props.collectionId)) {
      disabledIds.add(descendantId);
    }
  }

  return [
    { id: TOP_LEVEL_OPTION_ID, label: "None (top level)" },
    ...list.map((collection) => ({
      id: collection.id,
      label: collection.title,
      disabled: disabledIds.has(collection.id),
    })),
  ];
});

const createCollectionMutation = useCreateCollectionMutation();
const updateCollectionMutation = useUpdateCollectionMutation();
const isSaving = computed(
  () =>
    createCollectionMutation.isPending.value ||
    updateCollectionMutation.isPending.value
);

function handleSave() {
  const goToCollectionsIndex = () => router.push({ name: "adminCollections" });

  if (props.collectionId === null) {
    createCollectionMutation.mutate(
      { ...form.value },
      { onSuccess: goToCollectionsIndex }
    );
    return;
  }

  updateCollectionMutation.mutate(
    { collectionId: props.collectionId, collection: { ...form.value } },
    { onSuccess: goToCollectionsIndex }
  );
}
</script>
