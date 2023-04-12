<template>
  <div>
    <div class="tabs">
      <button
        v-for="(tab, index) in tabs"
        :key="tab.id"
        class="tab-button"
        :class="{ 'tab-button--is-active': index === activeTabIndex }"
        @click="setActiveTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tab-content">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, provide } from "vue";

interface Tab {
  id: string;
  label: string;
}

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

provide("tabsContext", {
  addTab,
  removeTab,
  setActiveTab,
  isActiveTab,
});
</script>

<style scoped>
.tabs {
  display: flex;
}

.tab-button {
  cursor: pointer;
}

.tab-button--is-active {
  font-weight: bold;
}
</style>
