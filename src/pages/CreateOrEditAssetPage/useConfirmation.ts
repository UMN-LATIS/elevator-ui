import { ref } from "vue";

// useful for confirm dialogs and route nav guards
// usage:
// const { showModal, confirm, handleConfirm, handleCancel } = useConfirmation();
// in template:
// <ConfirmationModal v-if="showModal" @confirm="handleConfirm" @cancel="handleCancel" />
// in script:
// const { confirm } = useConfirmation();
// await confirm("Are you sure you want to leave?");
// this will show the modal and return a promise that resolves to true or false based on user action
export function useConfirmation() {
  const showModal = ref(false);
  let resolvePromise: ((value: boolean) => void) | null = null;

  const confirm = (): Promise<boolean> => {
    return new Promise((resolve) => {
      resolvePromise = resolve;
      showModal.value = true;
    });
  };

  const onConfirm = () => {
    console.log("Confirmed");
    showModal.value = false;
    resolvePromise?.(true);
  };

  const onCancel = () => {
    console.log("Cancelled");
    showModal.value = false;
    resolvePromise?.(false);
  };

  return { showModal, confirm, onConfirm, onCancel };
}
