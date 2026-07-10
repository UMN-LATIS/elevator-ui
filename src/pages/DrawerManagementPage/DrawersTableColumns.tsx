import { createColumnHelper } from "@tanstack/vue-table";
import type { ManageableDrawer } from "@/types";
import Link from "@/components/Link/Link.vue";
import { ColHeader } from "../AdminPermissionsPage/ColHeader";

const columnHelper = createColumnHelper<ManageableDrawer>();

function toDrawerTitle(drawer: ManageableDrawer): string {
  return drawer.title || `Drawer ${drawer.id}`;
}

export const drawerColumns = [
  columnHelper.accessor(toDrawerTitle, {
    id: "title",
    header: () => <ColHeader text="Title" />,
    cell: (ctx) => (
      <Link
        to={`/drawers/viewDrawer/${ctx.row.original.id}`}
        class="text-sm font-medium">
        {ctx.getValue()}
      </Link>
    ),
  }),
];
