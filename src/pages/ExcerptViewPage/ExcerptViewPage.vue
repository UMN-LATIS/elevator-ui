<template>
  <NoScrollLayout class="excerpt-view-page">
    <template #custom-header>
      <CustomAppHeader v-if="instanceStore.customHeaderMode == 1" />
    </template>
    <Transition name="fade">
      <div
        v-if="excerpt"
        class="p-4 lg:p-8 mx-auto flex-1 w-full max-w-screen-xl">
        <header class="flex justify-between items-baseline my-4 flex-wrap">
          <h1 class="text-4xl font-bold flex-1">
            {{ excerpt.label || `Excerpt ${excerpt.id}` }}
          </h1>
          <Button
            variant="tertiary"
            :to="`/asset/viewAsset/${excerpt.assetId}`">
            View Asset
          </Button>
        </header>

        <ExcerptableIframe
          :fileObjectId="excerpt.fileObjectId"
          :startTime="excerpt.startTime"
          :endTime="excerpt.endTime" />
        <div class="flex justify-between p-1 items-center flex-wrap">
          <div class="inline-flex gap-2 items-center">
            <span class="font-bold text-xs uppercase">Time</span>
            <span class="text-sm">
              {{ secondsToTimeString(excerpt.startTime) }} -
              {{ secondsToTimeString(excerpt.endTime) }}
            </span>
          </div>
          <div>
            <MoreFileInfoButton :fileObjectId="excerpt.fileObjectId" />
            <DownloadFileButton
              :assetId="excerpt.assetId"
              :fileObjectId="excerpt.fileObjectId" />
            <ShareButton class="share-file-button" :url="shareUrl" />
          </div>
        </div>
      </div>
    </Transition>
  </NoScrollLayout>
</template>
<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import api from "@/api";
import { ApiGetExcerptResponse } from "@/types";
import NoScrollLayout from "@/layouts/NoScrollLayout.vue";
import { secondsToTimeString } from "@/helpers/excerptHelpers";
import MoreFileInfoButton from "@/components/MoreFileInfoButton/MoreFileInfoButton.vue";
import DownloadFileButton from "@/components/DownloadFileButton/DownloadFileButton.vue";
import Button from "@/components/Button/Button.vue";
import ShareFileButton from "@/components/ShareFileButton/ShareFileButton.vue";
import ExcerptableIframe from "@/components/ExcerptableIframe/ExcerptableIframe.vue";
import ShareButton from "@/components/ShareButton/ShareButton.vue";
import config from "@/config";
import { useInstanceStore } from "@/stores/instanceStore";
import CustomAppHeader from "@/components/CustomAppHeader/CustomAppHeader.vue";

const instanceStore = useInstanceStore();
const props = defineProps<{
  excerptId: number;
}>();

const excerpt = ref<ApiGetExcerptResponse | null>(null);

const shareUrl = computed(
  () => `${config.instance.base.url}/asset/viewExcerpt/${props.excerptId}/true`
);

onMounted(async () => {
  excerpt.value = await api.getExcerpt(props.excerptId);
});
</script>
<style scoped></style>
