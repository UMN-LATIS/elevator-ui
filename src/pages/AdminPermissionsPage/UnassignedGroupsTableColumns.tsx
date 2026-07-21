import type { Ref } from "vue";
import { createColumnHelper } from "@tanstack/vue-table";
import {
  CheckIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "lucide-vue-next";
import { cn } from "@/lib/utils";
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import IconButton from "@/components/IconButton/IconButton.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import ChevronRightIcon from "@/icons/ChevronRightIcon.vue";
import { VerticalDotsIcon } from "@/icons";
import { toGroupSummary } from "../DrawerManagementPage/toGroupSummary";
import { ColHeader } from "./ColHeader";
import type { UnassignedGroupRow } from "./buildPermissionsPageRows";

const columnHelper = createColumnHelper<UnassignedGroupRow>();

// A group whose in-flight rename should already read as its new name.
export interface SavingGroup {
  groupId: number;
  groupLabel: string;
}

// The Edit action swaps the group's label for an input. An unassigned
// group has no permission to edit, so renaming is all Edit does here.
export interface UnassignedGroupColumnsDeps {
  editingGroupId: Ref<number | null>;
  draftLabel: Ref<string>;
  savingGroup: Ref<SavingGroup | null>;
  onEdit: (row: UnassignedGroupRow) => void;
  onCancel: () => void;
  onSave: (row: UnassignedGroupRow) => void;
  onAddPermission: (row: UnassignedGroupRow) => void;
  onDeleteGroup: (row: UnassignedGroupRow) => void;
}

export const createUnassignedGroupColumns = (
  deps: UnassignedGroupColumnsDeps
) => [
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
  // The name leads the accessor so the column sorts by it, and the type
  // trails so the one search box still reaches a group by what it is.
  columnHelper.accessor((row) => `${row.groupLabel} ${row.typeLabel}`, {
    id: "group",
    header: () => <ColHeader text="Group" />,
    cell: (ctx) => {
      const row = ctx.row.original;

      if (deps.editingGroupId.value === row.group.id) {
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

      const savingGroup = deps.savingGroup.value;
      const name =
        savingGroup?.groupId === row.group.id
          ? savingGroup.groupLabel
          : row.groupLabel;

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
  {
    id: "actions",
    header: () => null,
    enableSorting: false,
    meta: { widthClass: "w-20" },
    cell: ({ row }: { row: { original: UnassignedGroupRow } }) => {
      const groupRow = row.original;

      if (deps.editingGroupId.value === groupRow.group.id) {
        // A group needs a name, and an empty field is a mistake rather
        // than an intent to clear one.
        const isIncomplete = deps.draftLabel.value.trim() === "";

        return (
          <div class="flex justify-end">
            <IconButton
              onClick={() => deps.onSave(groupRow)}
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
                    More options for {groupRow.groupLabel}
                  </span>
                </>
              ),
              default: () => (
                <>
                  <DropDownItem
                    is="button"
                    type="button"
                    onClick={() => deps.onEdit(groupRow)}>
                    <span class="flex items-center gap-2">
                      <PencilIcon class="size-4 shrink-0" />
                      Edit Group
                    </span>
                  </DropDownItem>
                  <DropDownItem
                    is="button"
                    type="button"
                    onClick={() => deps.onAddPermission(groupRow)}>
                    <span class="flex items-center gap-2">
                      <PlusIcon class="size-4 shrink-0" />
                      Add Permission
                    </span>
                  </DropDownItem>
                  <DropDownItem
                    is="button"
                    type="button"
                    onClick={() => deps.onDeleteGroup(groupRow)}>
                    <span class="flex items-center gap-2 text-error">
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
