import { defineAsyncComponent } from "vue";
import { RouteRecordRaw } from "vue-router";
import config from "@/config";

const AssetViewPage = defineAsyncComponent(
  () => import("@/pages/AssetViewPage.vue")
);
const NotFoundPage = defineAsyncComponent(
  () => import("@/pages/NotFoundPage.vue")
);

const routes: RouteRecordRaw[] = [
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
];

export default routes;
