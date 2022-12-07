import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import config from "@/config";

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
  routes: [
    {
      // this route is really `/asset/viewAsset/:assetId#:objectId?`
      // but we can't use `#` in the path
      path: "/asset/viewAsset/:assetId",
      component: () => import("@/pages/AssetViewPage/AssetViewPage.vue"),
      props: (route) => ({
        assetId: route.params.assetId,
        objectId: route.hash?.substring(1),
      }),
    },
    {
      path: "/search/s/:searchId",
      component: () => import("@/pages/SearchPage/SearchPage.vue"),
      props: true,
    },
    {
      path: "/:pathMatch(.*)",
      component: () => import("@/pages/NotFoundPage/NotFoundPage.vue"),
      props: (route) => ({
        route,
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
