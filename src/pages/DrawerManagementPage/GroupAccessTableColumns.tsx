import type { Ref } from "vue";
import { createColumnHelper } from "@tanstack/vue-table";
import {
  CheckIcon,
  CircleMinusIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
} from "lucide-vue-next";
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import IconButton from "@/components/IconButton/IconButton.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import PermissionChip from "@/components/PermissionChip/PermissionChip.vue";
import PermissionSelect from "@/components/PermissionSelect/PermissionSelect.vue";
import type { PermissionSelectOption } from "@/components/PermissionSelect/buildPermissionOptions";
import ChevronRightIcon from "@/icons/ChevronRightIcon.vue";
import { VerticalDotsIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { ColHeader } from "../AdminPermissionsPage/ColHeader";
import type { GroupAccessRow } from "./buildGroupAccessRows";
import { toGroupSummary } from "./toGroupSummary";

const columnHelper = createColumnHelper<GroupAccessRow>();

// Each menu item lays its icon out inside its own row, since the item
// itself is a block that the dropdown sizes and pads.
const MENU_ITEM_CLASS = "flex items-center gap-2";

// What a row's in-flight save submitted, which its cells show in place
// of the stale values the list holds until the refetch lands.
export interface SavingRow {
  id: number;
  groupLabel: string;
  levelLabel: string;
}

// The Edit action turns a row into its own editor: the group's name
// where the summary was, the level where the chip was. Only one row
// edits at a time, so one set of drafts and one editing id drive every
// cell.
export interface GroupAccessColumnsDeps {
  editingRowId: Ref<number | null>;
  draftLabel: Ref<string>;
  draftLevelId: Ref<number | null>;
  savingRow: Ref<SavingRow | null>;
  permissionOptions: Ref<PermissionSelectOption[]>;
  onEdit: (row: GroupAccessRow) => void;
  onCancel: () => void;
  onSave: (row: GroupAccessRow) => void;
  onRemovePermissions: (row: GroupAccessRow) => void;
  onDeleteGroup: (row: GroupAccessRow) => void;
}

export const createGroupAccessColumns = (deps: GroupAccessColumnsDeps) => [
  columnHelper.display({
    id: "expander",
    header: () => null,
    enableSorting: false,
    meta: { widthClass: "w-10" },
    cell: ({ row }) =>
      row.getCanExpand() ? (
        <button
          type="button"
          aria-expanded={row.getIsExpanded()}
          aria-label={`Toggle members of ${row.original.groupLabel}`}
          class="flex size-8 items-center justify-center rounded-full hover:bg-surface-container-highest focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={row.getToggleExpandedHandler()}>
          <ChevronRightIcon
            class={cn(
              "!size-4 text-on-surface-variant transition-transform",
              row.getIsExpanded() && "rotate-90"
            )}
          />
        </button>
      ) : null,
  }),
  // The name leads the accessor so the column sorts by it, and the type
  // trails so the one search box still reaches a group by what it is.
  columnHelper.accessor((row) => `${row.groupLabel} ${row.typeLabel}`, {
    id: "group",
    header: () => <ColHeader text="Group" />,
    meta: { widthClass: "w-[50%]" },
    cell: (ctx) => {
      const row = ctx.row.original;

      // Who made a group is not who may manage it, so the creator is a
      // way to tell two like-named groups apart rather than a warning.
      const creator =
        row.group.ownerName && !row.group.ownedByCurrentUser
          ? `Created by ${row.group.ownerName}`
          : null;

      // Renaming reaches the caller's own groups only, so someone
      // else's row keeps the plain display below while it edits.
      if (deps.editingRowId.value === row.id && row.group.ownedByCurrentUser) {
        // A group's type is fixed at creation, since its members belong
        // to that type, so only the name is up for editing.
        return (
          <div>
            <InputGroup<string>
              modelValue={deps.draftLabel.value}
              onUpdate:modelValue={(value: string) => {
                deps.draftLabel.value = value;
              }}
              placeholder="Group name"
              label="Group name"
            />
            <div class="mt-1 truncate text-xs text-on-surface-variant">
              {toGroupSummary(row.group, row.typeLabel)}
            </div>
          </div>
        );
      }

      const savingRow = deps.savingRow.value;
      const name =
        savingRow?.id === row.id ? savingRow.groupLabel : row.groupLabel;

      const details = (
        <>
          <div class="truncate text-sm font-medium text-on-surface">{name}</div>
          <div class="truncate text-xs text-on-surface-variant">
            {toGroupSummary(row.group, row.typeLabel)}
          </div>
          {creator ? (
            <div class="truncate text-xs text-on-surface-variant">
              {creator}
            </div>
          ) : null}
        </>
      );

      if (!ctx.row.getCanExpand()) return <div>{details}</div>;

      // the group's text is a larger target for the chevron's toggle
      return (
        <button
          type="button"
          aria-expanded={ctx.row.getIsExpanded()}
          class="block w-full cursor-pointer text-left"
          onClick={ctx.row.getToggleExpandedHandler()}>
          {details}
        </button>
      );
    },
  }),
  columnHelper.accessor("permissionLabel", {
    id: "permission",
    header: () => <ColHeader text="Permission" />,
    meta: { widthClass: "w-[30%]" },
    cell: (ctx) => {
      const row = ctx.row.original;

      if (deps.editingRowId.value === row.id) {
        return (
          <PermissionSelect
            modelValue={deps.draftLevelId.value}
            onUpdate:modelValue={(value: number) => {
              deps.draftLevelId.value = value;
            }}
            options={deps.permissionOptions.value}
            label="Permission"
            placeholder="Select a permission…"
          />
        );
      }

      const savingRow = deps.savingRow.value;
      if (savingRow?.id === row.id) {
        return <PermissionChip label={savingRow.levelLabel} isPending />;
      }

      // No access is the absence of a permission, so it reads as quiet
      // text rather than as a chip claiming the group holds something.
      if (row.permissionLevelNumber === 0) {
        return (
          <span class="text-sm text-on-surface-muted">{ctx.getValue()}</span>
        );
      }

      return (
        <PermissionChip
          levelNumber={row.permissionLevelNumber}
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
    cell: ({ row }: { row: { original: GroupAccessRow } }) => {
      const accessRow = row.original;

      if (deps.editingRowId.value === accessRow.id) {
        // A group needs a name, and an empty field is a mistake rather
        // than an intent to clear one.
        const isIncomplete =
          deps.draftLevelId.value === null ||
          (accessRow.group.ownedByCurrentUser &&
            deps.draftLabel.value.trim() === "");

        return (
          <div class="flex justify-end">
            <IconButton
              onClick={() => deps.onSave(accessRow)}
              disabled={isIncomplete}
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
          <DropDown showChevron={false} labelClass="!p-1 rounded-full">
            {{
              label: () => (
                <>
                  <VerticalDotsIcon />
                  <span class="sr-only">
                    More options for {accessRow.groupLabel}
                  </span>
                </>
              ),
              default: () => (
                <>
                  <DropDownItem
                    is="button"
                    type="button"
                    onClick={() => deps.onEdit(accessRow)}>
                    <span class={MENU_ITEM_CLASS}>
                      <PencilIcon class="size-4 shrink-0" />
                      Edit Group
                    </span>
                  </DropDownItem>
                  {/* A group with no rule has no permissions to take away. */}
                  {accessRow.grantId !== null ? (
                    <DropDownItem
                      is="button"
                      type="button"
                      onClick={() => deps.onRemovePermissions(accessRow)}>
                      <span class={MENU_ITEM_CLASS}>
                        <CircleMinusIcon class="size-4 shrink-0" />
                        Remove Permissions
                      </span>
                    </DropDownItem>
                  ) : null}
                  {/* Deleting reaches the caller's own groups only, so
                      someone else's is never theirs to remove. */}
                  {accessRow.group.ownedByCurrentUser ? (
                    <DropDownItem
                      is="button"
                      type="button"
                      onClick={() => deps.onDeleteGroup(accessRow)}>
                      <span class={cn(MENU_ITEM_CLASS, "text-error")}>
                        <TrashIcon class="size-4 shrink-0" />
                        Delete Group
                      </span>
                    </DropDownItem>
                  ) : null}
                </>
              ),
            }}
          </DropDown>
        </div>
      );
    },
  },
];
