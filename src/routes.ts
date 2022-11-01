import { RouteRecordRaw } from "vue-router";
import config from "@/config";

const routes: RouteRecordRaw[] = [
  {
    path: "/test",
    redirect: config.routes.test ?? "/404",
  },
  {
    /**
     * /asset/viewAsset/:assetId#:objectId?
     */
    path: "/asset/viewAsset/:assetId",
    component: () => import("@/pages/AssetViewPage.vue"),
    props: (route) => ({
      assetId: route.params.assetId,
      objectId: route.hash?.substring(1),
    }),
  },
  {
    path: "/:pathMatch(.*)",
    component: () => import("@/pages/NotFoundPage.vue"),
    props: (route) => ({
      route,
    }),
  },
];

export default routes;
