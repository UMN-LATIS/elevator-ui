<template>
  <ul>
    <template v-for="category in organizedSelectCategories" :key="category">
      <li v-if="getCategoryContent(category)">
        <ClickToSearchLink
          :widget="widget"
          :linkText="contentsUpToCategory(category)">
          {{ getCategoryContent(category) }}
        </ClickToSearchLink>
      </li>
    </template>
  </ul>
</template>

<script setup lang="ts">
import { collectAlternatingKeys, uniqueValues } from "./MultiSelectWidget";
import { computed } from "vue";
import { MultiSelectWidgetContent, MultiSelectWidgetDef } from "@/types";
import ClickToSearchLink from "@/components/ClickToSearchLink/ClickToSearchLink.vue";

const props = defineProps<{
  widget: MultiSelectWidgetDef;
  content: MultiSelectWidgetContent;
}>();

const organizedSelectCategories = computed(() => {
  return uniqueValues(collectAlternatingKeys(props.widget.fieldData, false)).map(
    toAlphaNum
  );
});

const toAlphaNum = (str: string) => str.replace(/[^a-zA-Z0-9]/g, "");

const toNormedCategory = (str: string | number) =>
  toAlphaNum(String(str)).toLowerCase();

// normalize field content keys
const normalizedFieldContents = computed(() => {
  // make keys alphanumeric and lowercase
  return Object.fromEntries(
    Object.entries(props.content.fieldContents).map(([key, value]) => {
      return [toNormedCategory(key), value];
    })
  );
});

const getCategoryContent = (str: string | number) =>
  normalizedFieldContents.value[toNormedCategory(str)];

const contentsUpToCategory = (targetCategory: string) => {
  const returnValue: string[] = [];
  const normedTargetCategory = toNormedCategory(targetCategory);
  for (const category of organizedSelectCategories.value) {
    const normedCategory = toNormedCategory(category);
    // Use the actual field content value instead of the category name
    const categoryValue = getCategoryContent(category);
    returnValue.push(String(categoryValue));
    if (normedCategory === normedTargetCategory) {
      return returnValue.join(" : ");
    }
  }
  return returnValue.join(" : ");
};
</script>

<style scoped>
ul {
  display: inline;
  list-style: none;
  margin: 0;
  padding: 0;
}

ul li {
  display: inline;
}

ul li + li:before {
  content: " : ";
}
</style>
