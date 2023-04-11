import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import config from "@/config";

function parseIntFromParam(
  param: string | string[] | undefined
): number | null {
  if (typeof param === "string") {
    return Number.parseInt(param);
  }
  return null;
}

const routesForTesting: RouteRecordRaw[] = [
  {
    path: "/test",
    redirect: config.routes.test ?? "/404",
  },
  {
    path: "/test/lazy",
    component: () => import("@/pages/TestPages/LazyLoadImageTest.vue"),
  },
  {
    path: "/test/embeddedAsset/:assetId",
    component: () => import("@/pages/TestPages/EmbeddedAssetTest.vue"),
    props: (route) => ({
      assetId: route.params.assetId,
      objectId: route.hash?.substring(1),
    }),
  },
];

const router = createRouter({
  history: createWebHistory(config.instance.base.path),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }

    // scroll to anchor if it exists on the page
    if (to.hash && document.querySelector(to.hash)) {
      return {
        el: to.hash,
        behavior: "smooth",
        top: 100, // offset to account for app header
      };
    }

    // otherwise scroll to top
    return { top: 0 };
  },
  routes: [
    {
      name: "home",
      path: "/",
      component: () => import("@/pages/HomePage/HomePage.vue"),
    },
    {
      // this route is really `/asset/viewAsset/:assetId#:objectId?`
      // but we can't use `#` in the path
      name: "asset",
      path: "/asset/viewAsset/:assetId",
      component: () => import("@/pages/AssetViewPage/AssetViewPage.vue"),
      props: (route) => ({
        assetId: route.params.assetId,
        objectId: route.hash?.substring(1),
      }),
    },
    {
      name: "listCollections",
      path: "/search/listCollections",
      alias: "/collections",
      component: () =>
        import("@/pages/AllCollectionsPage/AllCollectionsPage.vue"),
    },
    {
      path: "/collections/browseCollection/:collectionId",
      alias: "/collections/:collectionId",
      component: () =>
        import("@/pages/BrowseCollectionPage/BrowseCollectionPage.vue"),
      props: (route) => ({
        collectionId: parseIntFromParam(route.params.collectionId),
      }),
    },
    {
      name: "search",
      path: "/search/s/:searchId",
      component: () => import("@/pages/SearchPage/SearchPage.vue"),
      props: true,
    },
    {
      name: "StaticContentPage",
      path: "/page/view/:pageId",
      component: () =>
        import("@/pages/StaticContentPage/StaticContentPage.vue"),
      props: (route) => ({
        pageId: parseIntFromParam(route.params.pageId),
      }),
    },
    {
      name: "error",
      path: "/error/:errorCode",
      component: () => import("@/pages/ErrorPage/ErrorPage.vue"),
      props: true,
    },
    {
      path: "/:pathMatch(.*)",
      component: () => import("@/pages/ErrorPage/ErrorPage.vue"),
      props: () => ({
        errorCode: 404,
      }),
    },
    // only add routes for testing if we're not in production
    ...(config.mode !== "production" ? routesForTesting : []),
  ],
});

router.beforeResolve((to, from, next) => {
  // scrub any '//' in the path
  const path = to.path.replace(/\/\//g, "/");
  if (path !== to.path) {
    next(path);
  }
  next();
});

export default router;
