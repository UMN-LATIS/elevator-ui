<template>
  <div class="asset-details">
    <Drawer :label="assetTitle" :isOpen="isOpen" @toggle="$emit('toggle')">
      <WidgetList :assetId="assetId" />
    </Drawer>
  </div>
</template>
<script setup lang="ts">
import Drawer from "./Drawer.vue";
import WidgetList from "./WidgetList.vue";
import { useAssetTitle } from "@/composables/useAssetTitle";

const props = withDefaults(
  defineProps<{
    assetId: string;
    isOpen?: boolean;
  }>(),
  {
    isOpen: true,
  }
);

defineEmits<{
  (eventName: "toggle");
}>();

const assetTitle = useAssetTitle(props.assetId);
</script>
<style scoped></style>
