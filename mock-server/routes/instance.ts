import { Hono } from "hono";
import { delay } from "../utils";
import type { MockServerContext } from "../types.js";
import { ApiInstanceNavResponse } from "../../src/types";

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
    ...instance,
    instanceName: instance.name,
    instanceId: instance.id,
    instanceHasLogo: instance.hasLogo,
    instanceLogo: instance.logo,
    instanceShowCollectionInSearchResults:
      instance.showCollectionInSearchResults,
    instanceShowTemplateInSearchResults: instance.showTemplateInSearchResults,
    userId: user?.id ?? null,
    userDisplayName: user?.displayName ?? null,
    userIsAdmin: user?.isInstanceAdmin ?? false,
    userIsSuperAdmin: user?.isSuperAdmin ?? false,
    userCanCreateDrawers: user?.permissions.canCreateDrawers ?? false,
    userCanSearchAndBrowse: user?.permissions.canSearchAndBrowse ?? false,
    userIsloggedIn: true,
    userCanManageAssets: user?.permissions.canManageAssets ?? false,
    templates,
    pages: db.pages.getAllWithoutContent(),
    collections: db.collections.getAllAsRawAssetCollections(),
    featuredAssetId: instance.featuredAssetId ?? "",
    featuredAssetText: instance.featuredAssetText ?? "",
  };

  return c.json(response);
});

export default app;
