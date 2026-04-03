<template>
  <Modal
    :isOpen="isOpen"
    label="Insert Image"
    class="max-w-md"
    @close="emit('close')">
    <div class="flex flex-col gap-3">
      <!-- URL input -->
      <InputGroup
        ref="urlInputRef"
        v-model="urlValue"
        label="Image URL"
        type="url"
        placeholder="https://example.com/image.jpg"
        @keydown.enter="handleInsert" />
      <p v-if="urlError" class="text-error text-xs -mt-2">{{ urlError }}</p>

      <!-- Divider -->
      <div
        class="flex items-center gap-3 text-on-surface-variant before:flex-1 before:h-px before:bg-outline-variant after:flex-1 after:h-px after:bg-outline-variant">
        <span class="text-xs uppercase tracking-wider">or</span>
      </div>

      <!-- File input -->
      <FileReaderInputGroup
        label="Embed from file"
        accept="image/*"
        readAs="dataURL"
        :maxFileSize="MAX_FILE_SIZE"
        @update="handleFileSelected"
        @error="handleFileError" />
      <p v-if="fileError" class="text-error text-xs -mt-2">{{ fileError }}</p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2 p-4">
        <Button variant="tertiary" @click="emit('close')">Cancel</Button>
        <Button variant="primary" :disabled="!canInsert" @click="handleInsert">
          Insert
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  nextTick,
  type ComponentPublicInstance,
} from "vue";
import Modal from "@/components/Modal/Modal.vue";
import Button from "@/components/Button/Button.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import FileReaderInputGroup from "@/components/FileReaderInputGroup/FileReaderInputGroup.vue";

const emit = defineEmits<{
  (event: "close"): void;
  (event: "insert", src: string): void;
}>();

const props = defineProps<{
  isOpen: boolean;
}>();

/** 10 MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const urlInputRef = ref<ComponentPublicInstance | null>(null);
const urlValue = ref("");
const pendingDataUrl = ref<string | null>(null);
const urlError = ref("");
const fileError = ref("");

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const canInsert = computed(() => {
  if (pendingDataUrl.value) return true;
  const trimmed = urlValue.value.trim();
  return trimmed && isValidUrl(trimmed);
});

watch(urlValue, (val) => {
  const trimmed = val.trim();
  if (!trimmed) {
    urlError.value = "";
    return;
  }
  urlError.value = isValidUrl(trimmed) ? "" : "Please enter a valid URL";
});

/** Reset state whenever the dialog opens */
watch(
  () => props.isOpen,
  async (open) => {
    if (!open) return;
    urlValue.value = "";
    pendingDataUrl.value = null;
    urlError.value = "";
    fileError.value = "";
    await nextTick();
    urlInputRef.value?.$el.querySelector("input")?.focus();
  }
);

function handleFileSelected({ fileContents }: { fileContents: string }) {
  fileError.value = "";
  pendingDataUrl.value = fileContents;
  urlValue.value = "";
}

function handleFileError(message: string) {
  fileError.value = message;
  pendingDataUrl.value = null;
}

function handleInsert() {
  const src = urlValue.value.trim() || pendingDataUrl.value;
  if (!src) return;
  emit("insert", src);
  emit("close");
}
</script>
