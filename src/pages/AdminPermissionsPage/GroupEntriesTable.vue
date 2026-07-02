<template>
  <div class="border border-outline-variant rounded-md">
    <Table class="w-full">
      <TableHeader>
        <TableHead
          class="bg-surface-container-low font-medium uppercase text-xs tracking-wider">
          Value
        </TableHead>
        <TableHead class="bg-surface-container-low">
          <span class="sr-only">Actions</span>
        </TableHead>
      </TableHeader>
      <TableBody>
        <template v-if="isLoading">
          <TableRow v-for="row in 3" :key="`skeleton-${row}`">
            <TableCell v-for="(_, index) in 2" :key="index">
              <Skeleton height="1rem" width="70%" />
            </TableCell>
          </TableRow>
        </template>
        <template v-else>
          <GroupEntriesTableRow
            v-for="entry in entries"
            :key="entry.id"
            :entry="entry"
            :group="group" />
          <!-- extra rows such as the add-entry form -->
          <slot />
          <TableEmpty v-if="!entries.length && showEmptyMessage" :colspan="2">
            No entries yet.
          </TableEmpty>
        </template>
      </TableBody>
    </Table>
  </div>
</template>
<script setup lang="ts">
import type { PermissionsGroup, PermissionsGroupEntry } from "@/types";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
  TableBody,
} from "@/components/ui/table";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
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
