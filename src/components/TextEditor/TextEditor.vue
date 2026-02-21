<template>
  <div
    class="relative bg-surface-container border border-outline-variant rounded-lg"
    data-cy="text-block-input-container">
    <QuillyEditor
      ref="editor"
      :modelValue="modelValue"
      :options="options"
      class="rounded-sm focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-primary"
      data-cy="text-block-input"
      @update:modelValue="handleUpdate" />
  </div>
</template>
<script setup lang="ts">
import { QuillyEditor } from "vue-quilly";
import Quill from "quill/quill";
import { ref, onMounted, computed } from "vue";
import { cleanHtml } from "@/helpers/htmlCleaningHelpers";
import "quill-paste-smart";
import htmlEditButton from "quill-html-edit-button";
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";

withDefaults(
  defineProps<{
    modelValue: string;
    id?: string;
  }>(),
  {
    id: "",
  }
);

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const editor = ref<InstanceType<typeof QuillyEditor>>();
let quill: Quill | null = null;

// Handle update event with semantic HTML conversion
function handleUpdate(quillHTML: string) {
  if (!quill) {
    return;
  }

  emit("update:modelValue", quillHTML);
}

Quill.register("modules/htmlEditButton", htmlEditButton);

const options = computed(() => ({
  theme: "snow",
  // bounds: editor.value ? editor.value.$el : null,
  modules: {
    htmlEditButton: {
      buttonHTML: "&lt;/&gt;",
      okText: "Submit",
      msg: 'Edit HTML here, when you click "Submit" the quill editor\'s contents will be replaced',
    },
    toolbar: [
      [
        "bold",
        "italic",
        { list: "ordered" },
        { list: "bullet" },
        "link",
        "formula",
        { direction: "rtl" }, // text direction
        "clean",
      ],
    ],
    keyboard: {
      bindings: {
        // disable tab key
        tab: {
          key: "Tab",
          handler: () => true,
        },
        clearFormatting: {
          key: "\\",
          shortKey: true,
          handler(range) {
            if (!quill) {
              return;
            }
            quill.removeFormat(range.index, range.length, Quill.sources.USER);
          },
        },
      },
    },
  },
  placeholder: "Write something...",
  readOnly: false,
}));

/**
 * Returns the editor content as cleaned semantic HTML.
 * Call this at save time to get properly formatted content.
 */
function getCleanHtml(): string {
  if (!quill) return "";
  return cleanHtml(quill.root.innerHTML);
}

defineExpose({
  quill,
  getCleanHtml,
});

onMounted(() => {
  if (!editor.value) {
    throw new Error("Editor element not found");
  }

  quill = editor.value.initialize(Quill);
});
</script>
<style scoped></style>
<style type="postcss">
/* QuillJS Placeholder style */
.ql-editor.ql-blank::before {
  @apply text-on-surface-variant opacity-40;
}

.ql-toolbar.ql-snow {
  border: none;
  background: var(--surface-container-high);
  border-bottom: 1px solid var(--outline-variant);
}
.ql-container.ql-snow {
  border: none;
}

.ql-toolbar.ql-snow button {
  @apply text-on-surface opacity-50;
}

.ql-toolbar.ql-snow :is(button:hover, button:focus) {
  @apply text-on-surface opacity-100 bg-surface-container rounded;
}

.ql-toolbar.ql-snow :is(button.ql-active) {
  @apply text-secondary-container opacity-100 bg-on-secondary-container rounded;
}

.ql-toolbar.ql-snow :is(.ql-stroke, button:hover .ql-stroke) {
  @apply stroke-current;
}

.ql-toolbar.ql-snow
  :is(
    .ql-fill,
    .ql-stroke.ql-fill,
    button:hover .ql-fill,
    button:hover .ql-stroke.ql-fill
  ) {
  @apply fill-current;
}

/* HTML Edit Button specific overrides */

.ql-snow.ql-toolbar button[title="Show HTML source"] {
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  font-size: 0.66rem;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: -1px;
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
}

.ql-html-overlayContainer {
  background: var(--scrim);

  & .ql-html-popupContainer {
    width: 90dvw;
    height: 80dvh;
    max-width: 50rem;
    position: absolute;
    top: 50%;
    right: initial;
    bottom: initial;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--surface);
    color: var(--on-surface);
    border: 1px solid var(--outline-variant);
    border-radius: 0.375rem; /* rounded-md */
    z-index: 10;
    display: flex;
    flex-direction: column;
  }

  & .ql-html-textContainer {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  & .ql-html-textArea.ql-container {
    margin: 1rem 0;
    position: static;
    left: 0;
    background: var(--surface-container);
    border-radius: 0.375rem; /* rounded-md */
    height: auto;
    width: auto;
    flex: 1;
    border: 1px solid var(--outline);

    &:focus-within {
      @apply ring-2 ring-outline;
      background: var(--surface-container-high);
    }
  }

  & .ql-html-buttonGroup {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.5rem;
    padding: 0.5rem;
    position: static;
    transform: initial;
    gap: 0.5rem;

    & button {
      border: 1px solid var(--outline);
      margin: 0;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem; /* rounded-md */
      transition: all 0.2s;
    }
  }

  & .ql-html-buttonCancel {
    border-color: var(--outline);
    color: var(--on-surface);

    &:hover {
      border-color: var(--primary);
      color: var(--primary);
    }
  }
  & .ql-html-buttonOk {
    border-color: var(--primary);
    background-color: var(--primary);
    color: var(--on-primary);

    &:hover {
      background-color: color-mix(in oklch, var(--primary) 90%, transparent);
      border-color: var(--primary);
      color: var(--on-primary);
    }
  }
}

.ql-editor p,
.ql-editor ol,
.ql-editor pre,
.ql-editor blockquote,
.ql-editor h1,
.ql-editor h2,
.ql-editor h3,
.ql-editor h4,
.ql-editor h5,
.ql-editor h6 {
  margin-bottom: 1rem;
}
</style>
