<template>
  <AdminLayout>
    <PageContent class="max-w-screen-lg">
      <PageHeader
        title="Permissions"
        description="Grant access to any collection in this instance" />

      <Tabs
        v-model:activeTabId="activeTabId"
        labelsClass="border-b border-outline-variant">
        <Tab id="rules" label="Rules">
          <RulesTabContent />
        </Tab>
        <Tab id="groups" label="Groups">
          <GroupsTabContent />
        </Tab>
      </Tabs>
    </PageContent>
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from "@/layouts/AdminLayout.vue";
import PageContent from "@/components/PageContent/PageContent.vue";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
import Tabs from "@/components/Tabs/Tabs.vue";
import Tab from "@/components/Tabs/Tab.vue";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import GroupsTabContent from "./GroupsTabContent.vue";
import RulesTabContent from "./RulesTabContent.vue";

const VALID_TABS = ["rules", "groups"] as const;
type ValidTab = (typeof VALID_TABS)[number];

const route = useRoute();
const router = useRouter();

// helper for TS since route.query.tab could be array
const isValidTab = (x: unknown): x is ValidTab =>
  VALID_TABS.some((tab) => tab === x);

// let route be the source of truth for the active tab.
const activeTabId = computed<ValidTab>({
  get() {
    const tab = route.query.tab;
    return isValidTab(tab) ? tab : VALID_TABS[0];
  },
  set(tabId) {
    router.replace({
      query: {
        ...route.query,
        // only include tabId in query if it's not the default (first tab)
        tab: tabId === VALID_TABS[0] ? undefined : tabId,
      },
    });
  },
});
</script>
