<template>
  <DefaultLayout>
    <template v-if="$slots['custom-header']" #custom-header>
      <slot name="custom-header" />
    </template>
    <div class="flex flex-1 min-h-0">
      <AdminSidebar class="hidden lg:block shrink-0" />
      <div class="flex-1 min-w-0">
        <slot />
      </div>
    </div>
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from "./DefaultLayout.vue";
import AdminSidebar from "@/components/AdminSidebar/AdminSidebar.vue";
</script>
