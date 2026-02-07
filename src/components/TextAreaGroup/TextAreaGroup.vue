<template>
  <div class="text-area">
    <div class="flex justify-between items-baseline">
      <slot :id="`textarea-${id}`" name="label">
        <label
          :for="`textarea-${id}`"
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
    <div class="flex relative">
      <textarea
        :id="`textarea-${id}`"
        :name="`textarea-${id}`"
        :class="
          cn(
            'text-area-input block w-full rounded-md border-none focus:border-primary focus:ring-primary focus-visible:ring-offset-2 focus-visible:ring-2 sm:text-sm px-4  py-2 text-on-surface focus:text-on-surface h-24 bg-black/5 placeholder:text-black/25',
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
