<template>
  <FormPageLayout :title="editor.isEditMode.value ? 'Edit Template' : 'New Template'">
    <form id="template-form" @submit.prevent="$emit('save')">
      <FormSection id="basic" title="Basic">
        <InputGroup v-model="form.name" label="Name" required placeholder="e.g. Article" />
      </FormSection>

      <FormSection id="search" title="Search & Indexing">
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
      </FormSection>

      <FormSection id="display" title="Display">
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
      </FormSection>

      <FormSection id="widgets" title="Widgets">
        <WidgetEditor
          v-for="(widget, index) in form.widgetArray"
          :key="index"
          :index="index"
          :widget="widget"
          @remove="editor.removeWidget(index)" />

        <Button type="button" variant="secondary" @click="editor.addWidget()">
          + Add widget
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
        {{ editor.isEditMode.value ? 'Save changes' : 'Create template' }}
      </Button>
    </template>
  </FormPageLayout>
</template>

<script setup lang="ts">
import { inject, computed } from "vue";
import FormPageLayout from "@/layouts/FormPageLayout.vue";
import FormSection from "@/components/Form/FormSection.vue";
import FormSubSection from "@/components/Form/FormSubSection.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import ToggleGroup from "@/components/ToggleGroup/ToggleGroup.vue";
import Button from "@/components/Button/Button.vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import WidgetEditor from "./WidgetEditor/WidgetEditor.vue";
import { TEMPLATE_EDITOR_KEY } from "../useTemplateEditor/useTemplateEditor";
import type { SelectOption } from "@/types";

defineEmits<{ save: [] }>();

const editor = inject(TEMPLATE_EDITOR_KEY)!;
const form = editor.form;

const positionOptions: SelectOption<number>[] = [
  { id: 0, label: "Bottom" },
  { id: 1, label: "Top" },
];

const recursiveIndexDepthOptions: SelectOption<number>[] = [
  { id: 0, label: "0 — This asset's fields only" },
  { id: 1, label: "1 — Include direct related assets' text" },
  { id: 2, label: "2 — Include related assets' related assets' text" },
];
</script>
