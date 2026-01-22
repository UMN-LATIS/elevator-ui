import { describe, it, expect, vi, afterEach, afterAll } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import ErrorBoundary from "./ErrorBoundary.vue";

// A component that throws an error during render
const ThrowingComponent = defineComponent({
  name: "ThrowingComponent",
  render() {
    throw new Error("Test error from child");
  },
});

// A simple component that renders normally
const SafeComponent = defineComponent({
  name: "SafeComponent",
  render() {
    return h("div", { class: "safe-content" }, "Safe content");
  },
});

describe("ErrorBoundary", () => {
  // Suppress console.error during tests since ErrorBoundary logs errors
  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  afterEach(() => {
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe("when no error occurs", () => {
    it("renders the default slot content", () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(SafeComponent),
        },
      });

      expect(wrapper.find(".safe-content").exists()).toBe(true);
      expect(wrapper.text()).toContain("Safe content");
    });

    it("does not render the fallback slot", () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(SafeComponent),
          fallback: () => h("div", { class: "fallback" }, "Error occurred"),
        },
      });

      expect(wrapper.find(".fallback").exists()).toBe(false);
    });
  });

  describe("when an error occurs in a child component", () => {
    it("catches the error and renders the default fallback notification", async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowingComponent),
        },
      });

      await flushPromises();
      await nextTick();

      expect(wrapper.text()).toContain("Test error from child");
    });

    it("uses the custom title prop in the fallback", async () => {
      const wrapper = mount(ErrorBoundary, {
        props: {
          title: "Widget Error",
        },
        slots: {
          default: () => h(ThrowingComponent),
        },
      });

      await flushPromises();
      await nextTick();

      expect(wrapper.text()).toContain("Widget Error");
    });

    it("emits an error event with the caught error", async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowingComponent),
        },
      });

      await flushPromises();

      const emitted = wrapper.emitted("error");
      expect(emitted).toBeTruthy();
      expect(emitted?.[0]?.[0]).toBeInstanceOf(Error);
      expect((emitted?.[0]?.[0] as Error).message).toBe("Test error from child");
    });

    it("logs the error to console", async () => {
      mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowingComponent),
        },
      });

      await flushPromises();

      expect(consoleSpy).toHaveBeenCalled();
    });

    it("renders a custom fallback slot when provided", async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowingComponent),
          fallback: ({ errors }: { errors: Error[] }) =>
            h("div", { class: "custom-fallback" }, [
              h("span", `Caught ${errors.length} error(s)`),
            ]),
        },
      });

      await flushPromises();
      await nextTick();

      expect(wrapper.find(".custom-fallback").exists()).toBe(true);
      expect(wrapper.text()).toContain("Caught 1 error(s)");
    });
  });

  describe("error state management", () => {
    it("tracks errors in the errors array", async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowingComponent),
        },
      });

      await flushPromises();

      expect(wrapper.vm.errors).toHaveLength(1);
      expect(wrapper.vm.errors[0].message).toBe("Test error from child");
    });

    it("exposes clearErrors function that empties the errors array", async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowingComponent),
        },
      });

      await flushPromises();

      expect(wrapper.vm.errors).toHaveLength(1);

      wrapper.vm.clearErrors();

      expect(wrapper.vm.errors).toHaveLength(0);
    });

    it("provides clearError function in fallback slot to remove specific errors", async () => {
      let clearErrorFn: ((index: number) => void) | undefined;

      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowingComponent),
          fallback: ({ clearError }: { clearError: (index: number) => void }) => {
            clearErrorFn = clearError;
            return h("div", "Fallback");
          },
        },
      });

      await flushPromises();
      await nextTick();

      expect(wrapper.vm.errors).toHaveLength(1);

      clearErrorFn?.(0);
      await nextTick();

      expect(wrapper.vm.errors).toHaveLength(0);
    });

    it("keeps hasErrored true even after clearing errors to prevent re-render loops", async () => {
      let hasErroredValue = false;

      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowingComponent),
          fallback: ({ hasErrored }: { hasErrored: boolean }) => {
            hasErroredValue = hasErrored;
            return h("div", "Fallback");
          },
        },
      });

      await flushPromises();
      await nextTick();

      // hasErrored should be true
      expect(hasErroredValue).toBe(true);

      // Clear errors
      wrapper.vm.clearErrors();
      await nextTick();

      // The fallback should still be showing (hasErrored stays true)
      // This prevents the default slot from re-rendering and causing infinite loops
      expect(wrapper.text()).toContain("Fallback");
    });
  });

  describe("dismissable notifications", () => {
    it("renders dismiss button when using default fallback", async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowingComponent),
        },
      });

      await flushPromises();
      await nextTick();

      // The Notification component should have a dismiss button
      expect(wrapper.find("button").exists()).toBe(true);
    });

    it("removes error from list when dismiss is clicked", async () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: () => h(ThrowingComponent),
        },
      });

      await flushPromises();
      await nextTick();

      expect(wrapper.vm.errors).toHaveLength(1);

      const dismissButton = wrapper.find("button");
      expect(dismissButton.exists()).toBe(true);

      await dismissButton.trigger("click");

      expect(wrapper.vm.errors).toHaveLength(0);
    });
  });
});
