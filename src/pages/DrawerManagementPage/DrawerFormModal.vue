<template>
  <Modal
    :isOpen="isOpen"
    label="Create Drawer"
    class="max-w-md"
    @close="handleClose">
    <form @submit.prevent="handleSubmit">
      <InputGroup
        v-model="title"
        label="Drawer Title"
        placeholder="e.g. Spring Seminar Slides"
        :error="wasTouched ? error : null"
        required
        @blur="wasTouched = true" />

      <div class="mt-4 flex items-center justify-end gap-2">
        <Button variant="tertiary" type="button" @click="handleClose">
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          :disabled="!canSubmit || isPending">
          <LoaderCircleIcon v-if="isPending" class="size-4 animate-spin mr-2" />
          {{ isPending ? "Creating…" : "Create Drawer" }}
        </Button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { LoaderCircleIcon } from "lucide-vue-next";
import Modal from "@/components/Modal/Modal.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import Button from "@/components/Button/Button.vue";
import { useCreateManageableDrawerMutation } from "./drawerGroupQueries";
import type { ManageableDrawer } from "@/types";

const props = defineProps<{
  isOpen: boolean;
}>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "created", drawer: ManageableDrawer): void;
}>();

const createDrawer = useCreateManageableDrawerMutation();
const isPending = createDrawer.isPending;

const title = ref("");
const wasTouched = ref(false);

// start each open from a blank form
watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) return;
    title.value = "";
    wasTouched.value = false;
  },
  { immediate: true }
);

const error = computed((): string | null =>
  title.value.trim() === "" ? "Drawer title is required" : null
);

const canSubmit = computed((): boolean => error.value === null);

function handleClose() {
  emit("close");
}

function handleSubmit() {
  const trimmedTitle = title.value.trim();
  if (trimmedTitle === "") return;

  createDrawer.mutate(trimmedTitle, {
    // close only after the drawer list refetch lands, so the new drawer
    // is already among the rule form's options when it becomes the pick
    onSettled: (drawer) => {
      if (!drawer) return;
      emit("created", drawer);
      emit("close");
    },
  });
}
</script>
