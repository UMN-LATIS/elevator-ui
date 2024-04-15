<template>
  <IconButton
    class="add-to-drawer-button"
    title="Add to Drawer"
    v-bind="$attrs"
    @click="isModalOpen = true">
    <SpinnerIcon v-if="fetchStatus === 'fetching'" />
    <AddToDrawerIcon v-else />
    <span class="sr-only">Add to Drawer</span>
  </IconButton>
  <Modal
    type="info"
    label="Add to Drawer"
    :isOpen="isModalOpen"
    class="max-w-xl"
    @close="isModalOpen = false">
    <div>
      <fieldset class="flex items-start justify-between gap-2 flex-1">
        <legend class="sr-only">Choose a drawer</legend>
        <div class="flex-1 flex flex-col gap-1">
          <label class="text-xs uppercase font-medium">Existing Drawer</label>
          <select
            v-model="selectedDrawer"
            class="border border-neutral-200 rounded w-full text-sm"
            :class="{
              ' !border-red-500 text-red-700':
                !exactlyOneDrawerIsChosen && isSelectDrawerTouched,
            }"
            @update:modelValue="isSelectDrawerTouched = true">
            <option value="">-</option>
            <option
              v-for="drawer in drawerStore.drawers"
              :key="drawer.id"
              :value="drawer.id">
              {{ drawer.title }}
            </option>
          </select>
        </div>

        <p
          class="mt-8 before:absolute before:top-1/2 before:-translate-y-1/2 before:block before:h-[1px] before:w-full before:left-0 before:bg-transparent-black-100 relative leading-none text-center text-sm">
          <span class="bg-neutral-50 relative z-10 px-2">or</span>
        </p>

        <DrawerTitleInput
          v-model="newDrawerName"
          class="flex-1"
          label="New Drawer"
          :inputClass="[
            'bg-white placeholder-neutral-400 border !border-neutral-200 rounded',
            {
              '!border !border-red-500 !text-red-700':
                !exactlyOneDrawerIsChosen && isSelectDrawerTouched,
            },
          ]"
          @update:modelValue="isSelectDrawerTouched = true" />
      </fieldset>
      <p
        v-if="!exactlyOneDrawerIsChosen && isSelectDrawerTouched"
        class="text-xs italic text-red-500 my-2">
        Please select a drawer or enter a new drawer name.
      </p>
      <AddExcerptToDrawerSection
        v-if="assetStore.activeFileObjectId && isExcerptable"
        v-model:startTime="excerpt.startTime"
        v-model:endTime="excerpt.endTime"
        v-model:excerptName="excerpt.name"
        v-model:is-adding-excerpt="isAddingExcerpt"
        :fileObjectId="assetStore.activeFileObjectId"
        class="mt-4" />
    </div>
    <template #footer>
      <footer class="p-4 bg-neutral-200">
        <div class="flex justify-end gap-4">
          <Button variant="tertiary" @click="isModalOpen = false">
            Cancel
          </Button>
          <Button
            class="text-sm"
            :disabled="!isFormValid"
            variant="primary"
            @click="handleAddToDrawer">
            Add to Drawer
          </Button>
        </div>
      </footer>
    </template>
  </Modal>
</template>
<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from "vue";
import Button from "@/components/Button/Button.vue";
import Modal from "@/components/Modal/Modal.vue";
import { useDrawerStore } from "@/stores/drawerStore";
import DrawerTitleInput from "../DrawerTitleInput/DrawerTitleInput.vue";
import { FetchStatus, AssetExcerpt } from "@/types";
import { SpinnerIcon, AddToDrawerIcon } from "@/icons";
import IconButton from "@/components/IconButton/IconButton.vue";
import AddExcerptToDrawerSection from "./AddExcerptToDrawerSection.vue";
import { useAssetStore } from "@/stores/assetStore";
import api from "@/api";
import { useIframeMessaging, requestTypes } from "@/helpers/useiFrameMessaging";

const props = defineProps<{
  assetId: string;
}>();

const isModalOpen = ref(false);
const selectedDrawer = ref("");
const newDrawerName = ref("");
const fetchStatus = ref<FetchStatus>("idle");
const isAddingExcerpt = ref(false);
const isSelectDrawerTouched = ref(false);
const isExcerptable = ref(false);

const drawerStore = useDrawerStore();
const assetStore = useAssetStore();

const excerpt = reactive({
  fileHandlerId: assetStore.activeFileObjectId,
  name: "",
  startTime: 0,
  endTime: 0,
});

