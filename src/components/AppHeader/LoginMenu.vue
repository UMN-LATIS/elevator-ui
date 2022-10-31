<template>
  <MenuAccordion label="Login">
    <ul
      class="absolute flex flex-col gap-2 w-48 bg-neutral-50 p-4 shadow rounded top-full mt-2 right-0"
    >
      <li>
        <a
          :href="`${config.base.url}/loginManager/remoteLogin/?redirect=${location}`"
          >University Login</a
        >
      </li>
      <li>
        <a
          :href="`${config.base.url}/loginManager/localLogin/?redirect=${location}`"
        >
          Guest Login
        </a>
      </li>
    </ul>
  </MenuAccordion>
</template>
<script setup lang="ts">
import MenuAccordion from "./MenuAccordion.vue";
import config from "@/config";
import { computed } from "vue";

const location = computed(() => window.location.href);
</script>
<style scoped></style>
