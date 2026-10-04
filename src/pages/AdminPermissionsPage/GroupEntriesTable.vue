<template>
  <div class="border border-outline-variant rounded-md">
    <Table class="w-full">
      <TableHeader>
        <TableHead
          class="font-medium uppercase text-xs tracking-wider border-b border-outline-variant">
          Value
        </TableHead>
        <TableHead class="border-b border-outline-variant">
          <span class="sr-only">Actions</span>
        </TableHead>
      </TableHeader>
      <TableBody>
        <TableLoading v-if="isLoading" :colspan="2">
          Loading entries…
        </TableLoading>
        <template v-else>
          <GroupEntriesTableRow
            v-for="entry in entries"
            :key="entry.id"
            :entry="entry"
            :group="group" />
          <TableEmpty v-if="!entries.length && showEmptyMessage" :colspan="2">
            No entries yet.
          </TableEmpty>
        </template>
        <!-- slot for extra rows such as the add-member form or the "add entry"
          button. Keep it OUTSIDE of the `<template v-*>` blocks so that
          it renders regardless of whether the table is loading or empty.
          This permits `tryFocus` to find the add button immediately after
          creating a new group. -->
        <slot />
      </TableBody>
    </Table>
  </div>
</template>
<script setup lang="ts">
import type { PermissionsGroup, PermissionsGroupEntry } from "@/types";
import {
  Table,
  TableBody,
  TableEmpty,
  TableHead,
  TableHeader,
  TableLoading,
} from "@/components/ui/table";
import GroupEntriesTableRow from "./GroupEntriesTableRow.vue";

withDefaults(
  defineProps<{
    group: PermissionsGroup;
    entries: PermissionsGroupEntry[];
    isLoading: boolean;
    // pass false while a slotted row (add form, in-flight entry) occupies
    // the body, so "No entries yet." doesn't show beside it
    showEmptyMessage?: boolean;
  }>(),
  { showEmptyMessage: true }
);
</script>
