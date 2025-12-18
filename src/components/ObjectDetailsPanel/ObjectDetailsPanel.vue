<template>
  <div class="object-details-panel">
    <div v-if="!objectId" class="h-full hidden sm:flex justify-end">
      <ActiveFileViewToolbar
        :fileHandlerId="fileHandlerId"
        :assetId="assetId" />
    </div>
    <Panel
      v-else
      label="Details"
      variant="secondary"
      :isOpen="isOpen"
      :showToggle="showToggle"
      class="h-full"
      @toggle="$emit('toggle')">
      <template #header-utils>
        <ActiveFileViewToolbar
          class="hidden sm:block"
          :fileHandlerId="fileHandlerId"
          :assetId="objectId" />
      </template>

      <WidgetList v-if="objectId" :assetId="objectId" />

      <footer v-if="objectId" class="flex gap-2">
        <ArrowButton v-if="assetUrl" :to="assetUrl" />
      </footer>
    </Panel>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Panel from "@/components/Panel/Panel.vue";
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import { getAssetUrl } from "@/helpers/displayUtils";
import ActiveFileViewToolbar from "@/components/ActiveFileViewToolbar/ActiveFileViewToolbar.vue";
import ArrowButton from "@/components/ArrowButton/ArrowButton.vue";

const props = withDefaults(
  defineProps<{
    assetId: string | null;
    objectId: string | null;
    fileHandlerId: string | null;
    isOpen: boolean;
    showToggle?: boolean;
  }>(),
  {
    isOpen: false,
    showToggle: true,
  }
);

defineEmits<{
  (eventName: "toggle");
}>();

const assetUrl = computed(() =>
  props.objectId ? getAssetUrl(props.objectId) : null
);
</script>

<style scoped></style>
