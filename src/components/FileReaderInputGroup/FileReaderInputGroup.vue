<template>
  <div class="file-read-input-group">
    <label
      :class="
        cn(
          'block text-xs font-medium text-on-surface uppercase mb-1',
          labelClass
        )
      "
      :for="`file-${id}`">
      {{ label }}
    </label>
    <input
      :id="`file-${id}`"
      type="file"
      :class="cn('block w-full text-sm text-on-surface-variant', inputClass)"
      @change="handleFileChange" />
  </div>
</template>
<script setup lang="ts">
import { useId } from "vue";
import { cn } from "@/lib/utils";
import { CSSClass } from "@/types";

withDefaults(
  defineProps<{
    label: string;
    placeholder?: string;
    labelClass?: CSSClass;
    inputClass?: CSSClass;
  }>(),
  {
    placeholder: "",
    labelClass: "",
    inputClass: "",
  }
);

const emit = defineEmits<{
  (
    e: "update",
    { fileContents, file }: { fileContents: string; file: File }
  ): void;
}>();

const id = useId();

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) {
    console.warn("No files selected");
    return;
  }
  const file = target.files[0];

  const content = await readFileAsText(file);
  emit("update", {
    fileContents: content,
    file,
  });
}
</script>
<style scoped></style>