const isDrawerNameValid = computed(() => {
  return (
    newDrawerName.value.trim() &&
    // must be unique
    !drawerStore.drawers.some((drawer) => drawer.title === newDrawerName.value)
  );
});

const exactlyOneDrawerIsChosen = computed(() => {
  // new or selected drawer and not both
  return (
    (selectedDrawer.value || newDrawerName.value.trim()) &&
    !(selectedDrawer.value && newDrawerName.value.trim())
  );
});

const isExcerptValid = computed(() => {
  return (
    excerpt.startTime >= 0 &&
    excerpt.endTime >= 0 &&
    excerpt.name.trim() &&
    Math.abs(excerpt.endTime - excerpt.startTime) >= 1
  );
});

const isFormValid = computed(() => {
  return (
    exactlyOneDrawerIsChosen.value &&
    (!isAddingExcerpt.value || isExcerptValid.value)
  );
});

async function handleAddToDrawer() {
  const drawerIdInt: number = Number.parseInt(selectedDrawer.value);
  const newDrawerNameTrimmed = newDrawerName.value.trim();

  if (!props.assetId) {
    throw new Error("Cannot add to drawer. No active asset.");
  }

  if (!drawerIdInt && !newDrawerNameTrimmed) {
    throw new Error(`Cannot add to drawer. No new or selected drawer.`);
  }

  if (drawerIdInt && newDrawerNameTrimmed) {
    throw new Error(`Cannot add to existing and new drawer at the same time.`);
  }

  if (newDrawerNameTrimmed && !isDrawerNameValid.value) {
    throw new Error("Drawer name is invalid.");
  }

  if (drawerIdInt && isNaN(drawerIdInt)) {
    throw new Error("Cannot add to drawer. Drawer ID is not a number.");
  }

  if (isAddingExcerpt.value && !isExcerptValid.value) {
    throw new Error("Cannot add excerpt. Excerpt is invalid.");
  }

  if (isAddingExcerpt.value && !excerpt.fileHandlerId) {
    throw new Error("Cannot add excerpt. No file handler ID.");
  }

  isModalOpen.value = false;
  fetchStatus.value = "fetching";

  const drawerId = isNaN(drawerIdInt)
    ? (await drawerStore.createDrawer(newDrawerNameTrimmed)).id
    : drawerIdInt;

  // swap excerpt start and end time if start time is greater than end time
  if (excerpt.startTime > excerpt.endTime) {
    [excerpt.startTime, excerpt.endTime] = [excerpt.endTime, excerpt.startTime];
  }

  await drawerStore.addAssetToDrawer(
    props.assetId,
    drawerId,
    isAddingExcerpt.value ? (excerpt as AssetExcerpt) : null
  );

  reset();
}

function reset() {
  selectedDrawer.value = "";
  newDrawerName.value = "";
  fetchStatus.value = "idle";
  isAddingExcerpt.value = false;
  excerpt.name = "";
  excerpt.startTime = 0;
  excerpt.endTime = 0;
  excerpt.fileHandlerId = assetStore.activeFileObjectId;
  isSelectDrawerTouched.value = false;
}

const mainObjectViewerIframe = ref<HTMLIFrameElement | null>(null);
const { postMessage: postMessageToObjectViewer } = useIframeMessaging(
  mainObjectViewerIframe
);

onMounted(() => {
  // this gets the iframe element from the main object viewer so that
  // we can send post messages to it. It's a bit hacky, but and maybe better
  // with a provide/inject, but this works for now.
  mainObjectViewerIframe.value = document.querySelector(
    ".object-viewer__iframe"
  ) as HTMLIFrameElement;
});

// when the activeFileObjectId changes
// check if the file is a movie or audio file
watch(
  [() => assetStore.activeFileObjectId, isModalOpen],
  async () => {
    // prevent making requests from running when the modal is closed
    if (!isModalOpen.value) {
      return;
    }

    if (!assetStore.activeFileObjectId) {
      isExcerptable.value = false;
      return;
    }

    excerpt.fileHandlerId = assetStore.activeFileObjectId;

    const fileMetaData = await api.getFileMetaData(
      assetStore.activeFileObjectId
    );
    isExcerptable.value =
      !!fileMetaData?.handlerType &&
      ["MovieHandler", "AudioHandler"].includes(fileMetaData.handlerType);

    // pause the media player when the modal is opened
    if (isExcerptable.value) {
      postMessageToObjectViewer({
        type: requestTypes.PAUSE_PLAYER,
      });
    }
  },
  {
    immediate: true,
  }
);
</script>
<style scoped></style>
