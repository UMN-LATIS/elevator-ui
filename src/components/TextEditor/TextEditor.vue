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

const options = computed(() => ({
  theme: "snow",
  // bounds: editor.value ? editor.value.$el : null,
  modules: {
    toolbar: [
      [
        "bold",
        "italic",
        { list: "ordered" },
        { list: "bullet" },
        "link",
        "code-block",
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
</style>
