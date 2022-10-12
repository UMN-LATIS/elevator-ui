<template>
  <div class="asset-details">
    <div
      v-if="!hasDetailedContentToShow"
      class="bg-neutral-50 text-neutral-900 border-y border-neutral-300 flex justify-end"
    >
      <ActiveFileViewToolbar />
    </div>
    <Drawer
      v-else
      label="Details"
      variant="secondary"
      :isOpen="isOpen"
      @toggle="$emit('toggle')"
    >
      <template #header-utils>
        <ActiveFileViewToolbar />
      </template>

      <WidgetList v-if="objectId" :assetId="objectId" />

      <!-- For development only? -->
      <footer v-if="objectId" class="flex gap-2">
        <Button
          :href="getAssetUrl(objectId)"
          icon="image"
          target="_blank"
          variant="tertiary"
        >
          Old View
        </Button>
        <Button
          :href="`${getAssetUrl(objectId)}/true`"
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
import { SearchResultMatch } from "@/types";

const props = withDefaults(
  defineProps<{
    objectId: string | null;
    moreLikeThisItems: SearchResultMatch[];
    isOpen: boolean;
  }>(),
  {
    isOpen: false,
  }
);

defineEmits<{
  (eventName: "toggle");
}>();

const hasDetailedContentToShow = computed(
  () => !!(props.objectId || props.moreLikeThisItems.length)
);
</script>

<style scoped></style>
