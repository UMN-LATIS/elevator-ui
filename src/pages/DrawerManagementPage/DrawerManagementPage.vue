<template>
  <DefaultLayout>
    <PageContent class="max-w-screen-lg">
      <Link
        :to="`/drawers/viewDrawer/${drawerId}`"
        class="flex items-center gap-1 mb-4 hover:no-underline">
        <ArrowForwardIcon class="transform rotate-180 h-4 w-4" />
        Back to Drawer
      </Link>

      <PageHeader :title="pageTitle" />

      <p v-if="isUnmanageable" class="text-sm text-on-surface-variant">
        You cannot manage the sharing for this drawer.
      </p>
      <GroupAccessTable v-else :drawerId="drawerId" />
    </PageContent>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import PageContent from "@/components/PageContent/PageContent.vue";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
import Link from "@/components/Link/Link.vue";
import { ArrowForwardIcon } from "@/icons";
import GroupAccessTable from "./GroupAccessTable.vue";
import { manageableDrawersQuery } from "./drawerGroupQueries";
import { toDrawerTitle } from "./toDrawerTitle";

const props = defineProps<{
  drawerId: number;
}>();

const { data: drawers, isSuccess: isDrawerListLoaded } = useQuery(
  manageableDrawersQuery()
);

const drawer = computed(() =>
  (drawers.value ?? []).find((candidate) => candidate.id === props.drawerId)
);

// The list holds every drawer the caller manages, so a drawer missing
// from it is one they cannot share. Wait for the list: before it lands,
// every drawer looks missing.
const isUnmanageable = computed(
  (): boolean => isDrawerListLoaded.value && !drawer.value
);

// The drawer's title arrives with the list, so the header names the
// drawer only once it can.
const pageTitle = computed((): string => {
  if (!drawer.value) return "Drawer Permissions";
  return `Drawer Permissions: ${toDrawerTitle(drawer.value)}`;
});
</script>
