import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DragHandle from "./DragHandle.vue";

describe("DragHandle", () => {
  // Neither Safari nor jsdom focuses a button on click, so focus landing on the
  // handle can only have come from the component's own handler.
  it("focuses itself when clicked", async () => {
    const wrapper = mount(DragHandle, { attachTo: document.body });
    const button = wrapper.get("button");

    expect(document.activeElement).not.toBe(button.element);

    await button.trigger("click");

    expect(document.activeElement).toBe(button.element);
  });
});
