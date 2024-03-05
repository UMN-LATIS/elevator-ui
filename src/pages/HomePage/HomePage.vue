<template>
  <DefaultLayout class="home-page">
    <template #custom-header>
      <CustomAppHeader v-if="instanceStore.customHeader" />
    </template>
    <SignInRequiredNotice
      v-if="isReady && !canSearchAndBrowse && !instanceStore.isLoggedIn"
      class="my-8 mx-4" />
    <div
      v-if="isReady && canSearchAndBrowse"
      class="home-page-content flex-1 md:grid max-w-screen-xl w-full mx-auto"
      :class="{
        'md:grid-cols-2': !featuredAssetId,
        'md:grid-cols-3': featuredAssetId,
      }">
      <article class="page-content-block col-span-2 p-4 lg:p-8">
        <Transition v-if="page" name="fade">
          <SanitizedHTML
            v-if="page.content"
            :html="page.content"
            class="prose prose-neutral" />
          <section v-else class="bg-white p-8 my-8 shadow-sm">
            <h1 class="text-4xl text-center font-bold">
              {{ instanceStore.instance?.name ?? "Elevator" }}
            </h1>
          </section>
        </Transition>
      </article>
      <aside
        v-if="featuredAssetId"
        class="featured-asset-block col-span-1 p-4 lg:p-8">
        <h2 class="text-sm font-bold uppercase mb-2">Featured</h2>
        <div class="mb-4">
          <SanitizedHTML :html="featuredAssetText" />
        </div>
        <FeaturedAssetCard :assetId="featuredAssetId" />
      </aside>
    </div>
    <Notification
      v-else-if="isReady && !canSearchAndBrowse && instanceStore.isLoggedIn"
      title="Nothing to See Here"
      class="my-8 mx-4">
      <p>
        Your account does not have permission to search and browse assets.
        Please contact your administrator if you believe this is an error.
      </p>
    </Notification>
    <template #footer>
      <AppFooter />
    </template>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import { ref, watch, computed } from "vue";
import { StaticContentPage, Asset } from "@/types";
import { useInstanceStore } from "@/stores/instanceStore";
import api from "@/api";
import FeaturedAssetCard from "@/components/FeaturedAssetCard/FeaturedAssetCard.vue";
import SignInRequiredNotice from "./SignInRequiredNotice.vue";
import Notification from "@/components/Notification/Notification.vue";
import AppFooter from "@/components/AppFooter/AppFooter.vue";
import CustomAppHeader from "@/components/CustomAppHeader/CustomAppHeader.vue";

const page = ref<StaticContentPage | null>(null);
const instanceStore = useInstanceStore();
const canSearchAndBrowse = computed(
  () => instanceStore.instance?.userCanSearchAndBrowse ?? false
);
const isReady = computed(() => instanceStore.isReady);

const fallbackHomePage: StaticContentPage = {
  title: "No Home Page",
  content: `<p>Update your instance to set a Home Page</p>`,
};

const featuredAssetId = computed(
  (): string | null => instanceStore.instance?.featuredAssetId ?? null
);
const featuredAssetText = computed(
  () => instanceStore.instance?.featuredAssetText ?? ""
);
const featuredAsset = ref<Asset | null>(null);

// the Home Page is just the first page with a title of "Home Page"
function findHomePageId() {
  return instanceStore.pages.find((page) => page.title === "Home Page")?.id;
}

async function fetchHomePage(homePageId: number | undefined) {
  if (!homePageId) return fallbackHomePage;
  return api.getStaticPage(homePageId);
}

async function fetchFeaturedAsset(assetId): Promise<Asset | null> {
  if (!assetId) return null;
  return api.getAsset(assetId);
}

watch(
  () => instanceStore.fetchStatus,
  async () => {
    if (instanceStore.fetchStatus !== "success") return;

    // if the can't search and browse, we're done
    if (!canSearchAndBrowse.value) return;

    const homePageId = findHomePageId();
    page.value = await fetchHomePage(homePageId);
    featuredAsset.value = await fetchFeaturedAsset(featuredAssetId.value);
  },
  { immediate: true }
);
</script>
<style scoped>
.home-page-content {
  --bg-color: var(--app-backgroundColor);
  --text-color: var(--app-textColor);
  --border-color: var(--app-borderColor);
  --border-width: var(--app-borderWidth);
}

.featured-asset-block,
.page-content-block {
  background: var(--bg-color);
  color: var(--text-color);
}

.featured-asset-block {
  border-left: var(--border-width) solid var(--border-color);
}
</style>
