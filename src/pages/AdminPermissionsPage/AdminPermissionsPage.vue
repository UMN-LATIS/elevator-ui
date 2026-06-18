<template>
  <AdminLayout>
    <PageContent>
      <PageHeader
        title="Permissions"
        description="Baseline access across this Elevator instance. Rules are additive — a user gets the highest grant that matches them." />

      <Tabs v-model:activeTabId="activeTabId">
        <Tab id="rules" label="Rules">
          <div
            class="border border-dashed border-outline-variant rounded-md p-10 text-center text-sm text-on-surface-variant">
            Rules
          </div>
        </Tab>
        <Tab id="groups" label="Groups">
          <div class="flex items-center justify-between">
            <p>Help text goes here about groups and how they work.</p>
            <Button variant="primary">Create Group</Button>
          </div>

          <AccordionRoot type="multiple" class="mt-4 flex flex-col gap-2">
            <AccordionItem
              value="group-everyone"
              class="rounded-md border border-outline-variant bg-surface-container">
              <AccordionHeader>
                <AccordionTrigger
                  class="group flex w-full items-center gap-4 p-4 text-left">
                  <ChevronRightIcon
                    class="shrink-0 text-on-surface-variant transition-transform group-data-[state=open]:rotate-90" />
                  <span class="text-lg font-bold">Everyone</span>
                  <span
                    class="ml-auto flex items-center gap-4 text-sm text-on-surface-variant">
                    <span>Anyone — even signed-out visitors</span>
                    <span>1 grant</span>
                  </span>
                </AccordionTrigger>
              </AccordionHeader>
              <AccordionContent
                class="border-t border-outline-variant p-4 bg-surface-container-lowest">
                <p class="mb-4 text-sm text-on-surface-variant">
                  Matches everyone, including signed-out visitors.
                </p>
                <Button variant="danger">Delete Group</Button>
              </AccordionContent>
            </AccordionItem>
          </AccordionRoot>
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
import Button from "@/components/Button/Button.vue";
import { useRoute, useRouter } from "vue-router";
import {
  AccordionRoot,
  AccordionTrigger,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
} from "reka-ui";
import ChevronRightIcon from "@/icons/ChevronRightIcon.vue";

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
