<template>
  <div class="card-grid">
    <slot />
  </div>
</template>
<script setup lang="ts"></script>
<style scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 0.5rem;
}
</style>
