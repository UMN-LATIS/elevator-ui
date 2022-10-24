<template>
  <button
    class="x-button inline-flex bg-transparent-black-50 text-neutral-700 w-8 h-8 rounded-full leading-none items-center justify-center transition ease-in-out hover:bg-transparent-black-900 hover:text-white"
    @click="$emit('click')"
  >
    <Icon label="close">close</Icon>
  </button>
</template>
<script setup lang="ts">
import Icon from "../Icon/Icon.vue";

defineEmits<{
  (eventName: "click");
}>();
</script>
<style scoped></style>
