<template>
  <div v-if="tabsContext" v-show="tabsContext.isActiveTab(id)">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { inject, onMounted, onUnmounted, defineProps } from "vue";

interface Tab {
  id: string;
  label: string;
}

const props = defineProps<Tab>();

const tabsContext = inject<{
  addTab: (tab: Tab) => void;
  removeTab: (tab: Tab) => void;
  setActiveTab: (id: string) => void;
  isActiveTab: (id: string) => boolean;
}>("tabsContext");

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
