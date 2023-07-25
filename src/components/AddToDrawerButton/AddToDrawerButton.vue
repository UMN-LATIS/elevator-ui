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
    class="max-w-lg"
    @close="isModalOpen = false"
  >
    <div>
      <ObjectViewer
        :fileHandlerId="assetStore.activeFileObjectId"
        class="aspect-video mb-4"
      />
      <div class="excerpt-details flex gap-4 mb-8">
        <div class="flex gap-1">
          <!-- <input
            v-model="excerpt.useStartTime"
            type="checkbox"
            aria-label="Include Excerpt Start Time"
          /> -->
          <InputGroup
            id="excerpt__start-time"
            v-model="excerpt.startTime"
            label="Start Time"
            type="text"
          />
        </div>
        <div class="flex gap-1">
          <!-- <input
            v-model="excerpt.useEndTime"
            type="checkbox"
            aria-label="Include Excerpt Start Time"
          /> -->
          <InputGroup
            id="excerpt__end-time"
            v-model="excerpt.endTime"
            label="End Time"
            type="text"
          />
        </div>
      </div>

      <form
        class="flex items-center justify-between gap-2"
        @submit.prevent="handleAddToDrawer(selectedDrawer)"
      >
        <div class="flex-1 flex gap-4 items-center">
          <label class="sr-only">Add to Drawer</label>
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
        <Button class="text-sm" type="submit" :disabled="!selectedDrawer">
          Add to Drawer
        </Button>
      </form>

      <p
        class="my-4 before:absolute before:top-1/2 before:-translate-y-1/2 before:block before:h-[1px] before:w-full before:left-0 before:bg-transparent-black-100 relative leading-none text-center"
      >
        <span class="bg-neutral-50 relative z-10 px-2">or</span>
      </p>

      <form
        class="flex items-center justify-between gap-2"
        @submit.prevent="handleCreateNewDrawerThenAdd"
      >
        <DrawerTitleInput
          v-model="newDrawerName"
          class="flex-1 border border-neutral-200 rounded"
          inputClass="bg-white placeholder-neutral-400"
          :labelHidden="true"
        />

        <Button type="submit" class="text-sm" :disabled="!isDrawerNameValid">
          Create Drawer
        </Button>
      </form>
    </div>
  </Modal>
</template>
<script setup lang="ts">
import { ref, computed, reactive } from "vue";
import Button from "@/components/Button/Button.vue";
import Modal from "@/components/Modal/Modal.vue";
import { useDrawerStore } from "@/stores/drawerStore";
import DrawerTitleInput from "../DrawerTitleInput/DrawerTitleInput.vue";
import { FetchStatus } from "@/types";
import { SpinnerIcon, AddToDrawerIcon } from "@/icons";
import IconButton from "@/components/IconButton/IconButton.vue";
import ObjectViewer from "../ObjectViewer/ObjectViewer.vue";
import { useAssetStore } from "@/stores/assetStore";
import InputGroup from "../InputGroup/InputGroup.vue";

const props = defineProps<{
  assetId: string;
}>();

const isModalOpen = ref(false);
const selectedDrawer = ref("");
const newDrawerName = ref("");
const fetchStatus = ref<FetchStatus>("idle");
const excerpt = reactive({
  useStartTime: false,
  useEndTime: false,
  startTime: 0,
  endTime: -1,
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

async function handleAddToDrawer(drawerId: string | number) {
  const drawerIdInt: number =
    typeof drawerId === "string" ? Number.parseInt(drawerId) : drawerId;

  if (isNaN(drawerIdInt)) {
    throw new Error("Cannot add to drawer. Drawer ID is not a number.");
  }

  if (!props.assetId) {
    throw new Error("Cannot add to drawer. No active asset.");
  }

  isModalOpen.value = false;

  fetchStatus.value = "fetching";
  await drawerStore.addAssetToDrawer(props.assetId, drawerIdInt);
  fetchStatus.value = "idle";
  reset();
}

async function handleCreateNewDrawerThenAdd() {
  if (!isDrawerNameValid.value) {
    throw new Error(
      `Cannot create drawer. Drawer name '${newDrawerName.value}' is invalid'.`
    );
  }

  fetchStatus.value = "fetching";
  isModalOpen.value = false;

  const newDrawer = await drawerStore.createDrawer(newDrawerName.value);
  handleAddToDrawer(newDrawer.id);
}

function reset() {
  selectedDrawer.value = "";
  newDrawerName.value = "";
  fetchStatus.value = "idle";
}
</script>
<style scoped></style>
