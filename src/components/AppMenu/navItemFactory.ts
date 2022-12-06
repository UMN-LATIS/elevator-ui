/**
 * items that should be shown in the app menu
 * with the pages
 */

import { NavItem, ElevatorInstance, User, Page } from "@/types";
import config from "@/config";

const BASE_URL = config.instance.base.url;

// function getHrefForPage(page: Page): string {
//   return `${BASE_URL}/page/view/${page.id}`;
// }

// function isCurrentPage(page: Page): boolean {
//   return getHrefForPage(page) === window.location.href;
// }

// /**
//  * normalizes the page data from the api
//  */
// function toNavItem(page: Page): NavItem {
//   return {
//     id: page.id,
//     name: page.title,
//     isCurrentPage: isCurrentPage(page),
//     href: getHrefForPage(page),
//   };
// }

// export function createPagesMenu(pages: Page[]): NavItem[] {
//   return pages.map((page) => {
//     const parentNavItem = toNavItem(page);

//     if (!page.children || page.children.length === 0) {
//       return parentNavItem;
//     }

//     return {
//       ...parentNavItem,
//       children: [
//         // the first page of the children group should be
//         // the parent page, then all the child pages follow
//         parentNavItem,
//         ...page.children.map(toNavItem),
//       ],
//     };
//   });
// }

// export function createHelpMenu({
//   instance,
// }: {
//   instance: ElevatorInstance;
// }): NavItem {
//   return {
//     id: "help",
//     name: "Help",
//     href: null,
//     children: [
//       {
//         id: "help.documentation",
//         name: "Documentation",
//         href: "http://umn-latis.github.io/elevator/",
//       },
//       {
//         id: "help.contact",
//         name: "Contact Us",
//         href: instance.contact,
//       },
//     ],
//   };
// }

// export function createAdminMenu({
//   currentUser,
//   instance,
// }: {
//   instance: ElevatorInstance;
//   currentUser: User | null;
// }): NavItem | null {
//   if (!currentUser || !currentUser.isAdmin) {
//     return null;
//   }

//   const adminNavChildren = [
//     {
//       id: "admin.instanceSettings",
//       name: "Instance Settings",
//       href: `${BASE_URL}/instances/edit/${instance.id}`,
//     },
//     {
//       id: "admin.permissions",
//       name: "Instance Permissions",
//       href: `${BASE_URL}/permissions/edit/instance/${instance.id}`,
//     },
//     {
//       id: "admin.pages",
//       name: "Instance Pages",
//       href: `${BASE_URL}/instances/customPages`,
//     },
//     {
//       id: "admin.reports",
//       name: "Reports",
//       href: `${BASE_URL}/reports`,
//     },
//     {
//       id: "admin.templates",
//       name: "Edit Templates",
//       href: `${BASE_URL}/templates`,
//     },
//     {
//       id: "admin.collections",
//       name: "Edit Collections",
//       href: `${BASE_URL}/collectionManager`,
//     },
//     {
//       id: "admin.importFromCSV",
//       name: "Import from CSV",
//       href: `${BASE_URL}/assetManager/importFromCSV`,
//     },
//     {
//       id: "admin.exportToCSV",
//       name: "Export to CSV",
//       href: `${BASE_URL}/assetManager/exportCSV`,
//     },
//   ];

//   const superAdminNavChildren = [
//     { id: "divider", name: "---", href: null },
//     {
//       id: "admin.superAdmin",
//       name: "Super Admin 🦸‍♀️",
//       href: `${BASE_URL}/admin`,
//     },
//     {
//       id: "admin.logs",
//       name: "Logs",
//       href: `${BASE_URL}/admin/logs`,
//     },
//   ];

//   return {
//     id: "admin",
//     name: "Admin",
//     href: null,
//     children: [
//       ...adminNavChildren,
//       ...(currentUser.isSuperAdmin ? superAdminNavChildren : []),
//     ],
//   };
// }

export function createEditMenu({
  currentUser,
  assetId,
}: {
  currentUser: User | null;
  assetId: string | null;
}): NavItem | null {
  if (!currentUser || !currentUser.canManageAssets || !assetId) {
    return null;
  }

  return {
    id: "edit",
    name: "Edit",
    href: null,
    children: [
      {
        id: "edit.addAsset",
        name: "Add Asset",
        href: `${BASE_URL}/assetManager/addAssetModal`,
      },
      {
        id: "edit.editAsset",
        name: "Edit Asset",
        href: `${BASE_URL}/assetManager/editAsset/${assetId}`,
      },
      {
        id: "edit.deleteAsset",
        name: "Delete Asset",
        href: `${BASE_URL}/assetManager/deleteAsset/${assetId}`,
      },

      {
        id: "edit.assetIndex",
        name: "All my Assets",
        href: `${BASE_URL}/assetManager/userAssets/`,
      },
    ],
  };
}

// export function createCollectionsNavItem() {
//   return {
//     id: "collections",
//     name: "Collections",
//     href: `${BASE_URL}/search/listCollections`,
//   };
// }

// export function createDrawersNavItem() {
//   return {
//     id: "drawers",
//     name: "Drawers",
//     href: `${BASE_URL}/drawers/listDrawers`,
//   };
// }
