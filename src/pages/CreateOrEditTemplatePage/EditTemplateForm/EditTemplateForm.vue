<template>
  <FormPageLayout>
    <template #header>
      <div class="flex justify-between items-baseline">
        <h1 class="text-2xl md:text-4xl font-bold">
          {{ editor.isEditMode.value ? "Edit Template" : "New Template" }}
        </h1>

        <Tuple
          v-if="editor.templateId.value"
          label="Template ID"
          variant="inline">
          {{ editor.templateId.value }}
        </Tuple>
      </div>
    </template>

    <form id="template-form" @submit.prevent="$emit('save')">
      <FormSection id="template" class="block">
        <template #header>
          <div class="mb-2">
            <h2 class="text-lg font-semibold">Template</h2>
          </div>
        </template>
        <InputGroup
          v-model="form.name"
          label="Name"
          required
          placeholder="e.g. Article" />

        <!-- Advanced options (search & display) — collapsed by default -->
        <div class="my-4">
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

      <FormSection id="widgets" title="Fields" class="block my-6">
        <template #header>
          <div class="grid grid-cols-[1fr_auto] gap-4 items-baseline mb-2">
            <h2 class="text-lg font-semibold">Fields</h2>
            <div class="flex gap-4">
              <SegmentedControl
                v-model="sortMode"
                label="Field order"
                class="justify-end"
                labelClass="text-xs uppercase font-medium text-on-surface-variant"
                :options="sortModeOptions" />
              <IconButton
                type="button"
                :title="allExpanded ? 'Collapse all' : 'Expand all'"
                @click="toggleAllWidgetOptions">
                <ChevronsDownUpIcon v-if="allExpanded" class="w-4 h-4" />
                <ChevronsUpDownIcon v-else class="w-4 h-4" />
              </IconButton>
            </div>
          </div>
        </template>

        <DragDropContainer groupId="widgets">
          <DragDropList
            listId="widgets"
            :modelValue="dragItems"
            :showEmptyList="false"
            @update:modelValue="onReorder">
            <template #item="{ item }">
              <WidgetEditor
                :id="`widget-${item.id}`"
                :index="item.id"
                @remove="editor.removeWidget(item.id)" />
            </template>
          </DragDropList>
        </DragDropContainer>

        <Button
          type="button"
          variant="secondary"
          class="w-full justify-center border border-outline-variant bg-secondary-container text-on-secondary-container transition-colors"
          @click="handleAddWidget()">
          + Add Field
        </Button>
      </FormSection>
    </form>

    <template #sidebar-actions>
      <div class="flex flex-col gap-2">
        <div class="grid grid-cols-2 gap-4">
          <Button type="button" @click="$emit('cancel')">Cancel</Button>
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
                <button
                  type="button"
                  class="flex items-center gap-1.5 py-0.5 w-full text-left hover:text-on-surface transition-colors"
                  @click="scrollToWidget(item.id)">
                  <component
                    :is="fieldTypeIcon(form.widgetArray[item.id].fieldTypeId)"
                    class="w-3.5 h-3.5 shrink-0 text-primary opacity-70" />
                  <span class="truncate text-on-surface-variant text-xs">
                    {{ form.widgetArray[item.id].label || "(new field)" }}
                  </span>
                </button>
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
                <button
                  type="button"
                  class="flex items-center gap-1.5 py-0.5 w-full text-left hover:text-on-surface transition-colors"
                  @click="scrollToWidget(item.id)">
                  <component
                    :is="fieldTypeIcon(form.widgetArray[item.id].fieldTypeId)"
                    class="w-3.5 h-3.5 shrink-0 text-primary opacity-70" />
                  <span class="truncate text-on-surface-variant text-xs">
                    {{ form.widgetArray[item.id].label || "(new field)" }}
                  </span>
                </button>
              </template>
            </DragDropList>
          </DragDropContainer>
        </div>
      </div>
    </template>
  </FormPageLayout>
</template>

<script setup lang="ts">
import { inject, provide, ref, computed, nextTick, type Component } from "vue";
import {
  TypeIcon,
  TriangleAlertIcon,
  CheckCircle2Icon,
  ChevronsUpDownIcon,
  ChevronsDownUpIcon,
} from "lucide-vue-next";
import FormPageLayout from "@/layouts/FormPageLayout.vue";
import FormSection from "@/components/Form/FormSection.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import SegmentedControl from "@/components/SegmentedControl/SegmentedControl.vue";
import ToggleGroup from "@/components/ToggleGroup/ToggleGroup.vue";
import Button from "@/components/Button/Button.vue";
import IconButton from "@/components/IconButton/IconButton.vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import { ChevronRightIcon } from "@/icons";
import { DragDropContainer, DragDropList } from "@/components/DragDropList";
import WidgetEditor from "./WidgetEditor/WidgetEditor.vue";
import { useFieldTypesQuery } from "@/queries/useTemplateQuery";
import { TEMPLATE_EDITOR_KEY } from "../useTemplateEditor/useTemplateEditor";
import { WIDGET_EXPANSION_KEY } from "./widgetExpansionKey";
import { FIELD_TYPE_NAME_ICONS } from "./fieldTypeConstants";
import type { SelectOption } from "@/types";
import Tuple from "@/components/Tuple/Tuple.vue";

defineEmits<{ save: []; cancel: [] }>();

const editor = inject(TEMPLATE_EDITOR_KEY)!;
const form = editor.form;

const showAdvanced = ref(false);

// Track which widgets have their options panel open, keyed by stable _tempId.
const expandedTempIds = ref(new Set<string>());

provide(WIDGET_EXPANSION_KEY, {
  isExpanded: (tempId) => expandedTempIds.value.has(tempId),
  setExpanded: (tempId, open) => {
    if (open) expandedTempIds.value.add(tempId);
    else expandedTempIds.value.delete(tempId);
  },
});

const allExpanded = computed(
  () =>
    form.widgetArray.length > 0 &&
    form.widgetArray.every((w) => expandedTempIds.value.has(w._tempId))
);

function toggleAllWidgetOptions() {
  if (allExpanded.value) {
    expandedTempIds.value.clear();
    return;
  }
  form.widgetArray.forEach((w) => expandedTempIds.value.add(w._tempId));
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

const { data: fieldTypes } = useFieldTypesQuery();

function fieldTypeIcon(typeId: number): Component {
  const name = fieldTypes.value?.find((ft) => ft.id === typeId)?.name;
  return (name ? FIELD_TYPE_NAME_ICONS[name] : undefined) ?? TypeIcon;
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

async function handleAddWidget() {
  const widget = editor.addWidget();
  expandedTempIds.value.add(widget._tempId);
  await nextTick();
  scrollToWidget(form.widgetArray.length - 1);
}

function scrollToWidget(index: number) {
  const el = document.getElementById(`widget-${index}`);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "center" });

  // Reuse the DnD flash animation on the list item wrapper after scrolling arrives.
  const listItem = el.closest(".drag-drop-list-item");
  if (listItem) {
    setTimeout(() => {
      listItem.classList.add("drag-drop-list-item--flash");
      setTimeout(
        () => listItem.classList.remove("drag-drop-list-item--flash"),
        1000
      );
    }, 300);
  }
}
</script>
