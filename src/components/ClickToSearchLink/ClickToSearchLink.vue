<template>
  <span v-if="props.widget.clickToSearch">
    <a
      :href="clickToSearchUrl"
      class="click-to-search-link text-blue-600 hover:text-blue-700 hover:underline"
      @click.prevent="handleClick">
      <slot :isClickable="true" />
    </a>
  </span>
  <span v-else>
    <slot :isClickable="false" />
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { WidgetDef } from "@/types";
import { useSearchStore } from "@/stores/searchStore";
import api from "@/api";
import { toClickToSearchUrl } from "@/helpers/displayUtils";

interface Props {
  linkText: string;
  widget: WidgetDef;
}

const props = defineProps<Props>();
const router = useRouter();
const searchStore = useSearchStore();
const clickToSearchUrl = computed(() => {
  return toClickToSearchUrl(props.linkText, props.widget);
});

async function handleClick() {
  // clear search store
  searchStore.reset();

  const searchId = await api.getSearchIdForClickToSearch(
    props.linkText,
    props.widget
  );

  router.push(`/search/s/${searchId}`);
}
</script>
