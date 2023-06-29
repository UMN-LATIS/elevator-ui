<template>
  <div
    v-if="showButtonBar"
    class="object-viewer__button-bar flex justify-end items-center gap-2 p-2 border-b bg-neutral-50"
  >
    <AddToEmbeddedPluginButton
      v-if="isInEmbedMode"
      :fileHandlerId="fileHandlerId"
    />
    <AddToDrawerButton v-if="instanceStore.currentUser?.canManageDrawers" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AddToEmbeddedPluginButton from "./AddToEmbeddedPluginButton.vue";
import AddToDrawerButton from "./AddToDrawerButton.vue";
import { useElevatorSessionStorage } from "@/helpers/useElevatorSessionStorage";
import { useInstanceStore } from "@/stores/instanceStore";

withDefaults(
  defineProps<{
    fileHandlerId?: string | null;
  }>(),
  {
    fileHandlerId: null,
  }
);

const instanceStore = useInstanceStore();
const { isInEmbedMode } = useElevatorSessionStorage();

const showButtonBar = computed(() => {
  return isInEmbedMode.value || instanceStore.currentUser?.canManageDrawers;
});
</script>
<style scoped></style>
