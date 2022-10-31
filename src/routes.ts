import { RouteRecordRaw } from "vue-router";
import AssetViewPage from "@/pages/AssetViewPage.vue";
import NotFoundPage from "@/pages/NotFoundPage.vue";
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
    component: () => AssetViewPage,
    // props: true,
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
];

export default routes;
