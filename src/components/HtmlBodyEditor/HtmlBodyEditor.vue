<template>
  <div>
    <div class="flex items-center justify-between gap-4 flex-wrap mb-3">
      <label
        v-if="isCustomHtml"
        :for="sourceFieldId"
        class="text-xs font-medium text-on-surface uppercase">
        {{ label }}
      </label>
      <!-- in simple formatting the editor carries its own label, hidden -->
      <span v-else aria-hidden="true" class="text-xs font-medium uppercase">
        {{ label }}
      </span>
      <MarkupStyleSwitch
        :isCustomHtml="isCustomHtml"
        :html="html"
        :markupLostBySimplifying="markupLostBySimplifying"
        :contentNoun="contentNoun"
        @chooseMarkupStyle="emit('chooseMarkupStyle', $event)" />
    </div>

    <p
      v-if="simplification"
      class="flex items-center gap-2 flex-wrap text-sm text-on-surface-variant bg-surface-container rounded-md px-3 py-2 mb-3"
      data-testid="markup-loss-report">
      Removed:
      <span class="font-mono">
        {{ toMarkupList(simplification.markupRemoved) }}
      </span>
      <Button
        variant="tertiary"
        data-testid="markup-undo"
        @click="emit('undoSimplifying')">
        Undo
      </Button>
    </p>

    <div v-if="isCustomHtml" class="sm:grid sm:grid-cols-2 gap-4">
      <textarea
        :id="sourceFieldId"
        :value="html"
        rows="14"
        class="w-full font-mono text-sm bg-surface-container border border-outline-variant rounded-lg p-3 focus:ring-2 focus:ring-primary focus:outline-none"
        data-testid="html-body-source-textarea"
        spellcheck="false"
        @input="reportSourceEdit" />

      <div
        class="border border-outline-variant rounded-lg p-3"
        data-testid="html-body-preview">
        <p class="text-xs font-medium text-on-surface-variant uppercase mb-2">
          Preview
        </p>
        <SanitizedHTML
          :html="html"
          :addTags="addTags"
          class="prose prose-neutral max-w-none" />
      </div>
    </div>

    <TextEditorGroup
      v-else
      ref="richEditorRef"
      :modelValue="quillSeedHtml"
      :label="label"
      labelHidden
      enableImageInsert
      enableHeadings
      :enableHtmlEditButton="false"
      @userInput="reportVisualEdit" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import TextEditorGroup from "@/components/TextEditorGroup/TextEditorGroup.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import Button from "@/components/Button/Button.vue";
import MarkupStyleSwitch from "./MarkupStyleSwitch.vue";
import { fromQuillHtml } from "./fromQuillHtml";
import { toMarkupList } from "./markupLostByQuill";
import type { BodyMarkupStyle, BodyMarkupStyleName } from "./useHtmlBodyEditor";

const props = withDefaults(
  defineProps<{
    html: string;
    markupStyle: BodyMarkupStyle;
    markupLostBySimplifying: string[];
    label?: string;
    contentNoun: string;
    addTags: string[];
  }>(),
  {
    label: "Body",
  }
);

const emit = defineEmits<{
  (event: "update:html", html: string): void;
  (event: "chooseMarkupStyle", name: BodyMarkupStyleName): void;
  (event: "undoSimplifying"): void;
}>();

const sourceFieldId = `html-body-source-${useId()}`;
const richEditorRef = ref<InstanceType<typeof TextEditorGroup>>();

const isCustomHtml = computed(() => props.markupStyle.name === "customHtml");

const simplification = computed(() =>
  props.markupStyle.name === "simpleFormatting"
    ? props.markupStyle.simplification
    : null
);

// Quill owns its document once it opens, so it gets the body as a seed
// rather than a binding. Handing it the live html would re-paste on every
// keystroke and drop the cursor.
const quillSeedHtml = ref(props.html);
let htmlLastReported = props.html;

watch(
  [() => props.markupStyle.name, () => props.html],
  ([styleName], [previousStyleName]) => {
    // reseed for a body that came from anywhere but this editor: a switch
    // into simple formatting, an undo, a page that finished loading late
    if (styleName !== "simpleFormatting") return;
    const isSwitchingIntoSimpleFormatting = previousStyleName !== styleName;
    if (!isSwitchingIntoSimpleFormatting && props.html === htmlLastReported)
      return;

    quillSeedHtml.value = props.html;
  }
);

function reportSourceEdit(event: Event): void {
  emit("update:html", (event.target as HTMLTextAreaElement).value);
}

function reportVisualEdit(): void {
  const editor = richEditorRef.value;
  if (!editor) return;

  htmlLastReported = fromQuillHtml(editor.getSemanticHtml());
  emit("update:html", htmlLastReported);
}
</script>
