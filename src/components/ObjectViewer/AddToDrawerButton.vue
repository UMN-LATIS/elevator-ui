<template>
  <Button variant="tertiary" title="Add to Drawer" @click="isModalOpen = true">
    <PlusIcon class="!w-4 !h-4" />
    Drawer
  </Button>
  <Modal
    type="info"
    label="Add to Drawer"
    :isOpen="isModalOpen"
    class="max-w-lg"
    @close="isModalOpen = false"
  >
    <div>
      <form
        class="flex items-center justify-between gap-2"
        @submit.prevent="handleAddToDrawer"
      >
        <div class="flex-1 flex gap-4 items-center">
          <label class="sr-only">Add to Drawer</label>
          <select
            v-model="selectedDrawer"
            class="border border-neutral-200 rounded w-full text-sm"
          >
            <option disabled value="">-- Select a Drawer --</option>
            <option v-for="drawer in drawerStore.drawers" :key="drawer.id">
              {{ drawer.title }}
            </option>
          </select>
        </div>
        <Button class="text-sm" type="submit">Add to Drawer</Button>
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
          inputClass="bg-white"
          :labelHidden="true"
        />

        <Button type="submit" class="text-sm"> Create Drawer </Button>
      </form>
    </div>
  </Modal>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { PlusIcon } from "@/icons";
import Button from "@/components/Button/Button.vue";
import Modal from "@/components/Modal/Modal.vue";
import { useDrawerStore } from "@/stores/drawerStore";
import DrawerTitleInput from "../DrawerTitleInput/DrawerTitleInput.vue";

const isModalOpen = ref(false);
const selectedDrawer = ref("");
const newDrawerName = ref("");

const drawerStore = useDrawerStore();

function handleAddToDrawer() {
  console.log("Add to drawer", selectedDrawer.value);
}

function handleCreateNewDrawerThenAdd() {
  console.log("Create new drawer then add", newDrawerName.value);
}
</script>
<style scoped></style>
