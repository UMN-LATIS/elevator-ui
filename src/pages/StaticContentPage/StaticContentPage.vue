<template>
  <DefaultLayout>
    <template #custom-header>
      <CustomAppHeader v-if="instanceStore.customHeader" />
    </template>
    <div
      v-if="page"
      class="static-page__content p-4 lg:p-8 mx-auto flex-1 w-full max-w-screen-xl"
    >
      <a
        v-if="canCurrentUserEdit"
        :href="`${BASE_URL}/instances/editPage/${pageId}`"
        class="float-right uppercase text-xs font-medium bg-blue-100 px-2 py-1 rounded-md no-underline hover:bg-blue-600 hover:text-blue-100 hover:no-underline"
        >Edit Page
      </a>
      <div class="prose prose-neutral">
        <h1 class="text-4xl font-bold">
          {{ page.title || "No Title" }}
        </h1>

        <SanitizedHTML :html="page.content ?? ''" class="w-full" />
      </div>
    </div>
    <template #footer>
      <AppFooter v-if="instanceStore.customFooter" />
    </template>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import CustomAppHeader from "@/components/CustomAppHeader/CustomAppHeader.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import AppFooter from "@/components/AppFooter/AppFooter.vue";
import { computed, ref, watch } from "vue";
import { ApiStaticPageResponse } from "@/types";
import { useInstanceStore } from "@/stores/instanceStore";
import api from "@/api";
import config from "@/config";

const instanceStore = useInstanceStore();

const props = defineProps<{
  pageId: number;
}>();

const BASE_URL = config.instance.base.path;
const page = ref<ApiStaticPageResponse | null>(null);

const canCurrentUserEdit = computed(() => {
  return (
    instanceStore.currentUser?.isAdmin ||
    instanceStore.currentUser?.isSuperAdmin
  );
});

watch(
  () => props.pageId,
  async () => {
    page.value = await api.getStaticPage(props.pageId);
  },
  { immediate: true }
);
</script>
<style scoped>
.static-page__content {
  background: var(--app-backgroundColor);
  color: var(--app-textColor);
}

.prose :first-child {
  margin-top: 0;
}
</style>
