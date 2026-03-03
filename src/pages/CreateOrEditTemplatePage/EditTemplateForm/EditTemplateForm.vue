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
            class="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface uppercase tracking-wide font-medium"
            @click="showAdvanced = !showAdvanced">
            <ChevronRightIcon
              :class="[
                '!size-4 transition-transform duration-150',
                showAdvanced && 'rotate-90',
              ]" />
            Advanced options
          </button>

          <div v-if="showAdvanced" class="mt-4 flex flex-col gap-3 pl-5">
            <ToggleGroup
              v-model="form.isHidden"
              label="Hide from 'Add new asset' menu" />
            <ToggleGroup
              v-model="form.indexForSearching"
              label="Index for searching" />
            <ToggleGroup
              v-model="form.includeInSearch"
              label="Include in public search results" />

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
        <template #header>
          <div class="flex gap-1 mt-1 -ml-2">
            <Button
              type="button"
              variant="tertiary"
              @click="setAllWidgetOptions(true)">
              Expand all
            </Button>
            <Button
              type="button"
              variant="tertiary"
              @click="setAllWidgetOptions(false)">
              Collapse all
            </Button>
          </div>
        </template>

        <SegmentedControl
          v-model="sortMode"
          label="Field order"
          class="justify-end"
          :options="sortModeOptions" />

        <DragDropContainer groupId="widgets">
          <DragDropList
            listId="widgets"
            :modelValue="dragItems"
            listClass="flex flex-col"
            listItemClass=""
            :showEmptyList="false"
            @update:modelValue="onReorder">
            <template #item="{ item }">
              <WidgetEditor
                :index="item.id"
                @remove="editor.removeWidget(item.id)" />
            </template>
          </DragDropList>
        </DragDropContainer>

        <Button type="button" variant="secondary" @click="editor.addWidget()">
          + Add field
        </Button>
      </FormSection>
    </form>

    <template #sidebar-actions>
      <div class="flex flex-col gap-2">
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
            <TriangleAlertIcon
              v-else-if="editor.saveStatus.value === 'error'"
              class="w-4 h-4 mr-2" />
            <CheckCircle2Icon
              v-else-if="editor.saveStatus.value === 'success'"
              class="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
        <div class="text-xs text-right text-on-surface-variant">
          <p v-if="editor.lastModifiedAt.value" data-testid="last-modified">
            {{ formatDate(editor.lastModifiedAt.value) }}
          </p>
          <p v-if="!editor.hasUnsavedChanges.value">No unsaved changes</p>
        </div>
      </div>
    </template>

    <template #sidebar-nav>
      <div v-if="form.widgetArray.length" class="lg:flex flex-col hidden gap-3">
        <p
          class="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
          Field order
        </p>

        <div class="flex flex-col gap-1">
          <p class="text-xs text-on-surface-variant">Editor</p>
          <DragDropContainer groupId="widgets-sidebar-editor">
            <DragDropList
              listId="widgets-sidebar-editor"
              :modelValue="editorDragItems"
              listClass="flex flex-col"
              listItemClass=""
              :showEmptyList="false"
              @update:modelValue="onReorderEditor">
              <template #item="{ item }">
                <div class="flex items-center gap-1.5 py-0.5">
                  <component
                    :is="fieldTypeIcon(form.widgetArray[item.id].fieldTypeId)"
                    class="w-3.5 h-3.5 shrink-0 text-primary opacity-70" />
                  <span class="truncate text-on-surface-variant text-xs">
                    {{ form.widgetArray[item.id].label || "(new field)" }}
                  </span>
                </div>
              </template>
            </DragDropList>
          </DragDropContainer>
        </div>

        <div class="flex flex-col gap-1">
          <p class="text-xs text-on-surface-variant">Viewer</p>
          <DragDropContainer groupId="widgets-sidebar-viewer">
            <DragDropList
              listId="widgets-sidebar-viewer"
              :modelValue="viewerDragItems"
              listClass="flex flex-col"
              listItemClass=""
              :showEmptyList="false"
              @update:modelValue="onReorderViewer">
              <template #item="{ item }">
                <div class="flex items-center gap-1.5 py-0.5">
                  <component
                    :is="fieldTypeIcon(form.widgetArray[item.id].fieldTypeId)"
                    class="w-3.5 h-3.5 shrink-0 text-primary opacity-70" />
                  <span class="truncate text-on-surface-variant text-xs">
                    {{ form.widgetArray[item.id].label || "(new field)" }}
                  </span>
                </div>
              </template>
            </DragDropList>
          </DragDropContainer>
        </div>
      </div>
    </template>
  </FormPageLayout>
