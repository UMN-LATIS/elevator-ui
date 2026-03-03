<template>
  <FormPageLayout
    :title="editor.isEditMode.value ? 'Edit Template' : 'New Template'">
    <form id="template-form" @submit.prevent="$emit('save')">
      <FormSection id="template" title="Template">
        <InputGroup
          v-model="form.name"
          label="Name"
          required
          placeholder="e.g. Article" />

        <!-- Advanced options (search & display) — collapsed by default -->
        <div>
          <button
            type="button"
            class="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface"
            @click="showAdvanced = !showAdvanced">
            <ChevronRightIcon
              :class="[
                'w-4 h-4 transition-transform duration-150',
                showAdvanced && 'rotate-90',
              ]" />
            Advanced options
          </button>

          <div v-if="showAdvanced" class="mt-4 flex flex-col gap-4 pl-6">
            <ToggleGroup
              v-model="form.isHidden"
              label="Hide from 'Add new asset' menu" />
            <ToggleGroup
              v-model="form.indexForSearching"
              label="Index for searching" />
            <ToggleGroup
              v-model="form.includeInSearch"
              label="Include in public search results" />
            <!-- <div class="grid grid-cols-2 gap-4 items-center">
              <label class="text-sm whitespace-nowrap">
                Recursive index depth
              </label>
              <select
                v-model.number="form.recursiveIndexDepth"
                class="max-w-full text-xs bg-surface-container rounded border border-outline-variant px-2 py-1">
                <option disabled value="">-- Select depth --</option>
                <option
                  v-for="option in recursiveIndexDepthOptions"
                  :key="option.id"
                  :value="option.id">
                  {{ option.label }}
                </option>
              </select>
            </div> -->

            <SegmentedControl
              v-model="form.recursiveIndexDepth"
              :options="recursiveIndexDepthOptions"
              label="Recursive index depth" />

            <SegmentedControl
              v-model="collectionDisplay"
              :options="displayPositionOptions"
              label="Show collection name on asset page" />

            <SegmentedControl
              v-model="templateDisplay"
              :options="displayPositionOptions"
              label="Show template name on asset page" />
          </div>
        </div>
      </FormSection>

      <FormSection id="widgets" title="Widgets">
        <WidgetEditor
          v-for="(_, index) in form.widgetArray"
          :key="index"
          :index="index"
          @remove="editor.removeWidget(index)" />

        <Button type="button" variant="secondary" @click="editor.addWidget()">
          + Add field
        </Button>
      </FormSection>
    </form>

    <template #sidebar-actions>
      <div class="grid grid-cols-2 gap-4">
        <Button type="button">Cancel</Button>
        <Button
          type="submit"
          form="template-form"
          variant="primary"
          class="w-full justify-center"
          :disabled="editor.isSaving.value">
          <SpinnerIcon
            v-if="editor.isSaving.value"
            class="w-4 h-4 mr-2 animate-spin" />
          {{ editor.isEditMode.value ? "Save" : "Create template" }}
        </Button>
      </div>
    </template>

    <template #sidebar-nav>
      <div v-if="form.widgetArray.length" class="lg:flex flex-col gap-2 hidden">
        <p
          class="text-xs font-medium uppercase tracking-wide text-on-surface-variant opacity-60">
          Field order (user view)
        </p>
        <Draggable
          v-model="sidebarItems"
          handle=".drag-handle"
          ghostClass="opacity-40"
          @end="onDragEnd">
          <template #item="{ element }">
            <div class="flex items-center gap-2 py-1.5 text-sm group">
              <span
                class="drag-handle cursor-move text-on-surface-variant opacity-40 group-hover:opacity-80 transition-opacity">
                <DragIcon class="w-4 h-4" />
              </span>
              <component
                :is="
                  fieldTypeIcon(form.widgetArray[element.id]?.fieldTypeId ?? 1)
                "
                class="w-3.5 h-3.5 shrink-0 text-primary opacity-70" />
              <span class="truncate text-on-surface-variant">
                {{ form.widgetArray[element.id]?.label || "(new field)" }}
              </span>
            </div>
          </template>
        </Draggable>
      </div>
    </template>
  </FormPageLayout>
</template>

