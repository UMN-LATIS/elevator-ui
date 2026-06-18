<template>
  <div class="tabs">
    <div class="flex" :class="labelsClass">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="[
          `tab-button tab-button--${tab.id} px-4 py-2 text-sm border-b-2`,
          {
            'border-transparent text-on-surface-variant':
              tab.id !== activeTabId,
            'tab-button--is-active border-on-surface text-on-surface font-bold':
              tab.id === activeTabId,
          },
        ]"
        @click="setActiveTab(tab.id)">
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

// change to defineModel so we can take a prop or `tactiveTabId`
// can exist on its own as a ref
const activeTabId = defineModel<string>("activeTabId");

const emit = defineEmits<{
  (event: "tabChange", tab: Tab): void;
}>();

const tabs = ref<Tab[]>([]);

const addTab = (tab: Tab) => {
  tabs.value.push(tab);
  // Seed the default selection (first tab) when used without a v-model.
  if (activeTabId.value === undefined) {
    activeTabId.value = tab.id;
  }
};

const removeTab = (tab: Tab) => {
  const index = tabs.value.findIndex((t) => t.id === tab.id);
  if (index === -1) return;
  tabs.value.splice(index, 1);
};

const setActiveTab = (tabId: string) => {
  const newActiveTab = tabs.value.find((t) => t.id === tabId);
  if (!newActiveTab) {
    throw new Error(`Tab with id ${tabId} not found`);
  }
  activeTabId.value = newActiveTab.id;
  emit("tabChange", newActiveTab);
};

const isActiveTab = (tabId: string) => {
  return tabId === activeTabId.value;
};

provide<TabsContext>(TabsInjectionKey, {
  addTab,
  removeTab,
  setActiveTab,
  isActiveTab,
});
</script>

<style scoped></style>
