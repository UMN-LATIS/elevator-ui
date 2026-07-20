<template>
  <AdminLayout>
    <PageContent class="max-w-screen-md">
      <PageHeader
        :title="
          collectionId === null ? 'Create Collection' : 'Edit Collection'
        " />
      <!-- TODO: collection form -->
      <p class="text-sm text-on-surface-variant">
        The collection form is coming soon. Until then, use the
        <a
          class="text-primary underline-offset-2 hover:underline"
          :href="legacyEditUrl">
          legacy collection editor.
        </a>
      </p>
    </PageContent>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AdminLayout from "@/layouts/AdminLayout.vue";
import PageContent from "@/components/PageContent/PageContent.vue";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
import config from "@/config";

const props = defineProps<{
  collectionId: number | null;
}>();

const BASE_URL = config.instance.base.url;

const legacyEditUrl = computed(() =>
  props.collectionId === null
    ? `${BASE_URL}/collectionManager/edit`
    : `${BASE_URL}/collectionManager/edit/${props.collectionId}`
);
</script>
