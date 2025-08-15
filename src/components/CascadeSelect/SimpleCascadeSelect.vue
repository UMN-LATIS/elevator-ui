<template>
  <div class=""></div>
</template>
<script setup lang="ts">
import {
  type NestedOptionsObj,
  useCascadeSelect,
} from "@/composables/useCascadeSelect";
import { MultiSelectWidgetContent } from "@/types";

const props = defineProps<{
  options: NestedOptionsObj;
  modelValue: MultiSelectWidgetContent["fieldContents"];
  selectClass?: Record<string, boolean> | string[] | string;
  labelClass?: Record<string, boolean> | string[] | string;
  initialSelectedValues?: string[];
}>();

defineEmits<{
  (e: "update:modelValue", updated: MultiSelectWidgetContent["fieldContents"]);
}>();
</script>
<style scoped></style>
