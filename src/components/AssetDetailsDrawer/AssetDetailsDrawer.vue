<template>
  <div class="asset-details">
    <Drawer
      :label="assetTitle"
      :isOpen="isOpen"
      :showToggle="showToggle"
      @toggle="$emit('toggle')"
    >
      <WidgetList v-if="assetId" :assetId="assetId" />
      <footer v-if="assetId" class="flex gap-2">
        <MoreLikeThis :items="moreLikeThisItems" />
        <Button
          :href="getAssetUrl(assetId)"
          icon="image"
          target="_blank"
          variant="tertiary"
        >
          Old View
        </Button>
        <Button
          :href="`${getAssetUrl(assetId)}/true`"
          label="Asset Json"
          icon="data_object"
          target="_blank"
          variant="tertiary"
        >
          JSON
        </Button>
      </footer>
    </Drawer>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import Drawer from "@/components/Drawer/Drawer.vue";
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import { getAssetTitle, getAssetUrl } from "@/helpers/displayUtils";
import Button from "@/components/Button/Button.vue";
import { useAsset } from "@/helpers/useAsset";
import MoreLikeThis from "../MoreLikeThis/MoreLikeThis.vue";
import { useMoreLikeThis } from "@/helpers/useMoreLikeThis";

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

const isMoreLikeThisOpen = ref(false);
const { matches: moreLikeThisItems } = useMoreLikeThis(assetIdRef);

const assetTitle = computed(() =>
  asset.value ? getAssetTitle(asset.value) : ""
);
</script>
<style scoped></style>
