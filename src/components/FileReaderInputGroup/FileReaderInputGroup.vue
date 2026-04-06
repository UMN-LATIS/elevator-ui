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
      :accept="accept"
      :class="cn('block w-full text-sm text-on-surface-variant', inputClass)"
      @change="handleFileChange" />
  </div>
</template>
<script setup lang="ts">
import { useId } from "vue";
import { cn } from "@/lib/utils";
import { CSSClass } from "@/types";

const props = withDefaults(
  defineProps<{
    label: string;
    placeholder?: string;
    accept?: string;
    readAs?: "text" | "dataURL";
    /** Maximum file size in bytes. No limit if undefined. */
    maxFileSize?: number;
    labelClass?: CSSClass;
    inputClass?: CSSClass;
  }>(),
  {
    placeholder: "",
    accept: undefined,
    readAs: "text",
    maxFileSize: undefined,
    labelClass: "",
    inputClass: "",
  }
);

const emit = defineEmits<{
  (
    e: "update",
    { fileContents, file }: { fileContents: string; file: File }
  ): void;
  (e: "error", message: string): void;
}>();

const id = useId();

function readFile(file: File, mode: "text" | "dataURL"): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    if (mode === "dataURL") {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) {
    console.warn("No files selected");
    return;
  }
  const file = target.files[0];

  if (props.maxFileSize && file.size > props.maxFileSize) {
    emit(
      "error",
      `File is too large (${formatFileSize(
        file.size
      )}). Maximum size is ${formatFileSize(props.maxFileSize)}.`
    );
    target.value = "";
    return;
  }

  const content = await readFile(file, props.readAs ?? "text");
  emit("update", {
    fileContents: content,
    file,
  });
}
</script>
<style scoped></style>
