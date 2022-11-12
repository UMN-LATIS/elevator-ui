<template>
  <div
    class="object-viewer__button-bar flex justify-end items-center gap-2 p-2"
  >
    <Button
      v-if="embeddedPlugin"
      class="block text-xs p-2 uppercase font-bold"
      variant="primary"
      @click="handleAddButtonClick"
    >
      <AddIcon v-if="addingToPluginStatus === 'idle'" />
      <SpinnerIcon v-if="addingToPluginStatus === 'loading'" />
      <CircleCheckIcon v-if="addingToPluginStatus === 'success'" />
      <CircleXIcon v-if="addingToPluginStatus === 'error'" />
      Add to {{ embeddedPlugin }}
    </Button>
    <ConfirmModal
      :isOpen="isInterstitialOpen"
      :label="`Add to ${embeddedPlugin}`"
      @close="handleCloseInterstitial"
      @confirm="handleInterstitialConfirm"
    >
      {{ interstitial?.interstitialText }}
    </ConfirmModal>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import Button from "@/components/Button/Button.vue";
import api from "@/helpers/api";
import { useSessionStorage } from "@vueuse/core";
import ConfirmModal from "../ConfirmModal/ConfirmModal.vue";
import { ApiInterstitialResponse } from "@/types";
import AddIcon from "@/icons/AddIcon.vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import CircleCheckIcon from "@/icons/CircleCheckIcon.vue";
import CircleXIcon from "@/icons/CircleXIcon.vue";

const embeddedPlugin = useSessionStorage("embeddedPlugin", null);

const props = defineProps<{
  fileHandlerId: string | null;
}>();

const isInterstitialOpen = ref(false);
const interstitial = ref<ApiInterstitialResponse | null>(null);
const isConfirmedToAdd = ref(false);
const addingToPluginStatus = ref<"idle" | "loading" | "success" | "error">(
  "idle"
);

onMounted(async () => {
  interstitial.value = await api.getEmbedPluginInterstitial();
});

async function handleAddButtonClick() {
  addingToPluginStatus.value = "loading";

  if (!interstitial.value) {
    addingToPluginStatus.value = "error";
    throw new Error("Interstitial not loaded");
  }

  // `haveInterstitial` is a flag to use the interstitial message
  // if we have an interstitial, then the user has to confirm
  // before proceeding
  if (interstitial.value.haveInterstitial) {
    isInterstitialOpen.value = true;
    return;
  }

  // if no interstitial, then we can just add the file
  isConfirmedToAdd.value = true;
}

function handleCloseInterstitial() {
  isInterstitialOpen.value = false;
  addingToPluginStatus.value = "idle";
}

function handleInterstitialConfirm() {
  isInterstitialOpen.value = false;
  isConfirmedToAdd.value = true;
}

function onConfirmedToAdd() {
  console.log("doing things here with", props.fileHandlerId);

  addingToPluginStatus.value = "success";
}

watch(isConfirmedToAdd, onConfirmedToAdd);
</script>
<style scoped></style>
