<template>
  <div class="search-bar">
    <InputGroup
      id="search"
      ref="inputGroup"
      label="Search"
      :labelHidden="true"
      placeholder="Search"
    >
      <template #prepend>
        <SearchIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
      </template>
      <template #append>
        <KeyboardShortcut class="mx-2">⌘K</KeyboardShortcut>
        <button><OptionsIcon /></button>
      </template>
    </InputGroup>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { OptionsIcon, SearchIcon } from "@/icons";
import KeyboardShortcut from "../KeyboardShortcut/KeyboardShortcut.vue";
import InputGroup from "../InputGroup/InputGroup.vue";

const inputGroup = ref<InstanceType<typeof InputGroup> | null>(null);

// focus input when ⌘K is pressed
document.addEventListener("keydown", (event) => {
  if (!inputGroup.value) return;
  if (event.metaKey && event.key === "k") {
    event.preventDefault();
    inputGroup.value.$el.querySelector("input")?.focus();
  }
});
</script>
<style scoped></style>
