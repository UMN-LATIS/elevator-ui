<template>
  <button class="x-button" @click="$emit('click')">
    <span class="material-symbols-outlined">close</span>
    <span class="sr-only">Close</span>
  </button>
</template>
<script setup lang="ts">
defineEmits<{
  (eventName: "click");
}>();
</script>
<style scoped>
.x-button {
  display: inline-flex;
  background: transparent;
  color: #111;
  border: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  line-height: 1;
  align-items: center;
  justify-content: center;
  transition: all ease 0.2s;
  background: rgba(0, 0, 0, 0.1);
}

.x-button:hover {
  background: rgba(0, 0, 0, 0.9);
  color: white;
}
</style>
