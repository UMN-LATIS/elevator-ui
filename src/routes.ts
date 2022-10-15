import { RouteRecordRaw } from "vue-router";

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
    component: () => import("@/pages/AssetViewPage.vue"),
    // props: true,
    props: (route) => ({
      assetId: route.params.assetId,
      objectId: route.hash?.substring(1),
    }),
  },
];

export default routes;
