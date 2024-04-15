<template>
  <Transition
    enterActiveClass="ease-inout duration-200"
    enterFromClass="opacity-0"
    enterToClass="opacity-100"
    leaveActiveClass="ease-inout duration-300"
    leaveFromClass="opacity-100"
    leaveToClass="opacity-0"
  >
    <slot />
  </Transition>
</template>
<script setup lang="ts"></script>
<style scoped></style>
