<template>
  <div>
    <label :for="inputId" class="sr-only">{{ label }}</label>
    <AutoCompleteInput
      :id="inputId"
      v-model="draft"
      :items="options"
      :isItemDisabled="isOptionDisabled"
      :isLoading="isLoadingHints"
      :blurOnSelect="false"
      :inputClass="cn('w-full bg-surface border-outline', inputClass)"
      :placeholder="placeholder"
      :minChars="0"
      @select="handleSelect">
      <template #option="{ item }">
        <template v-if="item.kind === 'hint'">
          <div>
            <span class="block truncate font-medium">
              {{ item.hint.label }}
            </span>
            <span
              v-if="item.hint.value !== item.hint.label"
              class="block truncate text-xs">
              {{ item.hint.value }}
            </span>
            <em v-if="isOptionDisabled(item)" class="text-xs italic">
              already added
            </em>
          </div>
        </template>
        <template v-else>
          <div
            class="border border-current rounded-md size-8 flex items-center justify-center">
            <PlusIcon class="size-4" />
          </div>
          <span class="block truncate font-medium">Use "{{ item.value }}"</span>
        </template>
      </template>
    </AutoCompleteInput>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { AutoCompleteInput } from "@/components/AutoCompleteInput";
import { PlusIcon } from "@/icons";
import {
  drawerGroupEntriesQuery,
  drawerGroupTypesQuery,
} from "./drawerGroupQueries";
import {
  buildEntryValueOptions,
  isEntryValueOptionDisabled,
  type EntryValueOption,
} from "../AdminPermissionsPage/buildEntryValueOptions";
import type { CSSClass, PermissionsGroup } from "@/types";
import { cn } from "@/lib/utils";

const props = defineProps<{
  group: PermissionsGroup;
  inputId: string;
  // visually hidden, for the accessible name
  label: string;
  // the edit row passes its entry's current value so editing back to it
  // isn't blocked as "already added"
  excludeValue?: string;
  inputClass?: CSSClass;
  placeholder?: string;
}>();

const draft = defineModel<string>({ required: true });

const { data: groupTypes, isPending: isLoadingHints } = useQuery(
  drawerGroupTypesQuery()
);
const hints = computed(
  () =>
    groupTypes.value?.find((details) => details.type === props.group.type)
      ?.entryHints ?? []
);

// Shares the cache entry the surrounding entries table already fetched.
const { data: entries } = useQuery(
  drawerGroupEntriesQuery(() => props.group.id)
);
const existingValues = computed(() => {
  const values = (entries.value ?? []).map((entry) => entry.value);
  return props.excludeValue === undefined
    ? values
    : values.filter((value) => value !== props.excludeValue);
});

const options = computed(() =>
  buildEntryValueOptions({ hints: hints.value, draft: draft.value })
);

function isOptionDisabled(option: EntryValueOption): boolean {
  return isEntryValueOptionDisabled(option, existingValues.value);
}

function handleSelect(option: EntryValueOption): void {
  draft.value = option.kind === "hint" ? option.hint.value : option.value;
}
</script>
<style scoped></style>
