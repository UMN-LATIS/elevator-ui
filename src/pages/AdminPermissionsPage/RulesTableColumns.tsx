import type { Ref } from "vue";
import { createColumnHelper } from "@tanstack/vue-table";
import { RouterLink } from "vue-router";
import { PencilIcon, TrashIcon, CheckIcon, XIcon } from "lucide-vue-next";
import { cn } from "@/lib/utils";
import IconButton from "@/components/IconButton/IconButton.vue";
import type { PermissionRuleRow } from "./buildRuleRows";
import { ColHeader } from "./ColHeader";
import Chip from "@/components/Chip/Chip.vue";
import PermissionChip from "@/components/PermissionChip/PermissionChip.vue";
import PermissionSelect from "@/components/PermissionSelect/PermissionSelect.vue";
import type { PermissionSelectOption } from "@/components/PermissionSelect/buildPermissionOptions";

const columnHelper = createColumnHelper<PermissionRuleRow>();

// The Edit action swaps a row's permission cell for an inline select
// instead of opening a modal. Only one row edits at a time, so a single
// draft level and editing key drive every cell.
export interface RuleColumnsDeps {
  editingKey: Ref<string | null>;
  draftLevelId: Ref<number | null>;
  savingKey: Ref<string | null>;
  savingLevelLabel: Ref<string>;
  permissionOptions: Ref<PermissionSelectOption[]>;
  onEdit: (rule: PermissionRuleRow) => void;
  onCancel: () => void;
  onSave: (rule: PermissionRuleRow) => void;
  onDelete: (rule: PermissionRuleRow) => void;
}

const scopeLabelByScope: Record<PermissionRuleRow["scope"], string> = {
  instance: "Instance",
  collection: "Collection",
};

const scopeChipClassByScope: Record<PermissionRuleRow["scope"], string> = {
  instance: "bg-secondary-container text-on-secondary-container",
  collection: "bg-tertiary-container text-on-tertiary-container",
};

export const createRuleColumns = (deps: RuleColumnsDeps) => [
  columnHelper.accessor("scope", {
    id: "scope",
    header: () => <ColHeader text="Scope" />,
    meta: { widthClass: "w-[15%]" },
    cell: (ctx) => (
      <Chip
        class={cn(
          "border border-outline-variant bg-surface-container",
          scopeChipClassByScope[ctx.getValue()]
        )}>
        {scopeLabelByScope[ctx.getValue()]}
      </Chip>
    ),
  }),
  columnHelper.accessor(
    // Instance rules span every collection, shown and filtered as "*"
    // rather than a title.
    (row) => (row.scope === "instance" ? "*" : row.collectionLabel),
    {
      id: "collection",
      header: () => <ColHeader text="Collection" />,
      meta: { widthClass: "w-[25%]" },
      cell: (ctx) => (
        <div
          class={cn(
            "text-sm text-on-surface font-medium",
            ctx.row.original.scope === "instance" && "italic"
          )}>
          {ctx.getValue()}
        </div>
      ),
    }
  ),
  columnHelper.accessor("groupLabel", {
    id: "group",
    header: () => <ColHeader text="Group" />,
    meta: { widthClass: "w-[20%]" },
    // The Groups tab consumes ?revealGroup and opens that group's row.
    cell: (ctx) => (
      <RouterLink
        to={{
          query: {
            tab: "groups",
            revealGroup: String(ctx.row.original.groupId),
          },
        }}
        class="text-sm text-primary underline-offset-2 hover:underline">
        {ctx.getValue()}
      </RouterLink>
    ),
  }),
  columnHelper.accessor("permissionLabel", {
    id: "permission",
    header: () => <ColHeader text="Permission" />,
    meta: { widthClass: "w-[35%]" },
    cell: (ctx) => {
      const rule = ctx.row.original;

      if (deps.editingKey.value === rule.key) {
        return (
          <PermissionSelect
            modelValue={deps.draftLevelId.value}
            onUpdate:modelValue={(value: number) => {
              deps.draftLevelId.value = value;
            }}
            options={deps.permissionOptions.value}
            label="Permission"
            showLabel={false}
            placeholder="Select a permission…"
          />
        );
      }

      if (deps.savingKey.value === rule.key) {
        return <PermissionChip label={deps.savingLevelLabel.value} isPending />;
      }

      return (
        <PermissionChip
          levelNumber={rule.permissionLevelNumber}
          label={ctx.getValue()}
        />
      );
    },
  }),
  {
    id: "actions",
    header: () => null,
    enableSorting: false,
    meta: { widthClass: "w-20" },
    cell: ({ row }: { row: { original: PermissionRuleRow } }) => {
      const rule = row.original;

      if (deps.editingKey.value === rule.key) {
        return (
          <div class="flex justify-end">
            <IconButton
              onClick={() => deps.onSave(rule)}
              disabled={deps.draftLevelId.value === null}
              title="Save"
              showTooltip={false}
              class="enabled:hover:bg-primary-container enabled:hover:text-on-primary-container">
              <CheckIcon class="size-4" />
            </IconButton>
            <IconButton
              onClick={() => deps.onCancel()}
              title="Cancel"
              showTooltip={false}>
              <XIcon class="size-4" />
            </IconButton>
          </div>
        );
      }

      return (
        <div class="flex justify-end">
          <IconButton
            onClick={() => deps.onEdit(rule)}
            title="Edit Rule"
            showTooltip={false}>
            <PencilIcon class="size-4" />
          </IconButton>
          <IconButton
            onClick={() => deps.onDelete(rule)}
            title="Delete Rule"
            showTooltip={false}
            class="enabled:text-error enabled:hover:bg-error-container enabled:hover:text-on-error-container">
            <TrashIcon class="size-4" />
          </IconButton>
        </div>
      );
    },
  },
];
