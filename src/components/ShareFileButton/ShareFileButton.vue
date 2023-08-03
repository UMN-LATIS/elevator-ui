<template>
  <IconButton title="Share" @click="isOpen = !isOpen">
    <ShareIcon />
    <span class="sr-only">Share</span>
  </IconButton>
  <Modal
    label="Share"
    :isOpen="isOpen"
    class="max-w-xl mx-auto"
    @close="isOpen = false"
  >
    <div class="flex flex-col gap-4">
      <CopyableTextArea label="Embed" :value="embedValue" />
      <CopyableTextArea label="Link" :value="linkValue" />
      <Button
        icon="open_in_new"
        label="Open in New Window"
        :href="linkValue"
        target="_blank"
        >Open Viewer in New Window</Button
      >
    </div>
  </Modal>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import IconButton from "@/components/IconButton/IconButton.vue";
import config from "@/config";
import Modal from "@/components/Modal/Modal.vue";
import CopyableTextArea from "@/components/CopyableTextArea/CopyableTextArea.vue";
import Button from "@/components/Button/Button.vue";
import ShareIcon from "@/icons/ShareIcon.vue";

const props = defineProps<{
  fileObjectId: string;
}>();

const removeExtraWhitespace = (str: string) => str.replace(/\s+/g, " ").trim();

const isOpen = ref(false);
const linkValue = computed(
  () =>
    `${config.instance.base.url}/asset/getEmbed/${props.fileObjectId}/null/true`
);

const embedValue = computed(() => {
  return removeExtraWhitespace(`
  <iframe width="560" height="480" src="${linkValue.value}" frameborder="0" allowfullscreen></iframe>`);
});
</script>
<style scoped></style>
