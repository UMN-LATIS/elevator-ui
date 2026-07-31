import { describe, it, expect, afterEach } from "vitest";
import { mount, enableAutoUnmount } from "@vue/test-utils";
import DragHandle from "./DragHandle.vue";

// These tests attach to the real document, so a wrapper left mounted would
// keep its element (and its focus) in the DOM for whatever runs next.
enableAutoUnmount(afterEach);

describe("DragHandle", () => {
  // A synthetic click focuses nothing on its own, so focus landing on the
  // handle can only have come from the component's own handler.
  it("focuses itself when clicked", async () => {
    const wrapper = mount(DragHandle, { attachTo: document.body });
    const button = wrapper.get("button");

    expect(document.activeElement).not.toBe(button.element);

    await button.trigger("click");

    expect(document.activeElement).toBe(button.element);
  });
});
