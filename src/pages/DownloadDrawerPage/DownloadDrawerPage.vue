<template>
  <DefaultLayout class="download-drawer-page">
    <div class="max-w-md mx-auto py-8 px-4 text-center">
      <template v-if="!isPageReady">
        <SpinnerIcon class="!w-5 !h-5 animate-spin" />
      </template>
      <template v-else-if="archiveStatus?.status === 'completed'">
        <h1 class="text-2xl my-8">Your Download is Ready</h1>
        <p class="flex flex-col items-center justify-center">
          <Button variant="primary" :href="archiveStatus.url">
            <DownloadIcon class="!w-5 !h-5 mr-2" />
            Download
          </Button>
          <Button
            variant="tertiary"
            :to="`/drawers/viewDrawer/${drawerId}`"
            class="my-6">
            &larr; Back to Drawer
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
import { useInstanceStore } from "@/stores/instanceStore";
import { SpinnerIcon, DownloadIcon } from "@/icons";
import { onBeforeRouteUpdate, useRouter } from "vue-router";

const props = defineProps<{
  drawerId: number;
}>();

const isPageReady = ref(false);
const drawerStore = useDrawerStore();
const archiveStatus = ref<ApiStartDrawerDownloadResponse | null>(null);
const instanceStore = useInstanceStore();
const router = useRouter();

onMounted(async () => {
  archiveStatus.value = await drawerStore.downloadDrawer(props.drawerId);
  isPageReady.value = true;
});

onBeforeRouteUpdate(() => {
  // if user doesn't have download permissions, redirect to drawer page
  if (!instanceStore.currentUser?.canManageDrawers) {
    router.push(`/drawers/viewDrawer/${props.drawerId}`);
    return;
  }
});
</script>
<style scoped></style>
