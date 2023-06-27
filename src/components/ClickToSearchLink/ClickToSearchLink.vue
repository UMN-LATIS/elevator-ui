<template>
  <span v-if="props.widget.clickToSearch">
    <button
      class="text-blue-600 hover:text-blue-700 hover:underline"
      @click="handleClick"
    >
      <slot />
    </button>
  </span>
  <span v-else>
    <slot />
  </span>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { WidgetProps } from "@/types";
import { useSearchStore } from "@/stores/searchStore";
import api from "@/api";

interface Props {
  linkText: string;
  widget: WidgetProps;
}

const props = defineProps<Props>();
const router = useRouter();
const searchStore = useSearchStore();

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
