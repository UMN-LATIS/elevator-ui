<template>
  <DefaultLayout>
    <template v-if="$slots['custom-header']" #custom-header>
      <slot name="custom-header" />
    </template>
    <template #sidebar>
      <AdminSidebar />
    </template>
    <template v-if="$slots.aside" #aside>
      <slot name="aside" />
    </template>
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
    <slot />
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from "./DefaultLayout.vue";
import AdminSidebar from "@/components/AdminSidebar/AdminSidebar.vue";
</script>
