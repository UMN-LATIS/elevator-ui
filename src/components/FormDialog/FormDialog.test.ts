import { afterEach, describe, expect, it } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import FormDialog from "./FormDialog.vue";

let wrapper: VueWrapper | null = null;

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
});

async function mountOpenDialog(isSubmitting: boolean): Promise<VueWrapper> {
  wrapper = mount(FormDialog, {
    props: { title: "Edit Group", open: true, isSubmitting },
    slots: { default: `<input aria-label="Group Name" />` },
    attachTo: document.body,
  });
  await flushPromises();
  return wrapper;
}

function cancelButton(): HTMLButtonElement {
  const button = [...document.querySelectorAll("button")].find(
    (candidate) => candidate.textContent?.trim() === "Cancel"
  );
  if (!button) throw new Error("no Cancel button");
  return button;
}

async function pressEscape(): Promise<void> {
  document.activeElement?.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
  );
  await flushPromises();
}

describe("FormDialog", () => {
  it("closes on Escape when idle", async () => {
    const dialog = await mountOpenDialog(false);

    await pressEscape();

    expect(dialog.emitted("update:open")).toEqual([[false]]);
  });

  it("closes on Cancel when idle", async () => {
    const dialog = await mountOpenDialog(false);

    cancelButton().click();
    await flushPromises();

    expect(dialog.emitted("update:open")).toEqual([[false]]);
  });

  it("stays open on Escape and disables Cancel while submitting", async () => {
    const dialog = await mountOpenDialog(true);

    await pressEscape();

    expect(cancelButton().disabled).toBe(true);
    expect(dialog.emitted("update:open")).toBeUndefined();
  });
});
