<template>
  <IconButton title="Add to Drawer" v-bind="$attrs" @click="isModalOpen = true">
    <SpinnerIcon v-if="fetchStatus === 'fetching'" />
    <AddToDrawerIcon v-else />
    <span class="sr-only">Add to Drawer</span>
  </IconButton>
  <Modal
    type="info"
    label="Add to Drawer"
    :isOpen="isModalOpen"
    class="max-w-xl"
    @close="isModalOpen = false"
  >
    <div class="flex-1 max-h-full overflow-auto">
      <div class="flex items-end justify-between gap-2 flex-1">
        <div class="flex-1 flex flex-col gap-1">
          <label class="text-xs uppercase font-medium">Existing Drawer</label>
          <select
            v-model="selectedDrawer"
            class="border border-neutral-200 rounded w-full text-sm"
            :class="{
              'text-neutral-400': !selectedDrawer,
            }"
          >
            <option disabled value="">-- Select a Drawer --</option>
            <option
              v-for="drawer in drawerStore.drawers"
              :key="drawer.id"
              :value="drawer.id"
            >
              {{ drawer.title }}
            </option>
          </select>
        </div>

        <p
          class="my-4 before:absolute before:top-1/2 before:-translate-y-1/2 before:block before:h-[1px] before:w-full before:left-0 before:bg-transparent-black-100 relative leading-none text-center text-sm"
        >
          <span class="bg-neutral-50 relative z-10 px-2">or</span>
        </p>

        <DrawerTitleInput
          v-model="newDrawerName"
          class="flex-1"
          label="New Drawer"
          inputClass="bg-white placeholder-neutral-400 border !border-neutral-200 rounded"
        />
      </div>

      <AddExcerptToDrawerSection
        v-if="assetStore.activeFileObjectId && isExcerptable"
        v-model:startTime="excerpt.startTime"
        v-model:endTime="excerpt.endTime"
        v-model:excerptName="excerpt.name"
        v-model:is-adding-excerpt="isAddingExcerpt"
        :fileObjectId="assetStore.activeFileObjectId"
        class="mt-4"
      />

      <div>
        <p v-if="!onlyOneDrawerNameFieldIsFilled" class="text-red-600 text-sm">
          Select a drawer or enter a new drawer name.
        </p>
        <p v-if="isAddingExcerpt && !isExcerptValid">
          Please enter a valid excerpt name, start time, and end time.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-4 p-4 bg-neutral-100">
        <Button variant="tertiary" @click="isModalOpen = false">Cancel</Button>
        <Button
          class="text-sm"
          :disabled="!isFormValid"
          variant="primary"
          @click="handleAddToDrawer"
        >
          Add to Drawer
        </Button>
      </div>
    </template>
  </Modal>
</template>
<script setup lang="ts">
import { ref, computed, reactive, watch } from "vue";
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

const props = defineProps<{
  assetId: string;
}>();

const isModalOpen = ref(false);
const selectedDrawer = ref("");
const newDrawerName = ref("");
const fetchStatus = ref<FetchStatus>("idle");
const isAddingExcerpt = ref(false);

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

const onlyOneDrawerNameFieldIsFilled = computed(() => {
  return !(selectedDrawer.value && newDrawerName.value.trim());
});

const isExcerptValid = computed(() => {
  return excerpt.startTime >= 0 && excerpt.endTime >= 0 && excerpt.name.trim();
});

const isFormValid = computed(() => {
  return (
    onlyOneDrawerNameFieldIsFilled.value &&
    (!isAddingExcerpt.value || isExcerptValid)
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

  const drawerId =
    drawerIdInt ?? (await drawerStore.createDrawer(newDrawerNameTrimmed)).id;

  // swap excerpt start and end time if start time is greater than end time
  const sortedTimes = [excerpt.startTime, excerpt.endTime].sort();
  [excerpt.startTime, excerpt.endTime] = sortedTimes;

  console.log("adding excerpt", excerpt);

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
}

const isExcerptable = ref(false);

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
    console.log(
      "isExcerptable",
      isExcerptable.value,
      fileMetaData?.handlerType
    );
  },
  {
    immediate: true,
  }
);

watch(excerpt, () => {
  console.log("excerpt", excerpt);
});
</script>
<style scoped></style>
