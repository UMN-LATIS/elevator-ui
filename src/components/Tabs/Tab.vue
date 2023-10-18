<template>
  <div v-if="isActiveTab || !unmountWhenInactive" v-show="isActiveTab">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { inject, onMounted, onUnmounted, computed } from "vue";
import { TabsInjectionKey } from "@/constants/constants";
import type { TabsContext } from "@/types";

const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    unmountWhenInactive?: boolean;
  }>(),
  {
    unmountWhenInactive: false,
  }
);

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
