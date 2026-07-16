import type { Ref } from "vue";
import { createColumnHelper } from "@tanstack/vue-table";
import {
  CheckIcon,
  LockIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
} from "lucide-vue-next";
import IconButton from "@/components/IconButton/IconButton.vue";
import Link from "@/components/Link/Link.vue";
import PermissionChip from "@/components/PermissionChip/PermissionChip.vue";
import PermissionSelect from "@/components/PermissionSelect/PermissionSelect.vue";
import type { PermissionSelectOption } from "@/components/PermissionSelect/buildPermissionOptions";
import { ColHeader } from "../AdminPermissionsPage/ColHeader";
import type { DrawerRuleRow } from "./buildRuleRows";

const columnHelper = createColumnHelper<DrawerRuleRow>();

export interface SavingRule {
  id: number;
  levelLabel: string;
}

// The Edit action swaps a row's permission cell for an inline select
// instead of opening a modal. Only one row edits at a time, so a single
// draft level and editing id drive every cell.
export interface RuleColumnsDeps {
  editingRuleId: Ref<number | null>;
  draftLevelId: Ref<number | null>;
  savingRule: Ref<SavingRule | null>;
  // admins reach every drawer, so they may delete a rule for a group
  // they do not own
  canDeleteAnyRule: Ref<boolean>;
  permissionOptions: Ref<PermissionSelectOption[]>;
  onEdit: (rule: DrawerRuleRow) => void;
  onCancel: () => void;
  onSave: (rule: DrawerRuleRow) => void;
  onDelete: (rule: DrawerRuleRow) => void;
}

export const createRuleColumns = (deps: RuleColumnsDeps) => [
  columnHelper.accessor("drawerTitle", {
    id: "drawer",
    header: () => <ColHeader text="Drawer" />,
    meta: { widthClass: "w-[30%]" },
    cell: (ctx) => (
      <Link
        to={`/drawers/viewDrawer/${ctx.row.original.drawerId}`}
        class="text-sm font-medium">
        {ctx.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("groupLabel", {
    id: "group",
    header: () => <ColHeader text="Group" />,
    meta: { widthClass: "w-[25%]" },
    cell: (ctx) => {
      const rule = ctx.row.original;

      // The Groups tab lists only the caller's own groups, so linking
      // someone else's would land on a row that is not there. The lock
      // needs a reason either way, and a global group type has no owner
      // to name.
      if (!rule.isOwnGroup) {
        const ownership = rule.ownerName
          ? `Owned by ${rule.ownerName}`
          : "Not one of your groups";

        return (
          <div>
            <div class="flex items-center gap-1.5">
              <LockIcon
                aria-hidden="true"
                class="size-3 shrink-0 text-on-surface-variant"
              />
              <span class="truncate text-sm text-on-surface">
                {ctx.getValue()}
              </span>
            </div>
            <div class="truncate pl-[1.125rem] text-xs text-on-surface-variant">
              {ownership}
            </div>
          </div>
        );
      }

      // The Groups tab consumes ?group=<id> and reveals that group's row.
      return (
        <Link
          to={{ query: { tab: "groups", group: String(rule.groupId) } }}
          class="text-sm">
          {ctx.getValue()}
        </Link>
      );
    },
  }),
  columnHelper.accessor("permissionLabel", {
    id: "permission",
    header: () => <ColHeader text="Permission" />,
    meta: { widthClass: "w-[30%]" },
    cell: (ctx) => {
      const rule = ctx.row.original;

      if (deps.editingRuleId.value === rule.id) {
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

      const savingRule = deps.savingRule.value;
      if (savingRule?.id === rule.id) {
        return (
          <PermissionChip
            levelNumber={rule.permissionLevelNumber}
            label={savingRule.levelLabel}
            isPending
          />
        );
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
    cell: ({ row }: { row: { original: DrawerRuleRow } }) => {
      const rule = row.original;

      if (deps.editingRuleId.value === rule.id) {
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
          {/* Deleting another owner's rule is one-way for a manager,
              since a new rule can only name a group they own. Editing it
              to No Permissions revokes the access and leaves the rule to
              its owner. */}
          {rule.isOwnGroup || deps.canDeleteAnyRule.value ? (
            <IconButton
              onClick={() => deps.onDelete(rule)}
              title="Delete Rule"
              showTooltip={false}
              class="enabled:text-error enabled:hover:bg-error-container enabled:hover:text-on-error-container">
              <TrashIcon class="size-4" />
            </IconButton>
          ) : null}
        </div>
      );
    },
  },
];
