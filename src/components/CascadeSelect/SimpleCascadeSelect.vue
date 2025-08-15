<template>
  <div class="cascade-select flex flex-col gap-4">
    <!-- show any curretly selected segments -->
    <div class="flex flex-col gap-1">
      <template
        v-for="selectedSegment in cascadeSelect.selectedPath"
        :key="selectedSegment.id">
        <SelectGroup
          :label="
            cascadeSelect.getLevelByDepth(selectedSegment.depth)?.label ??
            `Category ${selectedSegment.depth + 1}`
          "
          :options="
            cascadeSelect
              .getOptionsByParentId(selectedSegment.parentId)
              .map((opt) => ({
                id: opt.id,
                label: String(opt.value),
              }))
          "
          :modelValue="selectedSegment.id"
          placeholder="Select..."
          @update:modelValue="handleSelectOption" />
      </template>

      <!-- show selector for next options if they exist -->
      <SelectGroup
        v-if="cascadeSelect.nextSelectOptions.length"
        :label="
          cascadeSelect.getLevelByDepth(cascadeSelect.selectedPath.length)
            ?.label ?? `Category ${cascadeSelect.selectedPath.length + 1}`
        "
        :options="cascadeSelect.nextSelectOptions"
        :modelValue="cascadeSelect.selectedOption?.id ?? null"
        placeholder="Select..."
        @update:modelValue="handleSelectOption" />
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  FlatOption,
  type NestedOptionsObj,
  useCascadeSelect,
} from "@/composables/useCascadeSelect";
import { MultiSelectWidgetContent } from "@/types";
import SelectGroup from "../SelectGroup/SelectGroup.vue";
import { nextTick, toValue, onMounted } from "vue";

const props = defineProps<{
  options: NestedOptionsObj;
  modelValue: MultiSelectWidgetContent["fieldContents"];
  selectClass?: Record<string, boolean> | string[] | string;
  labelClass?: Record<string, boolean> | string[] | string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", updated: MultiSelectWidgetContent["fieldContents"]);
}>();

const cascadeSelect = useCascadeSelect(() => props.options);

onMounted(() => {
  // initialize cascadeSelect
  cascadeSelect.selectOptionByWidgetFieldContents(props.modelValue);
});

function handleSelectOption(optionId: FlatOption["id"] | null) {
  cascadeSelect.selectOption(optionId);
  nextTick(() => {
    emit("update:modelValue", toValue(cascadeSelect.widgetFieldContents ?? {}));
  });
}
</script>
<style scoped></style>
