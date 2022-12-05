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

  const adminNavChildren = [
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
  ];

  const superAdminNavChildren = [
    { id: "divider", name: "---", href: null },
    {
      id: "admin.superAdmin",
      name: "Super Admin 🦸‍♀️",
      href: `${BASE_URL}/admin`,
    },
    {
      id: "admin.logs",
      name: "Logs",
      href: `${BASE_URL}/admin/logs`,
    },
  ];

  return {
    id: "admin",
    name: "Admin",
    href: null,
    children: [
      ...adminNavChildren,
      ...(currentUser.isSuperAdmin ? superAdminNavChildren : []),
    ],
  };
}

/**
 * creates a top level super admin menu within the app menu
 */
export function createSuperAdminMenu({
  currentUser,
}: {
  currentUser: User | null;
}): NavItem | null {
  if (!currentUser || !currentUser.isSuperAdmin) {
    return null;
  }

  return {
    id: "superAdmin",
    name: "Super Admin 🦸‍♀️",
    href: null,
    children: [
      {
        id: "superAdmin.instances",
        name: "Manage Instances",
        href: `${BASE_URL}/instances`,
      },
      {
        id: "superAdmin.errorLogs",
        name: "Error Logs",
        href: `${BASE_URL}/admin/logs`,
      },
      {
        id: "superAdmin.processingLogs",
        name: "Processing Logs",
        href: `${BASE_URL}/admin/processingLogs`,
      },
      {
        id: "superAdmin.jobQueueStatus",
        name: "Job Queue Status",
        href: `${BASE_URL}/admin/beanstalk`,
      },
      {
        id: "superAdmin.pendingDeletes",
        name: "Pending Deletions",
        href: `${BASE_URL}/admin/showPendingDeletes`,
      },
      {
        id: "superAdmin.updateDateHolds",
        name: "Run: Update Date Holds ",
        href: `${BASE_URL}/admin/updateDateHolds`,
      },
      {
        id: "superAdmin.hiddenAssets",
        name: "Hidden Assets",
        href: `${BASE_URL}/admin/hiddenAssets`,
      },
      {
        id: "superAdmin.recentAssets",
        name: "Recent Assets",
        href: `${BASE_URL}/admin/recentAssets`,
      },
      {
        id: "superAdmin.deletedAssets",
        name: "Deleted Assets",
        href: `${BASE_URL}/admin/deletedAssets`,
      },
      {
        id: "superAdmin.APIKeys",
        name: "API Keys",
        href: `${BASE_URL}/admin/apiKeys`,
      },
      {
        id: "superAdmin.users",
        name: "Users",
        href: `${BASE_URL}/admin/users`,
      },
      {
        id: "superAdmin.oldAdminPage",
        name: "Old Admin Page",
        href: `${BASE_URL}/admin`,
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
