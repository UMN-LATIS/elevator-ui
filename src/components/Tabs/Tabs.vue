<template>
  <div>
    <div class="tabs flex" :class="labelsClass">
      <button
        v-for="(tab, index) in tabs"
        :key="tab.id"
        class="tab-button px-4 py-1 text-sm border-b-2"
        :class="{
          'border-transparent text-neutral-400': index !== activeTabIndex,
          'tab-button--is-active border-neutral-900 text-neutral-900 font-bold':
            index === activeTabIndex,
        }"
        @click="setActiveTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="py-4">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, provide } from "vue";
import { TabsInjectionKey } from "@/constants/constants";
import type { Tab, TabsContext } from "@/types";

defineProps<{
  labelsClass?: string;
}>();

const tabs = ref<Tab[]>([]);
const activeTabIndex = ref(0);

const addTab = (tab: Tab) => {
  tabs.value.push(tab);
};

const removeTab = (tab: Tab) => {
  const index = tabs.value.findIndex((t) => t.id === tab.id);
  if (index === -1) return;
  if (index === activeTabIndex.value) {
    activeTabIndex.value = 0;
  }

  tabs.value.splice(index, 1);
};

const setActiveTab = (tabId: string) => {
  const index = tabs.value.findIndex((t) => t.id === tabId);
  if (index === -1) return;
  activeTabIndex.value = index;
};

const isActiveTab = (tabId: string) => {
  const index = tabs.value.findIndex((t) => t.id === tabId);
  if (index === -1) return false;
  return index === activeTabIndex.value;
};

provide<TabsContext>(TabsInjectionKey, {
  addTab,
  removeTab,
  setActiveTab,
  isActiveTab,
});
</script>

<style scoped></style>
