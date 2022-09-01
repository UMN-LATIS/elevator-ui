<template>
  <div class="notification-root">
    <div
      v-for="notification in notificationStore.notifications"
      :key="notification.id"
      class="notification-item"
    >
      {{ notification.message }}

      <button
        v-if="!notificationStore.autoHide"
        @click="notificationStore.hide(notification.id)"
      >
        Close
      </button>
      >
    </div>
  </div>
</template>
<script setup lang="ts">
import { useNotificationStore } from "@/stores/notificationStore";

const notificationStore = useNotificationStore();
</script>
<style scoped></style>
