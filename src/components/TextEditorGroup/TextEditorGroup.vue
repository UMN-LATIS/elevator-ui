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
      :enableImageInsert="enableImageInsert"
      :enableHtmlEditButton="enableHtmlEditButton"
      @update:modelValue="$emit('update:modelValue', $event)"
      @userInput="$emit('userInput')" />
  </div>
</template>

<script setup lang="ts">
import { ref, useId, defineAsyncComponent } from "vue";
import { cn } from "@/lib/utils";
import type { CSSClass } from "@/types";

const TextEditor = defineAsyncComponent(
  () => import("@/components/TextEditor/TextEditor.vue")
);

withDefaults(
  defineProps<{
    label: string;
    modelValue: string;
    labelClass?: CSSClass;
    enableImageInsert?: boolean;
    enableHtmlEditButton?: boolean;
  }>(),
  {
    labelClass: "",
    enableImageInsert: false,
    enableHtmlEditButton: true,
  }
);

defineEmits<{
  (eventName: "update:modelValue", value: string): void;
  (eventName: "userInput"): void;
}>();

const id = useId();
const editorRef = ref<InstanceType<typeof TextEditor>>();

function getSemanticHtml(): string {
  return editorRef.value?.getSemanticHtml() ?? "";
}

defineExpose({
  getSemanticHtml,
});
</script>
