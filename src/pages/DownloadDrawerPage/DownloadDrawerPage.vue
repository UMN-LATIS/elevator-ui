<template>
  <DefaultLayout>
    <div class="max-w-md mx-auto py-8 px-4 text-center">
      <template v-if="!isPageReady">
        <SpinnerIcon class="!w-5 !h-5 animate-spin" />
      </template>
      <template v-else-if="archiveStatus?.status === 'completed'">
        <h1 class="text-2xl my-8">Your Download is Ready</h1>
        <p>
          <Button
            variant="primary"
            @click="filedownloader.downloadFile(archiveStatus.url)"
          >
            Download
          </Button>
        </p>
      </template>
      <template v-else>
        <h1 class="text-3xl my-6">Working on it!</h1>
        <p>
          We're getting your drawer ready. We'll send you an email when your
          link is all set.
        </p>

        <Button :to="`/drawers/viewDrawer/${drawerId}`" class="my-6">
          &larr; Back to Drawer
        </Button>
      </template>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { ApiStartDrawerDownloadResponse } from "@/types";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import Button from "@/components/Button/Button.vue";
import { onMounted, ref } from "vue";
import { useDrawerStore } from "@/stores/drawerStore";
import { useFileDownloader } from "@/helpers/useFileDownloader";
import { SpinnerIcon } from "@/icons";

const props = defineProps<{
  drawerId: number;
}>();

const isPageReady = ref(false);
const drawerStore = useDrawerStore();
const archiveStatus = ref<ApiStartDrawerDownloadResponse | null>(null);
const filedownloader = useFileDownloader();

onMounted(async () => {
  archiveStatus.value = await drawerStore.downloadDrawer(props.drawerId);
  isPageReady.value = true;
});
</script>
<style scoped></style>
