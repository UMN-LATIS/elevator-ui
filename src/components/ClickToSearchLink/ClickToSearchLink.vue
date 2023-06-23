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
import { computed, nextTick } from "vue";
import { WidgetProps } from "@/types";
import { useSearchStore } from "@/stores/searchStore";
import { useRouter } from "vue-router";

const props = defineProps<{
  linkText: string;
  widget: WidgetProps;
}>();

const searchStore = useSearchStore();

const fieldId = computed((): string => props.widget.fieldTitle);
const fieldValue = computed((): string => {
  const cleanedLinkText = props.linkText
    .trim()
    .replace("?", "")
    .replace("...", "");

  return cleanedLinkText.split(" : ").join(",");
});

const router = useRouter();

async function handleClick() {
  // this async function will take awhile to run
  // to give the appearance of a loading state
  // we'll queue up the search on next tick
  // and then navigate to a blank page while waiting for the search to complete
  // once the search is complete, we'll navigate to the search page
  nextTick(async () => {
    // clear search
    searchStore.reset();

    // create a new searchable field filter
    searchStore.addSearchableFieldFilter(fieldId.value, {
      value: fieldValue.value,
    });

    // get the search id
    const searchId = await searchStore.getSearchId();
    searchStore.search(searchId);

    // navigate to the search page
    router.replace(`/search/s/${searchId}`);
  });

  // go to a blank page while waiting for the search to complete
  router.push(`/blank`);
}
</script>
