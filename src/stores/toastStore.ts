// errorStore.ts

import { defineStore } from "pinia";
import { Toast } from "@/types";

export const useToastStore = defineStore("toastStore", {
  state: () => ({
    toasts: [
      {
        id: "1",
        message: "This is a toast",
        duration: 5000,
      },
      {
        id: "2",
        message: "This is another toast",
        duration: 5000,
      },
      {
        id: "3",
        message: "This is a third toast",
        duration: 5000,
      },
    ] as Toast[],
  }),
  actions: {
    addToast(message: string, duration = 5000) {
      const id = crypto.randomUUID();
      this.toasts.push({
        id,
        message,
        duration,
      });
    },

    dismissToast(id: string) {
      const index = this.toasts.findIndex((toast) => toast.id === id);
      if (index === -1) return;

      this.toasts.splice(index, 1);
    },
  },
});
