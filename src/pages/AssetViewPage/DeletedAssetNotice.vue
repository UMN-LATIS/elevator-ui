<template>
  <div class="flex items-center justify-center h-full p-8">
    <Notification type="warning" title="Asset Deleted" class="rounded-md">
      <p v-if="deletedAt">This asset was deleted on {{ formattedDate }}.</p>
      <p v-else>This asset has been deleted.</p>

      <div v-if="canRestore" class="mt-4">
        <Button
          variant="tertiary"
          class="border border-primary py-2 px-4"
          :disabled="isRestoring"
          @click="handleRestore">
          {{ isRestoring ? "Restoring…" : "Restore" }}
        </Button>
      </div>
    </Notification>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Notification from "@/components/Notification/Notification.vue";
import Button from "@/components/Button/Button.vue";
import { useRestoreAssetMutation } from "@/queries/useRestoreAssetMutation";
import { useInstanceStore } from "@/stores/instanceStore";

const props = defineProps<{
  assetId: string;
  deletedAt: string | null;
}>();

const emit = defineEmits<{
  (e: "restored"): void;
}>();

const instanceStore = useInstanceStore();
const canRestore = computed(
  () => instanceStore.currentUser?.canManageAssets ?? false
);

const formattedDate = computed(() => {
  if (!props.deletedAt) return "";
  const date = new Date(props.deletedAt);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

const restoreMutation = useRestoreAssetMutation();
const isRestoring = computed(() => restoreMutation.isPending.value);

function handleRestore() {
  restoreMutation.mutate(props.assetId, {
    onSuccess: () => emit("restored"),
  });
}
</script>
