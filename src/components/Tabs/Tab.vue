<template>
  <div v-if="tabsContext?.isActiveTab(id)" class="tab">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { inject, onMounted, onUnmounted } from "vue";
import { TabsInjectionKey } from "@/constants/constants";
import type { TabsContext } from "@/types";

const props = defineProps<{
  id: string;
  label: string;
}>();

const tabsContext = inject<TabsContext>(TabsInjectionKey);

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
