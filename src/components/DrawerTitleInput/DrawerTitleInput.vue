<template>
  <div class="drawer-title-input">
    <InputGroup
      id="new-drawer-title"
      :label="label"
      :modelValue="modelValue"
      :labelHidden="labelHidden"
      :placeholder="placeholder"
      :inputClass="inputClass"
      @update:modelValue="(val) => emit('update:modelValue', val)">
      <template #append>
        <button
          v-if="modelValue.length"
          type="button"
          class="text-transparent-black-500 hover:text-neutral-900 float-right"
          @click="resetForm">
          <span class="sr-only">Clear</span>
          <CircleXIcon />
        </button>
      </template>
    </InputGroup>
    <p
      v-if="!isTitleValid && modelValue.length > 0"
      class="text-xs text-error mt-1">
      Drawer title must be unique.
    </p>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import { useDrawerStore } from "@/stores/drawerStore";
import { CircleXIcon } from "@/icons";
import { CSSClass } from "@/types";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    labelHidden?: boolean;
    placeholder?: string;
    inputClass?: CSSClass;
  }>(),
  {
    label: "Drawer Title",
    labelHidden: false,
    placeholder: "New Drawer Title",
    inputClass: "",
  }
);

const emit = defineEmits<{
  (eventName: "update:modelValue", value: string);
}>();

const drawerStore = useDrawerStore();

const trimmedTitle = computed(() => props.modelValue.trim());
const isTitleNonEmpty = computed(() => props.modelValue.length > 0);
const isTitleUnique = computed(() => {
  return !drawerStore.drawers.some(
    (drawer) => drawer.title.trim() === trimmedTitle.value
  );
});

const isTitleValid = computed(() => {
  return isTitleNonEmpty.value && isTitleUnique.value;
});

function resetForm() {
  emit("update:modelValue", "");
}
</script>
<style scoped></style>
