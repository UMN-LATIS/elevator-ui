<template>
  <div>
    <div class="flex justify-between items-baseline">
      <slot :id="`text-editor-${id}`" name="label">
        <label
          :for="`text-editor-${id}`"
          :class="
            cn(
              'block text-xs font-medium text-on-surface uppercase mb-1',
              labelClass
            )
          ">
          {{ label }}
        </label>
      </slot>
      <div>
        <slot name="corner" />
      </div>
    </div>
    <TextEditor
      :id="`text-editor-${id}`"
      ref="editorRef"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)" />
  </div>
</template>

<script setup lang="ts">
import { ref, useId } from "vue";
import { cn } from "@/lib/utils";
import TextEditor from "@/components/TextEditor/TextEditor.vue";
import type { CSSClass } from "@/types";

withDefaults(
  defineProps<{
    label: string;
    modelValue: string;
    labelClass?: CSSClass;
  }>(),
  {
    labelClass: "",
  }
);

defineEmits<{
  (eventName: "update:modelValue", value: string): void;
}>();

const id = useId();
const editorRef = ref<InstanceType<typeof TextEditor>>();

function getCleanHtml(): string {
  return editorRef.value?.getCleanHtml() ?? "";
}

defineExpose({
  getCleanHtml,
});
</script>
