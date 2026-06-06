<template>
  <Modal
    label="Give us a moment"
    :isOpen="isOpen"
    class="max-w-md"
    @close="emit('close')">
    <p>
      It's going to take some time to get that file ready for you. We'll send
      you an email when it's all set.
    </p>
  </Modal>
</template>
<script setup lang="ts">
import Modal from "@/components/Modal/Modal.vue";

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (eventName: "close"): void;
}>();
</script>
<style scoped></style>
