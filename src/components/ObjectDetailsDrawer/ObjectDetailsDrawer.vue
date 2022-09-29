<template>
  <div class="asset-details">
    <div
      v-if="!objectId"
      class="bg-neutral-50 text-neutral-900 border-y border-neutral-300 flex justify-end"
    >
      <ActiveFileViewToolbar />
    </div>
    <Drawer
      v-if="objectId"
      label="Details"
      variant="secondary"
      :isOpen="isOpen"
      @toggle="$emit('toggle')"
    >
      <template #header-utils>
        <ActiveFileViewToolbar />
      </template>

      <WidgetList :assetId="objectId" />

      <!-- For development only? -->
      <footer class="flex gap-2">
        <Button :href="getAssetUrl(objectId)" icon="image" target="_blank">
          View
        </Button>
        <Button
          :href="`${getAssetUrl(objectId)}/true`"
          label="Asset Json"
          icon="data_object"
          target="_blank"
        >
          Data
        </Button>
      </footer>
    </Drawer>
  </div>
</template>
<script setup lang="ts">
import Drawer from "@/components/Drawer/Drawer.vue";
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import Button from "@/components/Button/Button.vue";
import { getAssetUrl } from "@/helpers/displayUtils";
import ActiveFileViewToolbar from "@/components/ActiveFileViewToolbar/ActiveFileViewToolbar.vue";

withDefaults(
  defineProps<{
    objectId: string | null;
    isOpen: boolean;
  }>(),
  {
    isOpen: false,
  }
);

defineEmits<{
  (eventName: "toggle");
}>();
</script>

<style scoped></style>
