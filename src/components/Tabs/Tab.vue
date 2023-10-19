<template>
  <div v-show="isActiveTab">
    <slot :isActiveTab="isActiveTab"></slot>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, onMounted, onUnmounted } from "vue";
import { TabsInjectionKey } from "@/constants/constants";
import type { TabsContext } from "@/types";

const props = defineProps<{
  id: string;
  label: string;
}>();

const tabsContext = inject<TabsContext>(TabsInjectionKey);
const isActiveTab = computed(() => {
  if (!tabsContext) {
    throw new Error("TabsContext not found");
  }
  return tabsContext.isActiveTab(props.id);
});

onMounted(() => {
  if (!tabsContext) {
    throw new Error("TabsContext not found");
  }
  tabsContext.addTab(props);
});

onUnmounted(() => {
  if (!tabsContext) {
    throw new Error("TabsContext not found");
  }
  tabsContext.removeTab(props);
});
</script>
