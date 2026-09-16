<template>
  <nav id="app-menu-navigation" class="app-menu h-full">
    <AppMenuPure
      v-if="instance"
      :instance="instance"
      :currentUser="currentUser"
      @close="$emit('close')">
      <template v-if="canSearchAndBrowse">
        <PagesNavSection
          :pages="navPages"
          class="app-menu__pages-nav-section" />

        <AppMenuItem
          v-if="currentUser || viewableCollections.length"
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
          v-if="currentUser?.isAdmin || currentUser?.canEditTemplates"
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
import { useCurrentUser } from "@/composables/useCurrentUser";
import { useAssetStore } from "@/stores/assetStore";
import AppMenuPure from "./AppMenuPure.vue";
import AppMenuItem from "./AppMenuItem.vue";
import PagesNavSection from "./PagesNavSection.vue";
import EditNavSection from "./EditNavSection.vue";
import AdminNavSection from "./AdminNavSection.vue";
import HelpNavSection from "./HelpNavSection.vue";
import { useElevatorInstance } from "@/composables/useElevatorInstance";
import { useNavPages } from "@/composables/useNavPages";
import { useCollections } from "@/composables/useCollections";

const emit = defineEmits<{
  (eventName: "close"): void;
}>();

const assetStore = useAssetStore();

const { currentUser, canSearchAndBrowse } = useCurrentUser();
const { instance } = useElevatorInstance();
const { navPages } = useNavPages();
const { viewableCollections } = useCollections();
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
  background: var(--surface);
  color: var(--on-surface);
}
</style>
