<template>
  <div class="flex flex-col gap-1">
    <label class="text-xs uppercase font-medium text-on-surface sr-only">
      Field type
    </label>
    <Listbox
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)">
      <Float
        placement="bottom-start"
        flip
        shift
        adaptiveWidth
        :offset="4"
        zIndex="99"
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
        tailwindcssOriginClass>
        <ListboxButton
          class="flex items-center gap-2 w-full rounded-md text-sm text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary px-3 py-2 bg-surface-container hover:bg-surface-container-high text-primary">
          <template v-if="selectedOption">
            <component
              :is="selectedOption.icon"
              class="w-4 h-4 shrink-0 text-primary" />
            <span class="flex-1 truncate">{{ selectedOption.label }}</span>
          </template>
          <template v-else>
            <CircleHelpIcon class="w-4 h-4 shrink-0 text-on-surface-variant" />
            <span class="flex-1 truncate text-on-surface-variant">
              Unknown type
            </span>
          </template>
          <ChevronsUpDownIcon class="w-4 h-4 shrink-0 text-primary" />
        </ListboxButton>
        <ListboxOptions
          class="rounded-md bg-surface-container shadow-lg ring-1 ring-outline-variant focus:outline-none max-h-64 overflow-y-auto py-1">
          <ListboxOption
            v-for="opt in options"
            v-slot="{ active, selected }"
            :key="opt.id"
            :value="opt.id">
            <li
              :class="[
                'flex items-center gap-2 px-3 py-2 text-sm cursor-default select-none',
                active
                  ? 'bg-surface-container-high text-on-surface'
                  : 'text-on-surface-variant',
                selected ? 'font-medium text-on-surface' : '',
              ]">
              <component :is="opt.icon" class="w-4 h-4 shrink-0 text-primary" />
              <span class="flex-1 truncate">{{ opt.label }}</span>
              <CheckIcon
                v-if="selected"
                class="w-4 h-4 shrink-0 text-primary" />
            </li>
          </ListboxOption>
        </ListboxOptions>
      </Float>
    </Listbox>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from "vue";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";
import { Float } from "@headlessui-float/vue";
import { ChevronsUpDownIcon, CheckIcon, CircleHelpIcon } from "lucide-vue-next";

export interface FieldTypeOption {
  id: number;
  label: string;
  icon: Component;
}

const props = defineProps<{
  modelValue: number;
  options: FieldTypeOption[];
}>();

defineEmits<{ "update:modelValue": [value: number] }>();

const selectedOption = computed(
  () => props.options.find((o) => o.id === props.modelValue) ?? props.options[0]
);
</script>
