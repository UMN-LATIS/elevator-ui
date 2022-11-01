import { RouteRecordRaw } from "vue-router";
import config from "@/config";

const routes: RouteRecordRaw[] = [
  {
    path: "/test",
    redirect: config.routes.test ?? "/404",
  },
  {
    // this route is really `/asset/viewAsset/:assetId#:objectId?`
    // but we can't use `#` in the path
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
