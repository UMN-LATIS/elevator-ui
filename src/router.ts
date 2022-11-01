import { defineAsyncComponent } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import config from "@/config";

const AssetViewPage = defineAsyncComponent(
  () => import("@/pages/AssetViewPage.vue")
);
const NotFoundPage = defineAsyncComponent(
  () => import("@/pages/NotFoundPage.vue")
);

const router = createRouter({
  history: createWebHistory(config.base.path),
  routes: [
    {
      path: "/test",
      redirect: config.routes.test ?? "/404",
    },
    {
      // this route is really `/asset/viewAsset/:assetId#:objectId?`
      // but we can't use `#` in the path
      path: "/asset/viewAsset/:assetId",
      component: AssetViewPage,
      props: (route) => ({
        assetId: route.params.assetId,
        objectId: route.hash?.substring(1),
      }),
    },
    {
      path: "/:pathMatch(.*)",
      component: NotFoundPage,
      props: (route) => ({
        route,
      }),
    },
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
