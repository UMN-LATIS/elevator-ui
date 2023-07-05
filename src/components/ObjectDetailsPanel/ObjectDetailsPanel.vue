<template>
  <div class="object-details">
    <div v-if="!objectId" class="h-full flex justify-end">
      <ActiveFileViewToolbar />
    </div>
    <Panel
      v-else
      label="Details"
      variant="secondary"
      :isOpen="isOpen"
      :showToggle="showToggle"
      class="h-full"
      @toggle="$emit('toggle')"
    >
      <template #header-utils>
        <ActiveFileViewToolbar />
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
    objectId: string | null;
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
