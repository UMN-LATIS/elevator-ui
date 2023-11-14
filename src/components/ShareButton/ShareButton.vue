<template>
  <IconButton title="Share" @click="isOpen = !isOpen">
    <ShareIcon />
    <span class="sr-only">Share</span>
    <Modal
      label="Share"
      :isOpen="isOpen"
      class="max-w-xl mx-auto"
      @close="isOpen = false">
      <div class="flex flex-col gap-4">
        <CopyableTextArea label="Embed" :value="embedValue" />
        <CopyableTextArea label="Link" :value="props.url" />
        <Button
          icon="open_in_new"
          label="Open in New Window"
          :href="props.url"
          target="_blank">
          Open Viewer in New Window
        </Button>
      </div>
    </Modal>
  </IconButton>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import IconButton from "@/components/IconButton/IconButton.vue";
import Modal from "@/components/Modal/Modal.vue";
import CopyableTextArea from "@/components/CopyableTextArea/CopyableTextArea.vue";
import Button from "@/components/Button/Button.vue";
import ShareIcon from "@/icons/ShareIcon.vue";

const props = defineProps<{
  url: string;
}>();

const removeExtraWhitespace = (str: string) => str.replace(/\s+/g, " ").trim();

const isOpen = ref(false);

const embedValue = computed(() => {
  return removeExtraWhitespace(`
  <iframe width="560" height="480" src="${props.url}" frameborder="0" allowfullscreen></iframe>`);
});
</script>
<style scoped></style>
