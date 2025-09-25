<template>
  <div class="relative" data-cy="text-block-input-container">
    <QuillyEditor
      ref="editor"
      :modelValue="modelValue"
      :options="options"
      class="rounded-sm focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-blue-600"
      data-cy="text-block-input"
      @update:modelValue="handleUpdate" />
  </div>
</template>
<script setup lang="ts">
import { QuillyEditor } from "vue-quilly";
import Quill from "quill/quill";
import { ref, onMounted, computed } from "vue";
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

// expose the quill instance so that parent can use
// quill.getSemanticHTML() to get the semantic HTML
defineExpose({
  quill,
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
.ql-toolbar.ql-snow {
  border: none;
}
.ql-container.ql-snow {
  border: none;
}

.ql-toolbar.ql-snow button {
  @apply text-neutral-900 opacity-50;
}

.ql-toolbar.ql-snow :is(button:hover, button:focus) {
  @apply text-neutral-900 opacity-100 bg-neutral-900/5 rounded;
}

.ql-toolbar.ql-snow :is(button.ql-active) {
  @apply text-neutral-50 opacity-100 bg-neutral-900 rounded;
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
  & .ql-html-popupContainer {
    width: 90dvw;
    height: 80dvh;
    position: absolute;
    top: 50%;
    right: initial;
    bottom: initial;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
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
    position: static;
    left: 0;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 0.375rem; /* rounded-md */
    height: auto;
    width: auto;
    flex: 1;
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
      border: var(--app-button-borderWidth) solid var(--app-button-borderColor);
      margin: 0;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem; /* rounded-md */
      transition: all 0.2s;
    }
  }

  & .ql-html-buttonCancel {
    background-color: var(--app-button-secondary-backgroundColor);
    border-color: var(--app-button-secondary-borderColor);
    color: var(--app-button-secondar-textColor);

    &:hover {
      background-color: var(--app-button-secondary-hover-backgroundColor);
      border-color: var(--app-button-secondary-hover-borderColor);
      color: var(--app-button-secondary-hover-textColor);
    }
  }
  & .ql-html-buttonOk {
    background-color: var(--app-button-primary-backgroundColor);
    border-color: var(--app-button-primary-borderColor);
    color: var(--app-button-primary-textColor);

    &:hover {
      background-color: var(--app-button-primary-hover-backgroundColor);
      border-color: var(--app-button-primary-hover-borderColor);
      color: var(--app-button-primary-hover-textColor);
    }
  }
}
</style>
