<template>
  <TableRow v-if="isPending || isOpen" class="hover:bg-transparent">
    <TableCell :colspan="colspan" class="p-2 text-sm">
      <p v-if="isPending">{{ pendingLabel }} (saving…)</p>
      <form
        v-else
        class="flex flex-wrap items-end gap-2"
        data-add-permission-form
        @submit.prevent="handleSave">
        <SelectGroup
          v-model="draft.scope"
          label="Scope"
          class="w-36"
          :options="scopeOptions" />
        <SelectGroup
          v-if="draft.scope === 'collection'"
          v-model="draft.collectionId"
          label="Collection"
          placeholder="Select a collection…"
          class="w-56"
          :options="collectionOptions" />
        <div class="min-w-48 flex-1">
          <label for="add-permission-group" class="block text-xs font-medium">
            Group
          </label>
          <AutoCompleteInput
            id="add-permission-group"
            :modelValue="draft.groupText"
            :items="groupOptions"
            :minChars="0"
            :blurOnSelect="false"
            placeholder="Find or create a group…"
            inputClass="w-full bg-surface border-outline-variant add-permission__group-input"
            @update:modelValue="handleGroupTextInput"
            @select="handleSelectGroup">
            <template #option="{ item }">
              <template v-if="item.kind === 'existing'">
                <div>
                  <span class="block truncate font-medium">
                    {{ toDisplayLabel(item.group) }}
                  </span>
                  <span class="block truncate text-xs">
                    {{ toTypeLabel(item.group) }}
                  </span>
                </div>
              </template>
              <template v-else>
                <div
                  class="border border-current rounded-md size-8 flex items-center justify-center">
                  <PlusIcon class="size-4" />
                </div>
                <span class="truncate font-medium">
                  Create group "{{ item.label }}"
                </span>
              </template>
            </template>
          </AutoCompleteInput>
        </div>
        <SelectGroup
          v-if="isNewGroup"
          v-model="draft.newGroupType"
          label="Group Type"
          placeholder="Select a type…"
          class="w-44"
          :options="typeOptions" />
        <PermissionSelect
          v-model="draft.permissionLevelId"
          label="Permission"
          placeholder="Select a permission…"
          class="w-44"
          :options="permissionOptions" />
        <Button
          type="submit"
          variant="secondary"
          class="py-2 border border-secondary-container"
          :disabled="!canSubmit">
          <CheckIcon class="size-4" />
          Save
        </Button>
        <Button type="button" variant="tertiary" class="py-2" @click="close">
          <XIcon class="size-4" />
          Cancel
        </Button>
        <p
          v-if="grantBeingOverwritten"
          role="alert"
          class="flex w-full items-center gap-2 rounded-md bg-warning-container px-3 py-2 text-sm text-on-warning-container">
          <TriangleAlertIcon class="size-4 shrink-0" />
          <span>
            This group already has
            <b>{{ levelLabelToReplace ?? "a permission" }}</b>
            {{
              draft.scope === "instance"
                ? "on the instance"
                : "on this collection"
            }}. Saving will replace it.
          </span>
        </p>
      </form>
    </TableCell>
  </TableRow>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { CheckIcon, PlusIcon, TriangleAlertIcon, XIcon } from "lucide-vue-next";
import { TableRow, TableCell } from "@/components/ui/table";
import Button from "@/components/Button/Button.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import PermissionSelect from "@/components/PermissionSelect/PermissionSelect.vue";
import { buildPermissionOptions } from "@/components/PermissionSelect/buildPermissionOptions";
import { AutoCompleteInput } from "@/components/AutoCompleteInput";
import { useInstanceQuery } from "@/queries/useInstanceQuery";
import { permissionLevelsQuery } from "@/queries/permissionLevelsQuery";
import {
  flattenCollections,
  normalizeAssetCollections,
} from "@/helpers/collectionHelpers";
import {
  groupsQuery,
  groupTypesQuery,
  useCreateGroupMutation,
} from "./groupQueries";
import {
  collectionGrantsQuery,
  instanceGrantsQuery,
  useSaveRuleMutation,
} from "./ruleQueries";
import type { RuleScope } from "./ruleQueries";
import { permissionRowKey } from "./buildPermissionsPageRows";
import type { GroupTypeValues, PermissionsGroup, SelectOption } from "@/types";

// What the parent needs to reveal the saved permission's row.
export interface CreatedPermission {
  group: PermissionsGroup;
  rowKey: string;
  isNewGroup: boolean;
}

const props = defineProps<{
  colspan: number;
  // group to prefill from a row's "Add Permission" action, null for a
  // blank form
  prefillGroup: PermissionsGroup | null;
  // the page's active collection filter, which a new permission is
  // presumably for, null when unfiltered
  prefillCollectionId: number | null;
}>();

