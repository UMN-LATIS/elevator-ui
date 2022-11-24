<template>
  <div
    class="object-viewer__button-bar flex justify-end items-center gap-2 p-2"
  >
    <Button
      v-if="elevatorPlugin"
      class="block text-xs p-2 uppercase font-bold"
      variant="primary"
      @click="handleAddButtonClick"
    >
      <AddIcon v-if="addingToPluginStatus === 'idle'" />
      <SpinnerIcon v-if="addingToPluginStatus === 'loading'" />
      <CircleCheckIcon v-if="addingToPluginStatus === 'success'" />
      <CircleXIcon v-if="addingToPluginStatus === 'error'" />
      Add to {{ elevatorPlugin }}
    </Button>
    <ConfirmModal
      :isOpen="isInterstitialOpen"
      :label="`Add to ${elevatorPlugin}`"
      @close="handleCloseInterstitial"
      @confirm="handleInterstitialConfirm"
    >
      {{ interstitial?.interstitialText }}
    </ConfirmModal>
    <form ref="returnForm" :action="returnUrl ?? ''" method="POST">
      <input type="hidden" name="lti_version" value="LTI-1p0" />
      <input
        type="hidden"
        name="lti_message_type"
        value="ContentItemSelection"
      />
      <input type="hidden" name="content_items" :value="ltiContentItems" />
    </form>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from "vue";
import Button from "@/components/Button/Button.vue";
import api from "@/helpers/api";
import ConfirmModal from "../ConfirmModal/ConfirmModal.vue";
import { ApiInterstitialResponse } from "@/types";
import AddIcon from "@/icons/AddIcon.vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import CircleCheckIcon from "@/icons/CircleCheckIcon.vue";
import CircleXIcon from "@/icons/CircleXIcon.vue";
import { useElevatorSessionStorage } from "@/helpers/useElevatorSessionStorage";

const { elevatorPlugin, elevatorCallbackType, returnUrl } =
  useElevatorSessionStorage();

const props = defineProps<{
  fileHandlerId: string | null;
}>();

const returnForm = ref<HTMLFormElement | null>(null);
const isInterstitialOpen = ref(false);
const interstitial = ref<ApiInterstitialResponse | null>(null);
const isConfirmedToAdd = ref(false);
const addingToPluginStatus = ref<"idle" | "loading" | "success" | "error">(
  "idle"
);
const ltiContentItems = ref<string>("");

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

async function onConfirmedToAdd() {
  if (!props.fileHandlerId) {
    addingToPluginStatus.value = "error";
    throw new Error("File handler ID not set");
  }

  if (elevatorCallbackType.value === "lti") {
    const data = await api.postLtiPayload({
      fileObjectId: props.fileHandlerId,
      excerptId: "",
      returnUrl: returnUrl.value ?? "",
    });

    ltiContentItems.value = JSON.stringify(data);
    addingToPluginStatus.value = "success";
  }

  if (elevatorCallbackType.value === "JS") {
    console.log("doing things with wordpress");
    addingToPluginStatus.value = "success";
  }

  nextTick(() => {
    if (!returnForm.value) {
      addingToPluginStatus.value = "error";
      throw new Error("Return form not set");
    }

    returnForm.value.submit();
  });
}

watch(isConfirmedToAdd, onConfirmedToAdd);
</script>
<style scoped></style>
