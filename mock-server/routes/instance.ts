import { Hono } from "hono";
import { delay } from "../utils";
import type { MockServerContext } from "../types.js";
import {
  ApiInstanceNavResponse,
  ShowCustomHeaderMode,
} from "../../src/types";

const app = new Hono<MockServerContext>();

// GET /home/getInstanceNav
app.get("/getInstanceNav", async (c) => {
  await delay(150);
  const db = c.get("db");
  const user = c.get("user");
  const instance = db.instances.getDefault();

  const templates = db.templates.getAll().reduce((acc, template) => {
    return {
      ...acc,
      [template.templateId]: template.templateName,
    };
  }, {} as Record<number, string>);

  const response: ApiInstanceNavResponse = {
    // user fields
    userId: user?.id ?? null,
    userDisplayName: user?.displayName ?? null,
    userIsAdmin: user?.isInstanceAdmin ?? false,
    userIsSuperAdmin: user?.isSuperAdmin ?? false,
    userCanCreateDrawers: user?.permissions.canCreateDrawers ?? false,
    userCanSearchAndBrowse: user?.permissions.canSearchAndBrowse ?? false,
    userIsloggedIn: true,
    userCanManageAssets: user?.permissions.canManageAssets ?? false,

    // instance fields — mapped from InstanceSettings
    instanceId: instance.instanceId,
    instanceName: instance.name,
    instanceHasLogo: instance.useHeaderLogo,
    instanceLogo: 0, // no numeric logo ID in InstanceSettings
    instanceShowCollectionInSearchResults: instance.showCollectionInSearchResults,
    instanceShowTemplateInSearchResults: instance.showTemplateInSearchResults,
    contact: instance.ownerHomepage ?? "",
    useCentralAuth: instance.useCentralAuth,
    centralAuthLabel: instance.centralAuthLabel,
    sortableFields: {}, // not stored in InstanceSettings
    customHeaderMode: instance.useCustomHeader as ShowCustomHeaderMode,
    customHeader: instance.customHeaderText,
    customFooter: instance.customFooterText,
    useVoyagerViewer: instance.useVoyagerViewer,
    useCustomCSS: instance.useCustomCSS,
    featuredAssetId: instance.featuredAsset ?? "",
    featuredAssetText: instance.featuredAssetText ?? "",
    theming: {
      enabled: instance.enableTheming,
      availableThemes: instance.availableThemes ?? [],
      defaultTheme: instance.defaultTheme ?? "",
    },

    // relational data
    templates,
    pages: db.pages.getAllWithoutContent(),
    collections: db.collections.getAllAsRawAssetCollections(),
  };

  return c.json(response);
});

export default app;
