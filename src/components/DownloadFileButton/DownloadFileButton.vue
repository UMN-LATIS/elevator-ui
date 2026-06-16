<template>
  <IconButton
    class="download-file-button"
    title="Download File"
    @click="isOpen = true">
    <DownloadIcon />
    <span class="sr-only">Download File</span>
  </IconButton>
  <Modal
    label="File Downloads"
    :isOpen="isOpen"
    class="max-w-sm"
    @close="isOpen = false">
    <div
      v-if="isFileDownloadInfoLoading || isOriginalStatusLoading"
      class="flex items-center gap-2 p-2 text-on-surface-variant">
      <SpinnerIcon />
      <span>Loading…</span>
    </div>

    <ul
      v-else
      class="border-y border-outline-variant divide-y divide-outline-variant">
      <li
        v-for="download in donwloadableDerivatives"
        :key="download.filetype"
        class="py-1">
        <Button
          :href="download.url"
          :download="`${download.originalFilename}-${download.filetype}.${download.extension}`"
          variant="tertiary"
          class="w-full justify-between"
          @click="trackDownload(download.filetype)">
          <span>{{ download.filetype }}</span>
          <Chip>{{ download.extension }}</Chip>
        </Button>
      </li>

      <li class="py-1">
        <Button
          v-if="originalStatus?.status === 'downloadable' && originalEntry"
          :href="originalEntry.url"
          :download="originalEntry.originalFilename"
          variant="tertiary"
          class="w-full justify-between"
          @click="trackDownload('original')">
          <span>Original</span>
          <Chip v-if="originalExtension">{{ originalExtension }}</Chip>
        </Button>
        <div v-else-if="didRequestRestore">
          <Button variant="tertiary" class="w-full justify-between" disabled>
            <SpinnerIcon class="h-5 w-5" />
            Restoring Original
            <Chip v-if="originalExtension">{{ originalExtension }}</Chip>
          </Button>
          <p class="mt-1 text-xs text-on-surface-variant">
            This could take awhile.We'll email you when it's ready.
          </p>
        </div>
        <div
          v-else-if="
            originalStatus?.status === 'archived' ||
            originalStatus?.status === 'restoring'
          ">
          <!-- showing "Restore Original" button to user so that
           they can join email notification. Also, permits a re-request
           if something goes wrong. -->
          <Button
            variant="tertiary"
            class="w-full justify-between"
            @click="restoreOriginal.mutate(props.fileObjectId)">
            Restore Original
            <Chip v-if="originalExtension">{{ originalExtension }}</Chip>
          </Button>
          <p class="mt-1 text-xs text-on-surface-variant px-2">
            The original is archived. Restore it before downloading.
          </p>
        </div>

        <!-- forbidden / notFound -->
        <p
          v-else-if="
            originalStatus?.status === 'error' &&
            originalStatus.error === 'notFound'
          "
          class="text-sm text-error px-2">
          The original file is missing from storage. Please contact support.
        </p>
      </li>
    </ul>
  </Modal>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import IconButton from "@/components/IconButton/IconButton.vue";
import Button from "@/components/Button/Button.vue";
import Modal from "@/components/Modal/Modal.vue";
import Chip from "@/components/Chip/Chip.vue";
import DownloadIcon from "@/icons/DownloadIcon.vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import { fileDownloadsQuery } from "@/queries/fileDownloadsQuery";
import { originalStorageStatusQuery } from "@/queries/originalStorageStatusQuery";
import { useRestoreOriginalMutation } from "@/queries/useRestoreOriginalMutation";
import { useAnalytics } from "@/helpers/useAnalytics";

const props = defineProps<{
  fileObjectId: string;
  assetId: string;
}>();

const analytics = useAnalytics();
const isOpen = ref(false);

// computed refs, not bare getters: vue-query only unwraps refs in query keys,
// so these keep the cache key — and the restore mutation's optimistic write —
// keyed on the resolved id.
const fileObjectId = computed(() => props.fileObjectId);
const assetId = computed(() => props.assetId);

// the catalog: original + derivatives. The original's descriptor (name,
// extension, URL) lives here; its live archival state comes from the status
// query below.
const { data: fileDownloadInfo, isLoading: isFileDownloadInfoLoading } =
  useQuery({
    ...fileDownloadsQuery(fileObjectId, assetId),
    enabled: computed(() => isOpen.value),
  });

const originalEntry = computed(
  () => fileDownloadInfo.value?.find((d) => d.filetype === "original") ?? null
);
const derivatives = computed(
  () => fileDownloadInfo.value?.filter((d) => d.filetype !== "original") ?? []
);

const donwloadableDerivatives = computed(() =>
  derivatives.value.filter((d) => d.isGenerated && d.isDownloadable)
);

const originalExtension = computed(
  () => originalEntry.value?.extension ?? null
);

const { data: originalStatus, isLoading: isOriginalStatusLoading } = useQuery({
  ...originalStorageStatusQuery(fileObjectId),
  enabled: computed(() => isOpen.value),
});

const restoreOriginal = useRestoreOriginalMutation();

const didRequestRestore = computed(
  () => restoreOriginal.isPending.value || restoreOriginal.isSuccess.value
);

function trackDownload(fileType: string) {
  analytics.trackDownloadEvent({
    fileObjectId: props.fileObjectId,
    assetId: props.assetId,
    fileType,
  });
}
</script>
<style scoped></style>
