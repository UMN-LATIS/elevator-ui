<template>
  <FormPageLayout :title="editor.isEditMode.value ? 'Edit Template' : 'New Template'">
    <form id="template-form" @submit.prevent="$emit('save')">
      <FormSection id="template" title="Template">
        <InputGroup v-model="form.name" label="Name" required placeholder="e.g. Article" />

        <!-- Advanced options (search & display) — collapsed by default -->
        <div>
          <button
            type="button"
            class="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface"
            @click="showAdvanced = !showAdvanced">
            <ChevronRightIcon
              :class="['w-4 h-4 transition-transform duration-150', showAdvanced && 'rotate-90']" />
            Advanced options
          </button>

          <div v-if="showAdvanced" class="mt-4 flex flex-col gap-4">
            <p class="text-xs font-medium uppercase tracking-wide text-on-surface-variant opacity-60">
              Search &amp; Indexing
            </p>
            <ToggleGroup v-model="form.indexForSearching" label="Index for searching" />
            <FormSubSection :isOpen="form.indexForSearching">
              <template #details>
                <ToggleGroup v-model="form.includeInSearch" label="Include in public search results" />
                <SelectGroup
                  v-model="form.recursiveIndexDepth"
                  :options="recursiveIndexDepthOptions"
                  label="Recursive index depth" />
              </template>
            </FormSubSection>

            <p class="text-xs font-medium uppercase tracking-wide text-on-surface-variant opacity-60 mt-2">
              Display
            </p>
            <ToggleGroup v-model="form.isHidden" label="Hide from 'Add new asset' menu" />

            <FormSubSection :isOpen="form.showCollection">
              <ToggleGroup v-model="form.showCollection" label="Show collection name on asset page" />
              <template #details>
                <SelectGroup
                  v-model="form.showCollectionPosition"
                  :options="positionOptions"
                  label="Collection name position" />
              </template>
            </FormSubSection>

            <FormSubSection :isOpen="form.showTemplate">
              <ToggleGroup v-model="form.showTemplate" label="Show template name on asset page" />
              <template #details>
                <SelectGroup
                  v-model="form.showTemplatePosition"
                  :options="positionOptions"
                  label="Template name position" />
              </template>
            </FormSubSection>
          </div>
        </div>
      </FormSection>

      <FormSection id="widgets" title="Widgets">
        <WidgetEditor
          v-for="(widget, index) in form.widgetArray"
          :key="index"
          :index="index"
          :widget="widget"
          @remove="editor.removeWidget(index)" />

        <Button type="button" variant="secondary" @click="editor.addWidget()">
          + Add field
        </Button>
      </FormSection>
    </form>

    <template #sidebar-actions>
      <Button
        type="submit"
        form="template-form"
        variant="primary"
        class="w-full justify-center"
        :disabled="editor.isSaving.value">
        <SpinnerIcon v-if="editor.isSaving.value" class="w-4 h-4 mr-2 animate-spin" />
        {{ editor.isEditMode.value ? 'Save' : 'Create template' }}
      </Button>
    </template>

    <template #sidebar-nav>
      <div v-if="form.widgetArray.length" class="flex flex-col gap-2">
        <p class="text-xs font-medium uppercase tracking-wide text-on-surface-variant opacity-60">
          Field order (user view)
        </p>
        <Draggable
          v-model="sidebarItems"
          item-key="id"
          handle=".drag-handle"
          ghost-class="opacity-40"
          @end="onDragEnd">
          <template #item="{ element }">
            <div class="flex items-center gap-2 py-1.5 text-sm group">
              <span class="drag-handle cursor-move text-on-surface-variant opacity-40 group-hover:opacity-80 transition-opacity">
                <DragIcon class="w-4 h-4" />
              </span>
              <component
                :is="fieldTypeIcon(form.widgetArray[element.id]?.fieldTypeId ?? 1)"
                class="w-3.5 h-3.5 shrink-0 text-primary opacity-70" />
              <span class="truncate text-on-surface-variant">
                {{ form.widgetArray[element.id]?.label || '(new field)' }}
              </span>
            </div>
          </template>
        </Draggable>
      </div>
    </template>
  </FormPageLayout>
</template>

<script setup lang="ts">
import { inject, ref, watch, type Component } from "vue";
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
import FormSubSection from "@/components/Form/FormSubSection.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
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

const positionOptions: SelectOption<number>[] = [
  { id: 0, label: "Bottom" },
  { id: 1, label: "Top" },
];

const recursiveIndexDepthOptions: SelectOption<number>[] = [
  { id: 0, label: "0 — This asset's fields only" },
  { id: 1, label: "1 — Include direct related assets' text" },
  { id: 2, label: "2 — Include related assets' related assets' text" },
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
    const indices = Array.from({ length: form.widgetArray.length }, (_, i) => i);
    indices.sort((a, b) => form.widgetArray[a].viewOrder - form.widgetArray[b].viewOrder);
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
