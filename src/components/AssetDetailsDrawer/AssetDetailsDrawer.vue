<template>
  <div class="asset-details">
    <Drawer
      :label="assetTitle"
      :isOpen="isOpen"
      :showToggle="showToggle"
      class="h-full"
      @toggle="$emit('toggle')"
    >
      <template #header-label>
        <DrawerLabel
          :label="assetTitle"
          :class="{
            'text-2xl': isOpen,
          }"
        />
      </template>
      <WidgetList v-if="assetId" :assetId="assetId" />
      <MoreLikeThis v-if="assetId" :assetId="assetId" />
    </Drawer>
  </div>
</template>
<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import Drawer from "@/components/Drawer/Drawer.vue";
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import { getAssetTitle } from "@/helpers/displayUtils";
import { useAsset } from "@/helpers/useAsset";
import DrawerLabel from "@/components/Drawer/DrawerLabel.vue";

const MoreLikeThis = defineAsyncComponent({
  loader: () => import("@/components/MoreLikeThis/MoreLikeThis.vue"),
  // delay: 500,
});

const props = withDefaults(
  defineProps<{
    assetId: string | null;
    isOpen?: boolean;
    showToggle?: boolean;
  }>(),
  {
    isOpen: true,
    showToggle: true,
  }
);

defineEmits<{
  (eventName: "toggle");
}>();

const assetIdRef = computed(() => props.assetId);
const { asset } = useAsset(assetIdRef);

const assetTitle = computed(() =>
  asset.value ? getAssetTitle(asset.value) : ""
);
</script>
<style scoped></style>
