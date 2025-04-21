<template>
  <div class="">
    <Combobox
      by="label"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', ($event as string) ?? '')">
      <ComboboxAnchor>
        <div class="relative w-full items-center">
          <ComboboxInput
            :modelValue="input ?? ''"
            class="pl-9"
            :displayValue="(val) => val?.label ?? ''"
            placeholder="Select framework..." />
          <span
            class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
            <Search class="size-4 text-muted-foreground" />
          </span>
          <span
            class="absolute end-0 inset-y-0 flex items-center justify-center px-3">
            <SpinnerIcon
              v-if="isFetching"
              class="size-4 text-muted-foreground animate-spin" />
          </span>
        </div>
      </ComboboxAnchor>

      <ComboboxList>
        <ComboboxEmpty>None found.</ComboboxEmpty>

        <ComboboxGroup>
          <ComboboxItem
            v-for="option in options"
            :key="option.value"
            :value="option.value">
            {{ option.label }}

            <ComboboxItemIndicator>
              <Check :class="cn('ml-auto h-4 w-4')" />
            </ComboboxItemIndicator>
          </ComboboxItem>
        </ComboboxGroup>
      </ComboboxList>
    </Combobox>
  </div>
</template>
<script setup lang="ts">
import { cn } from "@/lib/utils";
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
} from "@/components/ui/combobox";
import { Check, Search } from "lucide-vue-next";
import { SpinnerIcon } from "@/icons";

withDefaults(
  defineProps<{
    modelValue: string; // value
    input: string;
    options?: Array<{
      value: string;
      label: string;
    }>;
    isFetching?: boolean;
  }>(),
  {
    options: () => [],
  }
);

defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:input", value: string): void;
}>();
</script>
<style scoped></style>
