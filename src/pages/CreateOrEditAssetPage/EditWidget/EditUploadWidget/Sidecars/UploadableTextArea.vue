<template>
  <div>
    <TextAreaGroup
      :modelValue="modelValue"
      :label="label"
      :placeholder="placeholder"
      :inputClass="
        cn(
          'bg-surface-container-lowest border-0 rounded-b-none placeholder:text-on-surface-variant px-4 py-3',
          inputClass
        )
      "
      :labelClass="labelClass"
      @update:modelValue="($event) => $emit('update:modelValue', $event)">
      <template #append>
        <FileReaderInputGroup
          class="bg-surface-container-lowest rounded-b-md mt-0"
          label="Import"
          labelClass="sr-only"
          inputClass="px-4 py-3"
          @update="
            ({ fileContents }) => $emit('update:modelValue', fileContents)
          " />
      </template>
    </TextAreaGroup>
  </div>
</template>
<script setup lang="ts">
import FileReaderInputGroup from "@/components/FileReaderInputGroup/FileReaderInputGroup.vue";
import TextAreaGroup from "@/components/TextAreaGroup/TextAreaGroup.vue";
import { cn } from "@/lib/utils";

withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    labelClass?: string;
    placeholder?: string;
    inputClass?: string;
  }>(),
  {
    labelClass: "",
    placeholder: "",
    inputClass: "",
  }
);

defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>
<style scoped></style>