<script setup lang="ts">
import { inject, ref, computed, watch, type Component } from "vue";
import Draggable from "vuedraggable";
import {
  TypeIcon,
  AlignLeftIcon,
  ListIcon,
  CheckSquareIcon,
  CalendarIcon,
  TagIcon,
  ListChecksIcon,
  MapPinIcon,
  PaperclipIcon,
  LinkIcon,
} from "lucide-vue-next";
import FormPageLayout from "@/layouts/FormPageLayout.vue";
import FormSection from "@/components/Form/FormSection.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import SegmentedControl from "@/components/SegmentedControl/SegmentedControl.vue";
import ToggleGroup from "@/components/ToggleGroup/ToggleGroup.vue";
import Button from "@/components/Button/Button.vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import { ChevronRightIcon, DragIcon } from "@/icons";
import WidgetEditor from "./WidgetEditor/WidgetEditor.vue";
import { TEMPLATE_EDITOR_KEY } from "../useTemplateEditor/useTemplateEditor";
import { FIELD_TYPE_IDS } from "@/constants/constants";
import type { SelectOption } from "@/types";

defineEmits<{ save: [] }>();

const editor = inject(TEMPLATE_EDITOR_KEY)!;
const form = editor.form;

const showAdvanced = ref(false);

type DisplayPosition = "off" | "bottom" | "top";

const displayPositionOptions: SelectOption<DisplayPosition>[] = [
  { id: "off", label: "Off" },
  { id: "bottom", label: "Bottom" },
  { id: "top", label: "Top" },
];

const collectionDisplay = computed<DisplayPosition>({
  get: () =>
    !form.showCollection
      ? "off"
      : form.showCollectionPosition === 1
      ? "top"
      : "bottom",
  set: (val) => {
    form.showCollection = val !== "off";
    if (val !== "off") form.showCollectionPosition = val === "top" ? 1 : 0;
  },
});

const templateDisplay = computed<DisplayPosition>({
  get: () =>
    !form.showTemplate
      ? "off"
      : form.showTemplatePosition === 1
      ? "top"
      : "bottom",
  set: (val) => {
    form.showTemplate = val !== "off";
    if (val !== "off") form.showTemplatePosition = val === "top" ? 1 : 0;
  },
});

const recursiveIndexDepthOptions: SelectOption<number>[] = [
  { id: 0, label: "None" },
  { id: 1, label: "Shallow" },
  { id: 2, label: "Deep" },
];

// --- Field type icons ---

const FIELD_TYPE_ICONS: Record<number, Component> = {
  [FIELD_TYPE_IDS.text]: TypeIcon,
  [FIELD_TYPE_IDS["text area"]]: AlignLeftIcon,
  [FIELD_TYPE_IDS.select]: ListIcon,
  [FIELD_TYPE_IDS.checkbox]: CheckSquareIcon,
  [FIELD_TYPE_IDS.date]: CalendarIcon,
  [FIELD_TYPE_IDS["tag list"]]: TagIcon,
  [FIELD_TYPE_IDS.multiselect]: ListChecksIcon,
  [FIELD_TYPE_IDS.location]: MapPinIcon,
  [FIELD_TYPE_IDS.upload]: PaperclipIcon,
  [FIELD_TYPE_IDS["related asset"]]: LinkIcon,
};

function fieldTypeIcon(typeId: number): Component {
  return FIELD_TYPE_ICONS[typeId] ?? TypeIcon;
}

// --- Sidebar drag-and-drop (viewOrder) ---

// Each item holds the index of the corresponding widget in form.widgetArray.
// The display label and icon are read reactively from form.widgetArray[item.id].
const sidebarItems = ref<{ id: number }[]>([]);

// Re-derive sidebar order from viewOrder whenever widgets are added or removed.
watch(
  () => form.widgetArray.length,
  () => {
    const indices = Array.from(
      { length: form.widgetArray.length },
      (_, i) => i
    );
    indices.sort(
      (a, b) => form.widgetArray[a].viewOrder - form.widgetArray[b].viewOrder
    );
    sidebarItems.value = indices.map((i) => ({ id: i }));
  },
  { immediate: true }
);

// After a drag, write the new visual order back as viewOrder values.
function onDragEnd() {
  sidebarItems.value.forEach(({ id }, pos) => {
    form.widgetArray[id].viewOrder = pos + 1;
  });
}
</script>
