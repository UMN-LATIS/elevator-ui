import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useToastStore } from "@/stores/toastStore";
import ToastRoot from "./ToastRoot.vue";

describe("ToastRoot", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("the screen reader live region", () => {
    it("holds the toast messages", () => {
      const toastStore = useToastStore();
      toastStore.error("first failure");
      toastStore.error("second failure");

      const wrapper = mount(ToastRoot);
      const liveRegion = wrapper.get("[aria-live]");

      expect(liveRegion.findAll(".toast-root__toast")).toHaveLength(2);
      expect(liveRegion.text()).toContain("first failure");
      expect(liveRegion.text()).toContain("second failure");
    });

    it("excludes Clear All, which appears and disappears with the toast count", () => {
      const toastStore = useToastStore();
      toastStore.error("first failure");
      toastStore.error("second failure");

      const wrapper = mount(ToastRoot);

      expect(wrapper.text()).toContain("Clear All");
      expect(wrapper.get("[aria-live]").text()).not.toContain("Clear All");
    });
  });
});
