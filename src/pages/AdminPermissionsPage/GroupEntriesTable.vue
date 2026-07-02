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
            :group="group"
            @save="$emit('save', $event)"
            @remove="$emit('remove', $event)" />
          <TableRow v-if="pendingValue">
            <TableCell
              :colspan="2"
              class="text-sm p-2 italic text-on-surface-variant opacity-60">
              {{ pendingValue }} (adding…)
            </TableCell>
          </TableRow>
          <TableEmpty v-if="!entries.length && !pendingValue" :colspan="2">
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

defineProps<{
  group: PermissionsGroup;
  entries: PermissionsGroupEntry[];
  isLoading: boolean;
  // When set, a muted row with this value renders after the data rows, for
  // an addition that is still settling.
  pendingValue?: string | null;
}>();

defineEmits<{
  (eventName: "save", entry: PermissionsGroupEntry): void;
  (eventName: "remove", entry: PermissionsGroupEntry): void;
}>();
</script>
