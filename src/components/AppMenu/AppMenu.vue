<template>
  <nav id="app-menu-navigation" class="app-menu h-full">
    <AppMenuPure
      :instance="instanceStore.instance"
      :currentUser="instanceStore.currentUser"
      @close="$emit('close')">
      <template v-if="instanceStore.instance.userCanSearchAndBrowse">
        <PagesNavSection :pages="pages" class="app-menu__pages-nav-section" />

        <AppMenuItem
          v-if="currentUser || instanceStore.collections.length"
          :to="`/search/listCollections`"
          class="app-menu__collections">
          Collections
        </AppMenuItem>

        <AppMenuItem
          v-if="currentUser"
          to="/drawers/listDrawers"
          class="app-menu__drawers">
          Drawers
        </AppMenuItem>

        <EditNavSection
          v-if="currentUser?.canManageAssets"
          :currentUser="currentUser"
          :instance="instance"
          :assetId="activeAssetId"
          class="app-menu__edit-nav-section" />

        <AdminNavSection
          v-if="currentUser?.isAdmin"
          :currentUser="currentUser"
          :instance="instance"
          class="app-menu__admin-nav-section" />
      </template>
      <HelpNavSection :instance="instance" class="app-menu__help-nav-section" />
    </AppMenuPure>
  </nav>
</template>
<script setup lang="ts">
import { watch } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useInstanceStore } from "@/stores/instanceStore";
import { useAssetStore } from "@/stores/assetStore";
import AppMenuPure from "./AppMenuPure.vue";
import AppMenuItem from "./AppMenuItem.vue";
import PagesNavSection from "./PagesNavSection.vue";
import EditNavSection from "./EditNavSection.vue";
import AdminNavSection from "./AdminNavSection.vue";
import HelpNavSection from "./HelpNavSection.vue";

const emit = defineEmits<{
  (eventName: "close"): void;
}>();

const instanceStore = useInstanceStore();
const assetStore = useAssetStore();

const { currentUser, instance, pages } = storeToRefs(instanceStore);
const { activeAssetId } = storeToRefs(assetStore);

// if the route changes, close the menu
const route = useRoute();
watch(
  () => route.path,
  () => emit("close")
);
</script>
<style scoped>
.app-menu {
  background: var(--app-appMenu-backgroundColor);
  color: var(--app-appMenu-textColor);
}
</style>
