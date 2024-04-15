<template>
  <ul>
    <template v-for="category in organizedSelectCategories" :key="category">
      <li v-if="content.fieldContents[category]">
        <ClickToSearchLink
          :widget="widget"
          :linkText="contentsUpToCategory(category)"
          >{{ content.fieldContents[category] }}
        </ClickToSearchLink>
      </li>
    </template>
  </ul>
</template>

<script setup lang="ts">
import { recursiveSort, uniqueValues } from "./MultiSelectWidget";
import { computed } from "vue";
import { MultiSelectWidgetContent, MultiSelectWidgetProps } from "@/types";
import ClickToSearchLink from "@/components/ClickToSearchLink/ClickToSearchLink.vue";

interface Props {
  widget: MultiSelectWidgetProps;
  content: MultiSelectWidgetContent;
}

const props = defineProps<Props>();

const organizedSelectCategories = computed(() => {
  return uniqueValues(recursiveSort(props.widget.fieldData, false)).map(
    makeSafeForTitle
  );
});

const makeSafeForTitle = (title) => {
  return title.replace(/[^a-zA-Z0-9]+/, "");
};

const contentsUpToCategory = (targetCategory) => {
  const returnValue: string[] = [];
  for (const category of organizedSelectCategories.value) {
    returnValue.push(props.content.fieldContents[category]);
    if (category == targetCategory) {
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
