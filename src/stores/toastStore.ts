// errorStore.ts

import { defineStore } from "pinia";
import { Toast } from "@/types";

export const useToastStore = defineStore("toastStore", {
  state: () => ({
    toasts: [] as Toast[],
  }),
  actions: {
    addToast(toast: Omit<Toast, "id">) {
      const id = crypto.randomUUID();
      this.toasts.push({
        ...toast,
        id,
        duration: toast.duration ?? 5000,
      });
    },

    dismissToast(id: string) {
      const index = this.toasts.findIndex((toast) => toast.id === id);
      if (index === -1) return;

      this.toasts.splice(index, 1);
    },
  },
});
