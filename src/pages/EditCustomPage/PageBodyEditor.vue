<template>
  <div v-if="markupStyleName === 'customHtml'">
    <label
      :for="`page-body-source-${id}`"
      class="block text-xs font-medium text-on-surface uppercase mb-1">
      {{ label }}
    </label>

    <textarea
      :id="`page-body-source-${id}`"
      :value="html"
      rows="14"
      class="w-full font-mono text-sm bg-surface-container border border-outline-variant rounded-lg p-3 focus:ring-2 focus:ring-primary focus:outline-none"
      data-testid="page-body-source-textarea"
      spellcheck="false"
      @input="reportSourceEdit" />

    <div
      class="mt-4 border border-outline-variant rounded-lg p-3"
      data-testid="page-body-preview">
      <p class="text-xs font-medium text-on-surface-variant uppercase mb-2">
        Preview
      </p>
      <SanitizedHTML
        :html="html"
        :addTags="['style']"
        class="prose prose-neutral max-w-none" />
    </div>
  </div>

  <TextEditorGroup
    v-else
    ref="richEditorRef"
    :modelValue="quillSeedHtml"
    :label="label"
    enableImageInsert
    :enableHtmlEditButton="false"
    @userInput="reportVisualEdit" />
</template>

<script setup lang="ts">
import { ref, useId, watch } from "vue";
import TextEditorGroup from "@/components/TextEditorGroup/TextEditorGroup.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import { fromQuillHtml } from "./fromQuillHtml";
import type { BodyMarkupStyleName } from "./usePageBodyEditor";

const props = withDefaults(
  defineProps<{
    html: string;
    markupStyleName: BodyMarkupStyleName;
    label?: string;
  }>(),
  {
    label: "Body",
  }
);

const emit = defineEmits<{
  (event: "update:html", html: string): void;
}>();

const id = useId();
const richEditorRef = ref<InstanceType<typeof TextEditorGroup>>();

// Quill owns its document once it opens, so it gets the body as a seed
// rather than a binding. Handing it the live html would re-paste on every
// keystroke and drop the cursor.
const quillSeedHtml = ref(props.html);
let htmlLastReported = props.html;

watch([() => props.markupStyleName, () => props.html], ([styleName]) => {
  // reseed for a body that came from anywhere but this editor: a switch
  // into simple formatting, an undo, a page that finished loading late
  if (styleName !== "simpleFormatting") return;
  if (props.html === htmlLastReported) return;

  quillSeedHtml.value = props.html;
});

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
