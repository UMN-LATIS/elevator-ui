/**
 * items that should be shown in the app menu
 * with the pages
 */

import { NavItem, ElevatorInstance, User } from "@/types";
import config from "@/config";

const BASE_URL = config.instance.base.url;

export function createHelpMenu({
  instance,
}: {
  instance: ElevatorInstance;
}): NavItem {
  return {
    id: "help",
    name: "Help",
    href: null,
    children: [
      {
        id: "help.documentation",
        name: "Documentation",
        href: "http://umn-latis.github.io/elevator/",
      },
      {
        id: "help.contact",
        name: "Contact Us",
        href: instance.contact,
      },
    ],
  };
}

export function createAdminMenu({
  currentUser,
  instance,
}: {
  instance: ElevatorInstance;
  currentUser: User | null;
}): NavItem | null {
  if (!currentUser || !currentUser.isAdmin) {
    return null;
  }

  return {
    id: "admin",
    name: "Admin",
    href: null,
    children: [
      {
        id: "admin.instanceSettings",
        name: "Instance Settings",
        href: `${BASE_URL}/instances/edit/${instance.id}`,
      },
      {
        id: "admin.permissions",
        name: "Instance Permissions",
        href: `${BASE_URL}/permissions/edit/instance/${instance.id}`,
      },
      {
        id: "admin.pages",
        name: "Instance Pages",
        href: `${BASE_URL}/instances/customPages`,
      },
      {
        id: "admin.reports",
        name: "Reports",
        href: `${BASE_URL}/reports`,
      },
      {
        id: "admin.templates",
        name: "Edit Templates",
        href: `${BASE_URL}/templates`,
      },
      {
        id: "admin.collections",
        name: "Edit Collections",
        href: `${BASE_URL}/collectionManager`,
      },
      {
        id: "admin.importFromCSV",
        name: "Import from CSV",
        href: `${BASE_URL}/assetManager/importFromCSV`,
      },
      {
        id: "admin.exportToCSV",
        name: "Export to CSV",
        href: `${BASE_URL}/assetManager/exportCSV`,
      },
    ],
  };
}

export function createEditMenu({
  currentUser,
}: {
  currentUser: User | null;
}): NavItem | null {
  if (!currentUser || !currentUser.canManageAssets) {
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
        id: "edit.assetIndex",
        name: "All my Assets",
        href: `${BASE_URL}/assetManager/userAssets/`,
      },
    ],
  };
}

export function createCollectionsNavItem() {
  return {
    id: "collections",
    name: "Collections",
    href: `${BASE_URL}/search/listCollections`,
  };
}

export function createDrawersNavItem() {
  return {
    id: "drawers",
    name: "Drawers",
    href: `${BASE_URL}/drawers/listDrawers`,
  };
}