const emit = defineEmits<{
  created: [permission: CreatedPermission];
}>();

// The in-flight "(saving…)" row renders here from the mutations, so the
// parent toggles `open` instead of v-if. Unmounting would drop that row
// while the save is still settling.
const isOpen = defineModel<boolean>("open", { required: true });

const scopeOptions: SelectOption<string>[] = [
  { id: "instance", label: "Instance" },
  { id: "collection", label: "Collection" },
];

const { data: groups } = useQuery(groupsQuery());
const { data: groupTypes } = useQuery(groupTypesQuery());
const { data: permissionLevels } = useQuery(permissionLevelsQuery());
const { data: instanceNav } = useInstanceQuery();
// Both grant lists are already in the query cache from the table.
const { data: instanceGrants } = useQuery(instanceGrantsQuery());
const { data: collectionGrants } = useQuery(collectionGrantsQuery());
const createGroup = useCreateGroupMutation();
const saveRule = useSaveRuleMutation();

const isPending = computed(
  (): boolean => createGroup.isPending.value || saveRule.isPending.value
);

type PermissionDraft = {
  scope: RuleScope;
  collectionId: number | null;
  groupText: string;
  newGroupType: GroupTypeValues | "";
  permissionLevelId: number | null;
};

function blankDraft(): PermissionDraft {
  return {
    scope: "instance",
    collectionId: null,
    groupText: "",
    newGroupType: "",
    permissionLevelId: null,
  };
}

const draft = ref<PermissionDraft>(blankDraft());

// The group picked from the dropdown or prefilled by a row's Add
// Permission action. Labels are not unique, so the pick holds the group
// itself rather than trusting the text to name it back.
const selectedGroup = ref<PermissionsGroup | null>(null);

// The group this form already created, kept so a retry after a failed
// grant reuses it instead of creating a second one.
const createdGroup = ref<PermissionsGroup | null>(null);

// start each open from an empty form, seeded with the prefilled group
// when a row's Add Permission action opened it
watch(isOpen, (open) => {
  if (!open) return;
  draft.value = blankDraft();
  createdGroup.value = null;
  selectedGroup.value = props.prefillGroup;
  if (props.prefillGroup) {
    draft.value.groupText = toDisplayLabel(props.prefillGroup);
  }
  if (props.prefillCollectionId !== null) {
    draft.value.scope = "collection";
    draft.value.collectionId = props.prefillCollectionId;
  }
});

// A row's Add Permission action can fire while the form is already open,
// which reopens nothing, so the new group seeds the field here.
watch(
  () => props.prefillGroup,
  (group) => {
    if (group && isOpen.value) {
      selectedGroup.value = group;
      draft.value.groupText = toDisplayLabel(group);
    }
  }
);

function toDisplayLabel(group: PermissionsGroup): string {
  return group.label || group.type;
}

const typeLabelByType = computed(
  () => new Map((groupTypes.value ?? []).map((t) => [t.type, t.label]))
);

function toTypeLabel(group: PermissionsGroup): string {
  return typeLabelByType.value.get(group.type) ?? group.type;
}

// The group hand-typed text names. A fallback for text never picked from
// the dropdown; with duplicate labels the first match wins.
const matchedGroup = computed((): PermissionsGroup | null => {
  const text = draft.value.groupText.trim().toLowerCase();
  if (text === "") return null;
  return (
    (groups.value ?? []).find(
      (group) => toDisplayLabel(group).toLowerCase() === text
    ) ?? null
  );
});

// The group the form will grant to, which decides between granting to an
// existing group and creating a new one.
const resolvedGroup = computed(
  (): PermissionsGroup | null => selectedGroup.value ?? matchedGroup.value
);

const isNewGroup = computed(
  (): boolean => draft.value.groupText.trim() !== "" && !resolvedGroup.value
);

// A row in the group dropdown: an existing group to pick, or the pinned
// action that creates a group from whatever was typed.
type GroupOption =
  | { kind: "existing"; group: PermissionsGroup }
  | { kind: "create"; label: string };

const groupOptions = computed((): GroupOption[] => {
  const text = draft.value.groupText.trim().toLowerCase();
  const rows: GroupOption[] = (groups.value ?? [])
    .filter((group) => toDisplayLabel(group).toLowerCase().includes(text))
    .map((group) => ({ kind: "existing" as const, group }));

  if (isNewGroup.value) {
    rows.push({ kind: "create", label: draft.value.groupText.trim() });
  }
  return rows;
});

