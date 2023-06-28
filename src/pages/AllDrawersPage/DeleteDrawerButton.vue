<template>
  <button
    v-if="instanceStore.currentUser?.canManageDrawers"
    class="px-2 py-4 inline-flex items-center justify-center text-transparent-black-400 hover:text-neutral-900"
    type="button"
    v-bind="$attrs"
    @click="isConfirmOpen = true"
  >
    <span class="sr-only">Delete drawer</span>
    <CircleXIcon class="!w-5 !h-5" />
  </button>
  <Dialog :isOpen="isConfirmOpen">
    <Notification
      title="Delete Drawer"
      type="danger"
      isDismissable
      @dismiss="isConfirmOpen = false"
    >
      <p>
        Are you sure you want to delete drawer
        <b>{{ drawer.title }}</b
        >? This action cannot be undone.
      </p>
      <div class="mt-4 flex justify-end gap-4">
        <Button variant="tertiary" class="!px-4" @click="isConfirmOpen = false">
          Cancel
        </Button>
        <Button variant="danger" class="!px-4" @click="handleDeleteDrawer">
          Delete
        </Button>
      </div>
    </Notification>
  </Dialog>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { useDrawerStore } from "@/stores/drawerStore";
import { useInstanceStore } from "@/stores/instanceStore";
import Dialog from "@/components/Dialog/Dialog.vue";
import { CircleXIcon } from "@/icons";
import Notification from "@/components/Notification/Notification.vue";
import Button from "@/components/Button/Button.vue";
import { Drawer } from "@/types";

const props = defineProps<{
  drawer: Drawer;
}>();

const instanceStore = useInstanceStore();
// const drawerStore = useDrawerStore();
const isConfirmOpen = ref(false);

function handleDeleteDrawer() {
  // drawerStore.deleteDrawer(props.drawerId);
}
</script>
<style scoped></style>
