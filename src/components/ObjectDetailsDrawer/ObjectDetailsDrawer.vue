<template>
  <div class="object-details">
    <div
      v-if="!objectId"
      class="bg-neutral-900 text-neutral-300 h-full flex justify-end"
    >
      <ActiveFileViewToolbar />
    </div>
    <Drawer
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

      <!-- For development only? -->
      <footer v-if="objectId" class="flex gap-2">
        <ArrowButton v-if="assetUrl" :to="assetUrl" />
        <Button
          :href="`${config.base.url}/${assetUrl}`"
          icon="image"
          target="_blank"
          variant="tertiary"
        >
          Old View
        </Button>
        <Button
          :href="`${config.base.url}/${assetUrl}/true`"
          label="Asset Json"
          icon="data_object"
          target="_blank"
          variant="tertiary"
        >
          JSON
        </Button>
      </footer>
    </Drawer>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Drawer from "@/components/Drawer/Drawer.vue";
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import Button from "@/components/Button/Button.vue";
import { getAssetUrl } from "@/helpers/displayUtils";
import ActiveFileViewToolbar from "@/components/ActiveFileViewToolbar/ActiveFileViewToolbar.vue";
import config from "@/config";
import ArrowButton from "../ArrowButton/ArrowButton.vue";

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
