import { RouteRecordRaw } from "vue-router";
import AssetViewPage from "@/pages/AssetViewPage.vue";
import NotFoundPage from "@/pages/NotFoundPage.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/test",
    redirect:
      "asset/viewAsset/56a3bb007d58ae8a488b4657#632dfcc223e48b6a531c8832",
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
