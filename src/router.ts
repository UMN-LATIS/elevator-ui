import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router";
import config from "@/config";
// Core-flow pages stay eager so navigation to/from them has no loading flash.
import HomePage from "@/pages/HomePage/HomePage.vue";
import AssetViewPage from "@/pages/AssetViewPage/AssetViewPage.vue";
import BrowseCollectionPage from "./pages/BrowseCollectionPage/BrowseCollectionPage.vue";
import SearchResultsPage from "./pages/SearchResultsPage/SearchResultsPage.vue";
import DrawerViewPage from "./pages/DrawerViewPage/DrawerViewPage.vue";
import { useErrorStore } from "./stores/errorStore";
import { User } from "./types";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    canAccess?: (user: User) => boolean;
  }
}

interface RouterHistoryState {
  preserveScroll?: boolean;
}

function parseIntFromParam(
  param: string | string[] | undefined
): number | null {
  if (typeof param !== "string") {
    return null;
  }
  const parsed = Number.parseInt(param);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * creates a home route based on the config
 * use a custom redirect if one is set
 */
const createHomeRoute = (): RouteRecordRaw => {
  const defaultHomeRoute = {
    name: "home",
    path: "/",
    component: HomePage,
  };

  if (!config.routes.home.redirect) {
    return defaultHomeRoute;
  }

  // if the redirect is a full URL, remove the base url
  const redirect = config.routes.home.redirect.replace(
    config.instance.base.url,
    ""
  );

  // if the redirect is the root url, don't create a redirect route
  // instead just use the default home route to avoid loops
  if (redirect === "/") {
    return defaultHomeRoute;
  }

  return {
    name: "home",
    path: "/",
    redirect,
  };
};

/**
 * Routes that only exist when the adminPermissions feature flag is on.
 * Returning an empty array when the flag is off means the URL falls
 * through to the catchall 404 — instead of triggering sign-in or 403
 * via the auth meta, which would be inconsistent with how other
 * flag-gated URLs behave (they 404).
 */
const createAdminPermissionsRoutes = (): RouteRecordRaw[] => {
  if (!config.features.adminPermissions) return [];
  return [
    {
      name: "adminPermissions",
      path: "/admin/permissions",
      component: () =>
        import("@/pages/AdminPermissionsPage/AdminPermissionsPage.vue"),
      meta: {
        requiresAuth: true,
        canAccess: (user: User) => user.isAdmin,
      },
    },
  ];
};

const createDrawerManagementRoutes = (): RouteRecordRaw[] => {
  if (!config.features.drawerManagement) return [];
  return [
    {
      name: "drawerManagement",
      path: "/drawers/manage",
      component: () =>
        import("@/pages/DrawerManagementPage/DrawerManagementPage.vue"),
      meta: {
        requiresAuth: true,
        canAccess: (user: User) => user.canManageDrawers,
      },
    },
  ];
};

const router = createRouter({
  history: createWebHistory(config.instance.base.path),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }

    const anchor = to.hash
      ? document.getElementById(to.hash.substring(1))
      : null;

    // if the anchor exists on the page, scroll to it
    if (anchor) {
      return {
        el: anchor,
        behavior: "smooth",
        top: 100, // offset to account for app header
      };
    }

    // if we're navigating to the same page, don't scroll
    if (to.path === from.path) return false;

    // preserveScroll flag is set, don't scroll
    const historyState = router.options.history.state as
      | RouterHistoryState
      | undefined;

    if (historyState?.preserveScroll) {
      return false;
    }

    // otherwise scroll to the top of the page
    return {
      top: 0,
    };
  },
  routes: [
    createHomeRoute(),
    {
      // this route is really `/asset/viewAsset/:assetId#:objectId?`
      // but we can't use `#` in the path
      name: "viewAsset",
      path: "/asset/viewAsset/:assetId",
      component: AssetViewPage,
      // component: () => import("@/pages/AssetViewPage/AssetViewPage.vue"),
      props: (route) => ({
        assetId: route.params.assetId,
        objectId: route.hash?.substring(1),
      }),
    },
    {
      name: "viewExcerpt",
      path: "/asset/viewExcerpt/:excerptId",
      component: () => import("@/pages/ExcerptViewPage/ExcerptViewPage.vue"),
      props: (route) => ({
        excerptId: parseIntFromParam(route.params.excerptId),
      }),
    },
    {
      name: "allMyAssets",
      path: "/assetManager/userAssets",
      component: () =>
        import("@/pages/AllUserAssetsPage/AllUserAssetsPage.vue"),
      meta: {
        requiresAuth: true,
        canAccess: (user: User) => user.canManageAssets,
      },
    },
    {
      name: "addInlineRelatedAsset",
      path: "/assetManager/addAsset/:templateId/:collectionId/true",
      component: () =>
        import("@/pages/CreateOrEditAssetPage/InlineCreateOrEditAssetPage.vue"),
      props: (route) => ({
        templateId: parseIntFromParam(route.params.templateId),
        // could be null
        collectionId: parseIntFromParam(route.params.collectionId),
      }),
      meta: {
        requiresAuth: true,
        canAccess: (user: User) => user.canManageAssets,
      },
    },
    {
      name: "editInlineRelatedAsset",
      path: "/assetManager/editAsset/:assetId/true",
      component: () =>
        import("@/pages/CreateOrEditAssetPage/InlineCreateOrEditAssetPage.vue"),
      props: (route) => ({
        assetId: route.params.assetId,
      }),
      meta: {
        requiresAuth: true,
        canAccess: (user: User) => user.canManageAssets,
      },
    },
    {
      name: "editAsset",
      path: "/assetManager/editAsset/:assetId?",
      alias: "/assetManager/addAsset",
      component: () =>
        import("@/pages/CreateOrEditAssetPage/CreateOrEditAssetPage.vue"),
      props: (route) => ({
        assetId: route.params.assetId,
        title: route.params.assetId ? "Edit Asset" : "Add Asset",
      }),
      meta: {
        requiresAuth: true,
        canAccess: (user: User) => user.canManageAssets,
      },
    },
    {
      name: "listCollections",
      path: "/search/listCollections",
      alias: "/collections",
      component: () =>
        import("@/pages/AllCollectionsPage/AllCollectionsPage.vue"),
    },
    {
      name: "browseCollection",
      path: "/collections/browseCollection/:collectionId",
      alias: "/collections/:collectionId",
      component: BrowseCollectionPage,
      // component: () =>
      // import("@/pages/BrowseCollectionPage/BrowseCollectionPage.vue"),
      props: (route) => ({
        collectionId: parseIntFromParam(route.params.collectionId),
      }),
    },
    {
      name: "allDrawersPage",
      path: "/drawers/listDrawers",
      component: () => import("@/pages/AllDrawersPage/AllDrawersPage.vue"),
    },
    {
      name: "viewDrawerPage",
      path: "/drawers/viewDrawer/:drawerId",
      component: DrawerViewPage,
      props: (route) => ({
        drawerId: parseIntFromParam(route.params.drawerId),
        resultsView: route.query.resultsView ?? null,
      }),
    },
    {
      name: "downloadDrawerPage",
      path: "/drawers/downloadDrawer/:drawerId",
      component: () =>
        import("@/pages/DownloadDrawerPage/DownloadDrawerPage.vue"),
      props: (route) => ({
        drawerId: parseIntFromParam(route.params.drawerId),
      }),
    },
    {
      name: "editInstanceSettingsPage",
      path: "/instances/edit/:instanceId",
      component: () =>
        import("@/pages/InstanceSettingsPage/InstanceSettingsPage.vue"),
      props: (route) => ({
        instanceId: parseIntFromParam(route.params.instanceId),
      }),
    },
    {
      name: "search",
      path: "/search/s/:searchId",
      component: SearchResultsPage,
      // component: () =>
      // import("@/pages/SearchResultsPage/SearchResultsPage.vue"),
      props: (route) => ({
        searchId: route.params.searchId,
        objectId: route.query.objectId ?? null,
        resultsView: route.query.resultsView ?? null,
      }),
    },
    {
      name: "searchResultsMapEmbed",
      path: "/search/:embedType/:searchId",
      component: () =>
        import("@/pages/SearchResultsEmbedPage/SearchResultsEmbedPage.vue"),
      props: true,
      // The classic interface used /search/{embedType}/{drawerId} for
      // drawer embeds. Redirect those legacy URLs to the canonical drawer
      // embed route.
      beforeEnter: (to) => {
        const { searchId, embedType } = to.params;
        // searchId's that are purely numeric are legacy drawer embeds
        // (actual searches use UUIDs with hyphens and letter)
        if (/^\d+$/.test(searchId as string)) {
          return {
            name: "drawerResultsMapEmbed",
            params: { drawerId: searchId, embedType },
          };
        }
      },
    },
    {
      name: "drawerResultsMapEmbed",
      path: "/drawers/:drawerId/embed/:embedType",
      component: () =>
        import("@/pages/DrawerResultsEmbedPage/DrawerResultsEmbedPage.vue"),
      props: (route) => ({
        drawerId: parseIntFromParam(route.params.drawerId),
        embedType: route.params.embedType,
      }),
    },
    {
      name: "localLogin",
      path: "/loginManager/localLogin",
      component: () => import("@/pages/LocalLoginPage/LocalLoginPage.vue"),
      props: (route) => ({
        redirectURL: route.query.redirect ?? null,
      }),
    },
    {
      name: "logout",
      path: "/logout",
      component: () => import("@/pages/LogoutPage/LogoutPage.vue"),
    },
    {
      name: "staticContentPage",
      path: "/page/view/:pageId",
      component: () =>
        import("@/pages/StaticContentPage/StaticContentPage.vue"),
      props: (route) => ({
        pageId: parseIntFromParam(route.params.pageId),
      }),
    },
    {
      name: "customPagesIndex",
      path: "/instances/customPages",
      component: () =>
        import("@/pages/AllCustomPagesPage/AllCustomPagesPage.vue"),
    },
    {
      name: "createCustomPage",
      path: "/instances/createPage",
      component: () => import("@/pages/EditCustomPage/EditCustomPage.vue"),
      props: () => ({ pageId: null }),
    },
    {
      name: "editCustomPage",
      path: "/instances/editPage/:pageId",
      component: () => import("@/pages/EditCustomPage/EditCustomPage.vue"),
      props: (route) => ({
        pageId: parseIntFromParam(route.params.pageId),
      }),
    },
    {
      name: "templatesIndex",
      path: "/templates",
      component: () => import("@/pages/AllTemplatesPage/AllTemplatesPage.vue"),
    },
    {
      name: "templatesEdit",
      path: "/templates/edit/:id",
      component: () =>
        import("@/pages/CreateOrEditTemplatePage/CreateOrEditTemplatePage.vue"),
      props: (route) => ({ templateId: parseIntFromParam(route.params.id) }),
    },
    {
      name: "templatesCreate",
      path: "/templates/edit",
      component: () =>
        import("@/pages/CreateOrEditTemplatePage/CreateOrEditTemplatePage.vue"),
      props: { templateId: null },
    },
    ...createAdminPermissionsRoutes(),
    ...createDrawerManagementRoutes(),
    {
      name: "mapClusterTest",
      path: "/tests/map",
      component: () => import("@/pages/TestPages/MapClusterTest.vue"),
    },
    {
      name: "mapSingleClusterTest",
      path: "/tests/map-single-cluster",
      component: () => import("@/pages/TestPages/MapSingleClusterTest.vue"),
    },
    {
      name: "mapStressTest",
      path: "/tests/map-stress",
      component: () => import("@/pages/TestPages/MapStressTest.vue"),
    },
    {
      name: "notificationTest",
      path: "/tests/notifications",
      component: () => import("@/pages/TestPages/NotificationTest.vue"),
    },
    {
      name: "error",
      path: "/error/:errorCode",
      component: () => import("@/pages/ErrorPage/ErrorPage.vue"),
      props: (route) => ({
        errorCode: parseIntFromParam(route.params.errorCode),
      }),
    },
    {
      name: "catchall",
      path: "/:pathMatch(.*)",
      component: () => import("@/pages/ErrorPage/ErrorPage.vue"),
      props: () => ({
        errorCode: 404,
      }),
    },
  ],
});

router.onError((error) => {
  const errorStore = useErrorStore();
  errorStore.setError(error);
});

router.beforeResolve((to, from, next) => {
  // clear any errors in our error store
  // this prevents the error modal from persisting across pages
  const errorStore = useErrorStore();
  errorStore.clearError();

  // scrub any '//' in the path
  const path = to.path.replace(/\/\//g, "/");
  if (path !== to.path) {
    next(path);
  }
  next();
});

export default router;