</template>

<script setup lang="ts">
import { inject, provide, ref, computed, type Component } from "vue";
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
  TriangleAlertIcon,
  CheckCircle2Icon,
} from "lucide-vue-next";
import FormPageLayout from "@/layouts/FormPageLayout.vue";
import FormSection from "@/components/Form/FormSection.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import SegmentedControl from "@/components/SegmentedControl/SegmentedControl.vue";
import ToggleGroup from "@/components/ToggleGroup/ToggleGroup.vue";
import Button from "@/components/Button/Button.vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import { ChevronRightIcon } from "@/icons";
import { DragDropContainer, DragDropList } from "@/components/DragDropList";
import WidgetEditor from "./WidgetEditor/WidgetEditor.vue";
import { TEMPLATE_EDITOR_KEY } from "../useTemplateEditor/useTemplateEditor";
import { WIDGET_OPTIONS_KEY } from "./widgetOptionsKey";
import { FIELD_TYPE_IDS } from "@/constants/constants";
import type { SelectOption } from "@/types";

defineEmits<{ save: [] }>();

const editor = inject(TEMPLATE_EDITOR_KEY)!;
const form = editor.form;

const showAdvanced = ref(false);

// Broadcast expand/collapse to all WidgetEditor instances via provide/inject.
// The `trigger` counter lets "expand all" re-fire even if `open` hasn't changed.
const widgetOptionsState = ref({ open: false, trigger: 0 });
provide(WIDGET_OPTIONS_KEY, widgetOptionsState);

function setAllWidgetOptions(open: boolean) {
  widgetOptionsState.value = {
    open,
    trigger: widgetOptionsState.value.trigger + 1,
  };
}

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

// --- Field ordering ---

const sortMode = ref<"editor" | "viewer">("editor");

const sortModeOptions: SelectOption<"editor" | "viewer">[] = [
  { id: "editor", label: "Editor" },
  { id: "viewer", label: "Viewer" },
];

const sortedWidgetIndices = computed(() => {
  const indices = form.widgetArray.map((_, i) => i);
  const orderKey = sortMode.value === "editor" ? "templateOrder" : "viewOrder";
  return [...indices].sort(
    (a, b) => form.widgetArray[a][orderKey] - form.widgetArray[b][orderKey]
  );
});

const dragItems = computed(() =>
  sortedWidgetIndices.value.map((i) => ({ id: i }))
);

function onReorder(newItems: { id: number }[]) {
  const orderKey = sortMode.value === "editor" ? "templateOrder" : "viewOrder";
  newItems.forEach(({ id }, pos) => {
    form.widgetArray[id][orderKey] = pos + 1;
  });
}

const editorDragItems = computed(() => {
  const indices = form.widgetArray.map((_, i) => i);
  return [...indices]
    .sort(
      (a, b) =>
        form.widgetArray[a].templateOrder - form.widgetArray[b].templateOrder
    )
    .map((i) => ({ id: i }));
});

const viewerDragItems = computed(() => {
  const indices = form.widgetArray.map((_, i) => i);
  return [...indices]
    .sort(
      (a, b) => form.widgetArray[a].viewOrder - form.widgetArray[b].viewOrder
    )
    .map((i) => ({ id: i }));
});

function onReorderEditor(newItems: { id: number }[]) {
  newItems.forEach(({ id }, pos) => {
    form.widgetArray[id].templateOrder = pos + 1;
  });
}

function onReorderViewer(newItems: { id: number }[]) {
  newItems.forEach(({ id }, pos) => {
    form.widgetArray[id].viewOrder = pos + 1;
  });
}
</script>