// Selecting holds the group itself and fills the input with its label.
// A create pick already holds its own words, so it only closes the list.
function handleSelectGroup(option: GroupOption): void {
  if (option.kind === "existing") {
    selectedGroup.value = option.group;
    draft.value.groupText = toDisplayLabel(option.group);
  }
}

// Typing that stops naming the picked group invalidates the pick, so
// Save targets what the words say.
function handleGroupTextInput(value: string): void {
  draft.value.groupText = value;
  const selected = selectedGroup.value;
  if (
    selected &&
    toDisplayLabel(selected).toLowerCase() !== value.trim().toLowerCase()
  ) {
    selectedGroup.value = null;
  }
}

const typeOptions = computed((): SelectOption[] =>
  (groupTypes.value ?? []).map((groupType) => ({
    id: groupType.type,
    label: groupType.label,
  }))
);

const collectionOptions = computed((): SelectOption<string | number>[] => {
  const flat = flattenCollections(
    normalizeAssetCollections(instanceNav.value?.collections ?? [])
  );
  return flat.map((collection) => ({
    id: collection.id,
    label: collection.title,
  }));
});

const permissionOptions = computed(() =>
  buildPermissionOptions(permissionLevels.value ?? [])
);

const canSubmit = computed((): boolean => {
  // Instance scope covers every collection, so no collection pick is needed.
  const hasCollection =
    draft.value.scope === "instance" || draft.value.collectionId !== null;
  const hasGroup =
    resolvedGroup.value !== null ||
    (isNewGroup.value && draft.value.newGroupType !== "");
  return hasCollection && hasGroup && draft.value.permissionLevelId !== null;
});

// The grant already at the picked pair, which saving will replace.
// A pair holds at most one grant, and a new group cannot hold any.
const grantBeingOverwritten = computed(() => {
  const group = resolvedGroup.value;
  if (!group) return null;
  return findExistingGrant(group.id);
});

function findExistingGrant(
  groupId: number
): { grantId: number; permissionLevelId: number | null } | null {
  if (draft.value.scope === "instance") {
    const grant = (instanceGrants.value ?? []).find(
      (candidate) => candidate.groupId === groupId
    );
    return grant
      ? { grantId: grant.id, permissionLevelId: grant.permissionLevelId }
      : null;
  }

  if (draft.value.collectionId === null) return null;
  const grant = (collectionGrants.value ?? []).find(
    (candidate) =>
      candidate.collectionId === draft.value.collectionId &&
      candidate.groupId === groupId
  );
  return grant
    ? { grantId: grant.id, permissionLevelId: grant.permissionLevelId }
    : null;
}

const levelLabelToReplace = computed((): string | null => {
  const grant = grantBeingOverwritten.value;
  if (!grant) return null;
  const level = (permissionLevels.value ?? []).find(
    (candidate) => candidate.id === grant.permissionLevelId
  );
  return level?.label ?? null;
});

// Show what was submitted, not the live input the user may keep editing.
const pendingLabel = computed((): string => {
  return createdGroup.value?.label ?? draft.value.groupText.trim();
});

function close(): void {
  isOpen.value = false;
}

async function handleSave(): Promise<void> {
  const { scope, collectionId, newGroupType, permissionLevelId } = draft.value;
  const groupText = draft.value.groupText.trim();
  if (!canSubmit.value || permissionLevelId === null) return;

  // The group has to exist before anything can be granted to it, so the
  // two saves run in order rather than together.
  try {
    // The retry group is the target only while the text still names it:
    // edited text means the user is aiming somewhere else.
    const retryGroup = createdGroup.value;
    const isRetry =
      retryGroup !== null &&
      toDisplayLabel(retryGroup).toLowerCase() === groupText.toLowerCase();

    let group = isRetry ? retryGroup : resolvedGroup.value;
    let isNewlyCreated = isRetry;

    if (group === null) {
      if (newGroupType === "") return;
      group = await createGroup.mutateAsync({
        label: groupText,
        type: newGroupType,
      });
      createdGroup.value = group;
      isNewlyCreated = true;
    }

    const rule = {
      collectionId: scope === "instance" ? null : collectionId,
      groupId: group.id,
      permissionLevelId,
    };

    const existingGrant = findExistingGrant(group.id);
    const grant = await saveRule.mutateAsync(
      existingGrant
        ? // creating onto an occupied pair replaces the grant there,
          // matching the warning above
          { kind: "update", grantId: existingGrant.grantId, rule }
        : { kind: "create", rule }
    );

    isOpen.value = false;
    emit("created", {
      group,
      rowKey: permissionRowKey(scope, grant.id),
      isNewGroup: isNewlyCreated,
    });
  } catch {
    // each failed mutation toasted from its own onError, this only keeps
    // the form up to try again
  }
}
</script>
