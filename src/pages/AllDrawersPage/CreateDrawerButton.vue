<template>
  <Button
    class="all-drawers-page__create-drawer-button"
    variant="primary"
    @click="isCreateDrawerModalOpen = true">
    Create Drawer
  </Button>
  <Modal
    :isOpen="isCreateDrawerModalOpen"
    label="Create Drawer"
    class="max-w-lg mx-auto m-4"
    @close="handleClose">
    <form class="flex flex-col gap-6" @submit.prevent="handleCreateDrawer">
      <DrawerTitleInput v-model="newDrawerTitle" />
      <div class="flex justify-end gap-2 items-center">
        <Button variant="tertiary" @click="handleClose">Cancel</Button>
        <Button type="submit" variant="primary" :disabled="!isTitleValid">
          Create
        </Button>
      </div>
    </form>
  </Modal>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import Button from "@/components/Button/Button.vue";
import Modal from "@/components/Modal/Modal.vue";
import DrawerTitleInput from "@/components/DrawerTitleInput/DrawerTitleInput.vue";
import { useDrawerStore } from "@/stores/drawerStore";

const isCreateDrawerModalOpen = ref(false);
const newDrawerTitle = ref("");
const isTitleTouched = ref(false);
const drawerStore = useDrawerStore();

const trimmedTitle = computed(() => newDrawerTitle.value.trim());
const isTitleNonEmpty = computed(() => newDrawerTitle.value.length > 0);
const isTitleUnique = computed(() => {
  return !drawerStore.drawers.some(
    (drawer) => drawer.title.trim() === trimmedTitle.value
  );
});

const isTitleValid = computed(() => {
  return isTitleNonEmpty.value && isTitleUnique.value;
});

function handleCreateDrawer() {
  drawerStore.createDrawer(trimmedTitle.value);
  isCreateDrawerModalOpen.value = false;
  resetForm();
}

function resetForm() {
  newDrawerTitle.value = "";
  isTitleTouched.value = false;
}

function handleClose() {
  isCreateDrawerModalOpen.value = false;
  resetForm();
}
</script>
<style scoped></style>
