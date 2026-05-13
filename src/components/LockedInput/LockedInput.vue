<template>
  <div :class="cn('flex flex-col gap-1 w-full', attrs.class as ClassValue)">
    <div
      :class="
        cn(
          'flex w-full rounded-md items-center',
          isEditing
            ? 'border border-outline-variant bg-surface-container focus-within:ring-2 focus-within:ring-primary'
            : 'bg-transparent',
          error && 'border-error focus-within:ring-error',
          wrapperClass
        )
      ">
      <input
        ref="inputEl"
        v-model="draft"
        :readonly="!isEditing"
        :aria-describedby="error ? errorId : undefined"
        v-bind="inputAttrs"
        :class="
          cn(
            'w-full bg-transparent p-0 text-xs text-on-surface-variant border-none focus:ring-0',
            isEditing && 'pr-2 text-on-surface',
            inputClass
          )
        "
        @input="refreshValidity"
        @keydown.enter.prevent="commitOrToggle"
        @keydown.escape.prevent="cancel" />
      <IconButton v-if="isEditing" title="Cancel changes" @click="cancel">
        <Undo2Icon class="w-3 h-3" />
      </IconButton>
      <IconButton
        :title="isEditing ? saveLabel : editLabel"
        @click="commitOrToggle">
        <CheckIcon v-if="isEditing" class="w-3 h-3" />
        <PencilIcon v-else class="w-3 h-3" />
      </IconButton>
    </div>
    <p v-if="error" :id="errorId" class="text-error text-xs">
      {{ error }}
    </p>
    <p
      v-else-if="isEditing && $slots.help"
      class="text-on-surface-variant text-xs">
      <slot name="help" />
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useAttrs, useId, watch } from "vue";
import { CheckIcon, PencilIcon, Undo2Icon } from "lucide-vue-next";
import IconButton from "@/components/IconButton/IconButton.vue";
import { type ClassValue } from "clsx";
import { cn } from "@/lib/utils";

defineOptions({ inheritAttrs: false });

// Route `class` to the wrapper (so layout utilities like `max-w-*` work as
// expected on the call site) and forward everything else to the inner input.
const attrs = useAttrs();
const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const props = withDefaults(
  defineProps<{
    modelValue: string;
    editLabel?: string;
    saveLabel?: string;
    /** Cross-field validation. Return "" when valid, otherwise the message. */
    validate?: (value: string) => string;
    wrapperClass?: string;
    inputClass?: string;
  }>(),
  {
    editLabel: "Edit",
    saveLabel: "Save",
    validate: undefined,
    wrapperClass: undefined,
    inputClass: undefined,
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const inputEl = ref<HTMLInputElement | null>(null);
const isEditing = ref(false);
const draft = ref(props.modelValue);
const error = ref("");
const errorId = `locked-input-error-${useId()}`;

// Keep the draft in sync when the parent model changes and we're not editing.
watch(
  () => props.modelValue,
  (value) => {
    if (isEditing.value) return;
    draft.value = value;
  }
);

function refreshValidity() {
  const el = inputEl.value;
  if (!el) return;
  const customError = props.validate?.(draft.value.trim()) ?? "";
  el.setCustomValidity(customError);
  error.value = el.validity.valid ? "" : el.validationMessage;
}

async function startEdit() {
  draft.value = props.modelValue;
  error.value = "";
  isEditing.value = true;
  await nextTick();
  inputEl.value?.setCustomValidity("");
  inputEl.value?.focus();
  inputEl.value?.select();
}

function commit(): boolean {
  draft.value = draft.value.trim();
  refreshValidity();
  const el = inputEl.value;
  if (!el?.checkValidity()) {
    el?.focus();
    return false;
  }
  if (draft.value !== props.modelValue) {
    emit("update:modelValue", draft.value);
  }
  isEditing.value = false;
  return true;
}

function cancel() {
  draft.value = props.modelValue;
  error.value = "";
  inputEl.value?.setCustomValidity("");
  isEditing.value = false;
}

function commitOrToggle() {
  if (isEditing.value) commit();
  else void startEdit();
}
</script>
