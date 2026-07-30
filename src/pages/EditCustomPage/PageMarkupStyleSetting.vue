<template>
  <div data-testid="page-markup-style">
    <SegmentedControl
      :modelValue="markupStyle.name"
      :options="markupStyleOptions"
      label="Page markup"
      labelClass="text-xs font-medium uppercase text-on-surface"
      @update:modelValue="emit('chooseMarkupStyle', $event)" />

    <p class="mt-1 text-sm text-on-surface-variant">
      {{ markupStyleDescription }}
    </p>

    <Notification
      v-if="markupStyle.name === 'customHtml' && markupLostBySimplifying.length"
      title="This page uses HTML the toolbar cannot produce"
      type="info"
      class="mt-3 !max-w-full"
      data-testid="page-markup-loss-warning">
      <p>Switching to simple formatting would remove:</p>
      <ul class="flex flex-wrap gap-1 mt-2">
        <li v-for="item in markupLostBySimplifying" :key="item">
          <Chip>{{ toMarkupLabel(item) }}</Chip>
        </li>
      </ul>
    </Notification>

    <Notification
      v-else-if="simplification"
      title="Simple formatting removed some of your HTML"
      type="warning"
      class="mt-3 !max-w-full"
      data-testid="page-markup-loss-report">
      <ul class="flex flex-wrap gap-1">
        <li v-for="item in simplification.markupRemoved" :key="item">
          <Chip>{{ toMarkupLabel(item) }}</Chip>
        </li>
      </ul>
      <Button
        variant="tertiary"
        class="mt-3"
        data-testid="page-markup-undo"
        @click="emit('undoSimplifying')">
        Undo, go back to custom HTML
      </Button>
    </Notification>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import SegmentedControl from "@/components/SegmentedControl/SegmentedControl.vue";
import Notification from "@/components/Notification/Notification.vue";
import Chip from "@/components/Chip/Chip.vue";
import Button from "@/components/Button/Button.vue";
import type { SelectOption } from "@/types";
import type { BodyMarkupStyle, BodyMarkupStyleName } from "./usePageBodyEditor";

const props = defineProps<{
  markupStyle: BodyMarkupStyle;
  markupLostBySimplifying: string[];
}>();

const emit = defineEmits<{
  (event: "chooseMarkupStyle", name: BodyMarkupStyleName): void;
  (event: "undoSimplifying"): void;
}>();

const markupStyleOptions: SelectOption<BodyMarkupStyleName>[] = [
  { id: "simpleFormatting", label: "Simple formatting" },
  { id: "customHtml", label: "Custom HTML" },
];

const markupStyleDescription = computed(() =>
  props.markupStyle.name === "customHtml"
    ? "Write the markup yourself. Elevator saves it as typed and removes only scripts."
    : "Edit with the toolbar. Elevator rewrites the page HTML and drops anything the toolbar cannot produce."
);

const simplification = computed(() =>
  props.markupStyle.name === "simpleFormatting"
    ? props.markupStyle.simplification
    : null
);

function toMarkupLabel(item: string): string {
  return item.startsWith("@") ? `${item.slice(1)} (attribute)` : `<${item}>`;
}
</script>
