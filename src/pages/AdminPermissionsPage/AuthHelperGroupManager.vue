<template>
  <div class="">
    Auth Helper Group Manager

    {{ group }}
  </div>
</template>
<script setup lang="ts">
import { PermissionsGroup } from "@/types";
defineProps<{
  group: PermissionsGroup;
}>();
</script>
<style scoped></style>
