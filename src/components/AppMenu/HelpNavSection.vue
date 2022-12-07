<template>
  <AppMenuGroup label="Help">
    <AppMenuItem href="http://umn-latis.github.io/elevator/">
      Documentation
    </AppMenuItem>
    <AppMenuItem v-if="instance.contact" :href="instance.contact">
      Contact
    </AppMenuItem>
  </AppMenuGroup>
</template>
<script setup lang="ts">
import { ElevatorInstance } from "@/types";
import AppMenuGroup from "./AppMenuGroup.vue";
import AppMenuItem from "./AppMenuItem.vue";

defineProps<{
  instance: ElevatorInstance;
}>();
</script>
<style scoped></style>
