import { createRouter, createWebHistory } from "vue-router";
import config from "@/config";
import HomePage from "@/pages/HomePage/HomePage.vue";
import AssetViewPage from "@/pages/AssetViewPage/AssetViewPage.vue";
import AllCollectionsPage from "@/pages/AllCollectionsPage/AllCollectionsPage.vue";
import BrowseCollectionPage from "./pages/BrowseCollectionPage/BrowseCollectionPage.vue";
import SearchResultsPage from "./pages/SearchResultsPage/SearchResultsPage.vue";
import LocalLoginPage from "./pages/LocalLoginPage/LocalLoginPage.vue";
import StaticContentPage from "@/pages/StaticContentPage/StaticContentPage.vue";
import ErrorPage from "@/pages/ErrorPage/ErrorPage.vue";
import AllDrawersPage from "@/pages/AllDrawersPage/AllDrawersPage.vue";
import DrawerViewPage from "./pages/DrawerViewPage/DrawerViewPage.vue";
import CreateAssetPage from "./pages/CreateAssetPage/CreateAssetPage.vue";
import DownloadDrawerPage from "./pages/DownloadDrawerPage/DownloadDrawerPage.vue";
import { useErrorStore } from "./stores/errorStore";
import LogoutPage from "./pages/LogoutPage/LogoutPage.vue";
import ExcerptViewPage from "./pages/ExcerptViewPage/ExcerptViewPage.vue";
import SearchResultsEmbedPage from "./pages/SearchResultsEmbedPage/SearchResultsEmbedPage.vue";

function parseIntFromParam(
  param: string | string[] | undefined
): number | null {
  if (typeof param === "string") {
    return Number.parseInt(param);
  }
  return null;
}

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

    // otherwise scroll to the top of the page
    return {
      top: 0,
    };
  },
  routes: [
    {
      name: "home",
      path: "/",
      component: HomePage,
      // component: () => import("@/pages/HomePage/HomePage.vue"),
    },
    {
      // this route is really `/asset/viewAsset/:assetId#:objectId?`
      // but we can't use `#` in the path
      name: "asset",
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
      component: ExcerptViewPage,
      props: (route) => ({
        excerptId: parseIntFromParam(route.params.excerptId),
      }),
    },
    {
      name: "addAsset",
      path: "/asset/create",
      component: CreateAssetPage,
    },
    {
      name: "listCollections",
      path: "/search/listCollections",
      alias: "/collections",
      component: AllCollectionsPage,
      // component: () =>
      // import("@/pages/AllCollectionsPage/AllCollectionsPage.vue"),
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
      component: AllDrawersPage,
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
      component: DownloadDrawerPage,
      props: (route) => ({
        drawerId: parseIntFromParam(route.params.drawerId),
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
      component: SearchResultsEmbedPage,
      props: true,
    },
    {
      name: "localLogin",
      path: "/loginManager/localLogin",
      component: LocalLoginPage,
      // component: () => import("@/pages/LocalLoginPage/LocalLoginPage.vue"),
      props: (route) => ({
        redirectURL: route.query.redirect ?? null,
      }),
    },
    {
      name: "logout",
      path: "/logout",
      component: LogoutPage,
    },
    {
      name: "staticContentPage",
      path: "/page/view/:pageId",
      component: StaticContentPage,
      // component: () =>
      // import("@/pages/StaticContentPage/StaticContentPage.vue"),
      props: (route) => ({
        pageId: parseIntFromParam(route.params.pageId),
      }),
    },
    {
      name: "error",
      path: "/error/:errorCode",
      component: ErrorPage,
      // component: () => import("@/pages/ErrorPage/ErrorPage.vue"),
      props: (route) => ({
        errorCode: parseIntFromParam(route.params.errorCode),
      }),
    },
    {
      name: "catchall",
      path: "/:pathMatch(.*)",
      component: ErrorPage,
      // component: () => import("@/pages/ErrorPage/ErrorPage.vue"),
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
