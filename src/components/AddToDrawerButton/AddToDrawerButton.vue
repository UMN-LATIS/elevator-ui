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
        :fileObjectId="assetStore.activeFileObjectId"
        class="mt-4"
      />

      <div>
        <p v-if="areBothDrawerFieldsFilled" class="text-red-600 text-sm">
          Please select an existing drawer or create a new one (not both).
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
import { FetchStatus } from "@/types";
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
const excerpt = reactive({
  startTime: null as number | null,
  endTime: null as number | null,
});

const drawerStore = useDrawerStore();
const assetStore = useAssetStore();

const isDrawerNameValid = computed(() => {
  return (
    newDrawerName.value.trim() &&
    // must be unique
    !drawerStore.drawers.some((drawer) => drawer.title === newDrawerName.value)
  );
});

const areBothDrawerFieldsFilled = computed(() => {
  return selectedDrawer.value && newDrawerName.value.trim();
});

const isFormValid = computed(() => {
  return (
    (selectedDrawer.value && !newDrawerName.value.trim()) ||
    (!selectedDrawer.value &&
      newDrawerName.value.trim() &&
      isDrawerNameValid.value)
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

  isModalOpen.value = false;
  fetchStatus.value = "fetching";

  if (newDrawerNameTrimmed) {
    const newDrawer = await drawerStore.createDrawer(newDrawerNameTrimmed);
    await drawerStore.addAssetToDrawer(props.assetId, newDrawer.id);
  } else {
    await drawerStore.addAssetToDrawer(props.assetId, drawerIdInt);
  }

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
</script>
<style scoped></style>
