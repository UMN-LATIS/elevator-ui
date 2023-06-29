<template>
  <div
    v-if="elevatorPlugin"
    class="object-viewer__button-bar flex justify-end items-center gap-2 p-2"
  >
    <Button
      class="block p-2 text-sm"
      variant="primary"
      @click="handleAddButtonClick"
    >
      <PlusIcon v-if="addingToPluginStatus === 'idle'" class="!w-4 !h-4" />
      <SpinnerIcon
        v-if="addingToPluginStatus === 'loading'"
        class="!w-4 !h-4"
      />
      <CircleCheckIcon
        v-if="addingToPluginStatus === 'success'"
        class="!w-4 !h-4"
      />
      <CircleXIcon v-if="addingToPluginStatus === 'error'" class="!w-4 !h-4" />
      Add to {{ elevatorPlugin }}
    </Button>
    <ConfirmModal
      :isOpen="isInterstitialOpen"
      :title="`Add to ${elevatorPlugin}`"
      @close="handleCloseInterstitial"
      @confirm="handleInterstitialConfirm"
    >
      <div
        v-if="interstitial?.interstitialText"
        v-html="interstitial?.interstitialText"
      />
      <p v-else>Are you sure you want to add this to {{ elevatorPlugin }}?</p>
    </ConfirmModal>
    <form
      v-if="elevatorCallbackType == 'lti'"
      ref="returnForm"
      :action="returnUrl ?? ''"
      method="POST"
    >
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
import api from "@/api";
import ConfirmModal from "../ConfirmModal/ConfirmModal.vue";
import { ApiInterstitialResponse } from "@/types";
import PlusIcon from "@/icons/PlusIcon.vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import CircleCheckIcon from "@/icons/CircleCheckIcon.vue";
import CircleXIcon from "@/icons/CircleXIcon.vue";
import { useElevatorSessionStorage } from "@/helpers/useElevatorSessionStorage";
import { useAssetStore } from "@/stores/assetStore";

const props = defineProps<{
  fileHandlerId: string | null;
}>();

const assetStore = useAssetStore();
const {
  elevatorPlugin,
  elevatorCallbackType,
  returnUrl,
  clear: clearElevatorSessionStorage,
} = useElevatorSessionStorage();

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

// clear the session storage
// before closing this window/iframe to avoid
// the "Add to" button from showing up
// NOTE: this does not handle the case when the user cancels the LTI embed
// in canvas. Maybe there's a better way to handle this?
window.addEventListener("beforeunload", () => clearElevatorSessionStorage());

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

    nextTick(() => {
      if (!returnForm.value) {
        addingToPluginStatus.value = "error";
        throw new Error("Return form not set");
      }

      returnForm.value.submit();
      addingToPluginStatus.value = "success";
    });
  }

  if (elevatorCallbackType.value === "JS") {
    // WordPress integration works by opening a new window with Elevator
    // and then passing a message back to the original WordPress window
    // by using `window.opener.postMessage`
    window.opener.postMessage(
      {
        pluginResponse: true,
        fileObjectId: assetStore.activeFileObjectId,
        objectId: assetStore.activeObjectId,
        currentLink: window.location.href,
      },
      "*"
    );
    addingToPluginStatus.value = "success";
    window.close();
  }
}

watch(isConfirmedToAdd, onConfirmedToAdd);
</script>
<style scoped></style>
