// errorStore.ts

import { defineStore } from "pinia";
import { ApiError } from "@/api/ApiError"; // Import your custom error class

export const useErrorStore = defineStore("errorStore", {
  state: () => ({
    error: null as ApiError | Error | null, // Now error is of type ApiError or null
  }),
  actions: {
    setError(error: ApiError | Error) {
      this.error = error;
    },
    clearError() {
      this.error = null;
    },
  },
});
