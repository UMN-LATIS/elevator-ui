<template>
  <div class="asset-details">
    <Drawer
      label="Details"
      variant="secondary"
      :isOpen="isOpen"
      @toggle="$emit('toggle')"
    >
      <template #header-utils>
        <div class="flex justify-between items-center w-full px-4 py-2">
          <div class="flex gap-1 items-center leading-none">
            <button class="p-2 flex items-center">
              <span class="material-symbols-outlined">info</span>
            </button>
            <button class="p-2 flex items-center">
              <span class="material-symbols-outlined">download</span>
            </button>
            <button class="p-2 flex items-center">
              <span class="material-symbols-outlined">share</span>
            </button>
          </div>
        </div>
      </template>

      <WidgetList :assetId="objectId" />
    </Drawer>
  </div>
</template>
<script setup lang="ts">
import Drawer from "@/components/Drawer/Drawer.vue";
import WidgetList from "@/components/WidgetList/WidgetList.vue";

withDefaults(
  defineProps<{
    objectId: string;
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
