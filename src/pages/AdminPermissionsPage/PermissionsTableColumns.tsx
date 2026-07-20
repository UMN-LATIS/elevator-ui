import type { Ref } from "vue";
import { createColumnHelper } from "@tanstack/vue-table";
import type { RowData } from "@tanstack/vue-table";
import {
  CheckIcon,
  CircleMinusIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
} from "lucide-vue-next";
import { cn } from "@/lib/utils";
import Chip from "@/components/Chip/Chip.vue";
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import IconButton from "@/components/IconButton/IconButton.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import PermissionChip from "@/components/PermissionChip/PermissionChip.vue";
import PermissionSelect from "@/components/PermissionSelect/PermissionSelect.vue";
import type { PermissionSelectOption } from "@/components/PermissionSelect/buildPermissionOptions";
import ChevronRightIcon from "@/icons/ChevronRightIcon.vue";
import { VerticalDotsIcon } from "@/icons";
import { toGroupSummary } from "../DrawerManagementPage/toGroupSummary";
import { ColHeader } from "./ColHeader";
import type { PermissionRow } from "./buildPermissionsPageRows";

declare module "@tanstack/vue-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    // Tailwind width class applied to the column's header cells. The
    // tables use table-fixed layout so widths hold steady while
    // filtering adds and removes rows.
    widthClass?: string;
  }
}

const columnHelper = createColumnHelper<PermissionRow>();

// Each menu item lays its icon out inside its own row, since the item
// itself is a block that the dropdown sizes and pads.
const MENU_ITEM_CLASS = "flex items-center gap-2";

// What a row's in-flight save submitted, which its cells show in place
// of the stale values the list holds until the refetch lands.
export interface SavingRow {
  key: string;
  groupLabel: string;
  levelLabel: string;
}

// The Edit action turns a row into its own editor: the group's name
// where the label was, the level where the chip was. Only one row edits
// at a time, so one set of drafts and one editing key drive every cell.
export interface PermissionColumnsDeps {
  editingKey: Ref<string | null>;
  draftLabel: Ref<string>;
  draftLevelId: Ref<number | null>;
  savingRow: Ref<SavingRow | null>;
  permissionOptions: Ref<PermissionSelectOption[]>;
  onEdit: (row: PermissionRow) => void;
  onCancel: () => void;
  onSave: (row: PermissionRow) => void;
  onRemovePermission: (row: PermissionRow) => void;
  onDeleteGroup: (row: PermissionRow) => void;
}

const scopeLabelByScope = {
  instance: "Instance",
  collection: "Collection",
} as const;

const scopeChipClassByScope = {
  instance: "bg-secondary-container text-on-secondary-container",
  collection: "bg-tertiary-container text-on-tertiary-container",
} as const;

export const createPermissionColumns = (deps: PermissionColumnsDeps) => [
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
          aria-label={`Toggle details for ${row.original.groupLabel}`}
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
  columnHelper.accessor("scope", {
    id: "scope",
    header: () => <ColHeader text="Scope" />,
    meta: { widthClass: "w-[12%]" },
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
      meta: { widthClass: "w-[20%]" },
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
  // The name leads the accessor so the column sorts by it, and the type
  // trails so the one search box still reaches a group by what it is.
  columnHelper.accessor((row) => `${row.groupLabel} ${row.typeLabel}`, {
    id: "group",
    header: () => <ColHeader text="Group" />,
    meta: { widthClass: "w-[32%]" },
    cell: (ctx) => {
      const row = ctx.row.original;

      if (deps.editingKey.value === row.key) {
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
        savingRow?.key === row.key ? savingRow.groupLabel : row.groupLabel;

      const details = (
        <>
          <div class="truncate text-sm font-medium text-on-surface">{name}</div>
          <div class="truncate text-xs text-on-surface-variant">
            {toGroupSummary(row.group, row.typeLabel)}
          </div>
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
    meta: { widthClass: "w-[20%]" },
    cell: (ctx) => {
      const row = ctx.row.original;

      if (deps.editingKey.value === row.key) {
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

      const savingRow = deps.savingRow.value;
      if (savingRow?.key === row.key && savingRow.levelLabel) {
        return <PermissionChip label={savingRow.levelLabel} isPending />;
      }

      // A level 0 grant permits nothing, so it reads as quiet text
      // rather than as a chip claiming the group holds something.
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
    cell: ({ row }: { row: { original: PermissionRow } }) => {
      const permissionRow = row.original;

      if (deps.editingKey.value === permissionRow.key) {
        // A group needs a name, and an empty field is a mistake rather
        // than an intent to clear one.
        const isIncomplete =
          deps.draftLabel.value.trim() === "" ||
          deps.draftLevelId.value === null;

        return (
          <div class="flex justify-end">
            <IconButton
              onClick={() => deps.onSave(permissionRow)}
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
          {/* portal, so the table's overflow container cannot clip the menu */}
          <DropDown showChevron={false} portal labelClass="!p-1 rounded-full">
            {{
              label: () => (
                <>
                  <VerticalDotsIcon />
                  <span class="sr-only">
                    More options for {permissionRow.groupLabel}
                  </span>
                </>
              ),
              default: () => (
                <>
                  <DropDownItem
                    is="button"
                    type="button"
                    onClick={() => deps.onEdit(permissionRow)}>
                    <span class={MENU_ITEM_CLASS}>
                      <PencilIcon class="size-4 shrink-0" />
                      Edit Group
                    </span>
                  </DropDownItem>
                  <DropDownItem
                    is="button"
                    type="button"
                    onClick={() => deps.onRemovePermission(permissionRow)}>
                    <span class={MENU_ITEM_CLASS}>
                      <CircleMinusIcon class="size-4 shrink-0" />
                      Remove Permission
                    </span>
                  </DropDownItem>
                  <DropDownItem
                    is="button"
                    type="button"
                    onClick={() => deps.onDeleteGroup(permissionRow)}>
                    <span class={cn(MENU_ITEM_CLASS, "text-error")}>
                      <TrashIcon class="size-4 shrink-0" />
                      Delete Group
                    </span>
                  </DropDownItem>
                </>
              ),
            }}
          </DropDown>
        </div>
      );
    },
  },
];
