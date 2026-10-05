<template>
  <div class="border border-outline-variant rounded-md">
    <Table class="w-full">
      <TableHeader>
        <TableRow>
          <DataTableHead
            v-for="column in columns"
            :key="column.id"
            v-model:sort="sort"
            :column="column"
            class="border-b border-outline-variant" />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableLoading v-if="isLoading" :colspan="columns.length">
          Loading members…
        </TableLoading>
        <template v-else>
          <TableRow v-for="member in sortedMembers" :key="member.userId">
            <TableCell>
              <div
                v-if="member.userId === removingUserId"
                class="text-sm text-on-surface-variant">
                <s>{{ member.name }}</s>
                (removing…)
              </div>
              <div v-else class="text-sm text-on-surface font-medium">
                {{ member.name }}
              </div>
            </TableCell>
            <TableCell>
              <div class="text-sm text-on-surface-variant">
                {{ member.email || "—" }}
              </div>
            </TableCell>
            <TableCell>
              <div class="text-sm text-on-surface-variant">
                {{ member.username || "—" }}
              </div>
            </TableCell>
            <TableCell>
              <div class="text-sm text-on-surface-variant">
                {{ member.userType }}
              </div>
            </TableCell>
            <TableCell>
              <div class="text-sm text-on-surface-variant">
                {{
                  member.createdAt
                    ? new Date(member.createdAt).toLocaleDateString()
                    : "—"
                }}
              </div>
            </TableCell>
            <TableCell>
              <div class="flex justify-end">
                <IconButton
                  title="Remove"
                  :showTooltip="false"
                  class="enabled:hover:bg-error-container enabled:hover:text-on-error-container"
                  @click="emit('remove', member)">
                  <TrashIcon class="size-4" />
                </IconButton>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="!members.length && showEmptyMessage">
            <TableCell
              :colspan="columns.length"
              class="h-16 text-center text-sm text-on-surface-variant">
              No members yet.
            </TableCell>
          </TableRow>
        </template>
        <!-- slot for extra rows such as the add-member form or the "add entry"
          button. Keep it OUTSIDE of the `<template v-*>` blocks so that
          it renders regardless of whether the table is loading or empty.
          This permits `tryFocus` to find the add button immediately after
          creating a new group. -->
        <slot :columnCount="columns.length" />
      </TableBody>
    </Table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { TrashIcon } from "lucide-vue-next";
import { DataTableHead, sortRows } from "@/components/DataTable";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableLoading,
  TableRow,
} from "@/components/ui/table";
import IconButton from "@/components/IconButton/IconButton.vue";
import type { DataTableColumn, GroupMember, TableSort } from "@/types";

const props = withDefaults(
  defineProps<{
    members: GroupMember[];
    isLoading?: boolean;
    removingUserId?: number | null;
    // pass false while a slotted row (add form, in-flight member) occupies
    // the body, so "No members yet." doesn't show beside it
    showEmptyMessage?: boolean;
  }>(),
  { isLoading: false, removingUserId: null, showEmptyMessage: true }
);

const emit = defineEmits<{
  remove: [member: GroupMember];
}>();

defineSlots<{
  default?: (props: { columnCount: number }) => unknown;
}>();

const columns: DataTableColumn<GroupMember>[] = [
  { id: "name", label: "Name", sortValue: (member) => member.name },
  { id: "email", label: "Email", sortValue: (member) => member.email },
  {
    id: "username",
    label: "Username",
    sortValue: (member) => member.username,
  },
  { id: "userType", label: "Type", sortValue: (member) => member.userType },
  {
    id: "createdAt",
    label: "Created",
    sortValue: (member) => member.createdAt,
  },
  { id: "actions", label: "Actions", isLabelHidden: true },
];

const sort = ref<TableSort | null>({ columnId: "name", direction: "asc" });

const sortedMembers = computed((): GroupMember[] =>
  sortRows(props.members, columns, sort.value)
);
</script>
