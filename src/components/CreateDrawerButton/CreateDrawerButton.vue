<template>
  <Button @click="isCreateDrawerModalOpen = true">Create Drawer</Button>
  <Modal
    :isOpen="isCreateDrawerModalOpen"
    label="Create Drawer"
    class="max-w-lg mx-auto m-4"
    @close="isCreateDrawerModalOpen = false"
  >
    <form class="flex flex-col gap-6" @submit.prevent="handleCreateDrawer">
      <InputGroup
        id="new-drawer-title"
        v-model="newDrawerTitle"
        label="Title"
      />
      <Button type="submit" variant="primary" :disabled="!newDrawerTitle">
        Create
      </Button>
    </form>
  </Modal>
</template>
<script setup lang="ts">
import { ref } from "vue";
import Button from "@/components/Button/Button.vue";
import Modal from "@/components/Modal/Modal.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import { useDrawerStore } from "@/stores/drawerStore";

const isCreateDrawerModalOpen = ref(false);
const newDrawerTitle = ref("");
const drawerStore = useDrawerStore();

function handleCreateDrawer() {
  drawerStore.createDrawer(newDrawerTitle.value);
  isCreateDrawerModalOpen.value = false;
  newDrawerTitle.value = "";
}
</script>
<style scoped></style>
