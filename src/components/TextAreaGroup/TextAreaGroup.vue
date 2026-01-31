<template>
  <div class="text-area">
    <div class="flex justify-between items-baseline">
      <slot :id="`textarea-${id}`" name="label">
        <label
          :for="`textarea-${id}`"
          :class="
            cn(
              'block text-xs font-medium text-neutral-700 uppercase mb-1',
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
    <div class="flex relative">
      <textarea
        :id="`textarea-${id}`"
        :name="`textarea-${id}`"
        :class="
          cn(
            'text-area-input block w-full rounded-md border-none focus:border-blue-500 focus:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-2  sm:text-sm p-2 font-mono text-neutral-700 focus:text-neutral-900 h-24 bg-black/5 placeholder:text-black/30',
            inputClass
          )
        "
        :placeholder="placeholder"
        :value="modelValue"
        :readonly="readonly"
        @input="(event) => $emit('update:modelValue', (event.target as HTMLTextAreaElement).value)" />
    </div>
    <slot name="append" />
  </div>
</template>
<script setup lang="ts">
import { useId } from "vue";
import { cn } from "@/lib/utils";
import { CSSClass } from "@/types";

withDefaults(
  defineProps<{
    label: string;
    modelValue: string;
    placeholder?: string;
    inputClass?: CSSClass;
    labelClass?: CSSClass;
    readonly?: boolean;
  }>(),
  {
    placeholder: "",
    inputClass: "",
    labelClass: "",
    readonly: false,
  }
);

defineEmits<{
  (eventName: "update:modelValue", value: string): void;
}>();

const id = useId();
</script>
<style scoped></style>
