/**
 * WidgetEditor component tests.
 *
 * The key scenario tested here is a rendering bug (now fixed):
 *
 *   WidgetEditor previously captured its widget reference at setup time:
 *     const widget = editor.form.widgetArray[props.index]  // stale
 *
 *   When the parent deleted a widget and Vue re-used the same component
 *   instance (same v-for key), the stale reference kept showing the removed
 *   widget's data. Fixed by making `widget` a computed ref.
 *
 *   Symptoms: deleting widget 1 from [A, B, C, D] showed [A, B, C] instead
 *   of [B, C, D]. The last widget appeared to vanish because DragDropList
 *   keys on array indices — Vue removed key=3 and updated keys 0-2 in place.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { ref, nextTick } from "vue";
import type { AdminWidgetPayload } from "@/types";

// Mock query hooks so useTemplateEditor and WidgetEditor can be imported
// without a real API or VueQuery setup.
vi.mock("@/queries/useTemplateQuery", () => ({
  useAdminTemplateQuery: () => ({
    data: ref(undefined),
    isLoading: ref(false),
    isError: ref(false),
  }),
  useFieldTypesQuery: () => ({
    data: ref([]),
  }),
  useCreateTemplateMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
    status: ref("idle"),
  }),
  useUpdateTemplateMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
    status: ref("idle"),
  }),
}));

import WidgetEditor from "./WidgetEditor.vue";
import {
  useTemplateEditor,
  TEMPLATE_EDITOR_KEY,
} from "../../useTemplateEditor/useTemplateEditor";
import { WIDGET_OPTIONS_KEY } from "../widgetOptionsKey";

describe("WidgetEditor", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  function mountWidgetEditor(editor: ReturnType<typeof useTemplateEditor>, index: number) {
    return shallowMount(WidgetEditor, {
      props: { index },
      global: {
        provide: {
          [TEMPLATE_EDITOR_KEY as symbol]: editor,
          [WIDGET_OPTIONS_KEY as symbol]: ref({ open: false, trigger: 0 }),
        },
      },
    });
  }

  function labelOf(wrapper: ReturnType<typeof shallowMount>): string {
    // WidgetEditor binds `v-model="widget.label"` on InputGroup.
    // With shallowMount the stub receives it as the `modelValue` prop.
    return wrapper.findComponent({ name: "InputGroup" }).props("modelValue") as string;
  }

  it("displays the label of the widget at the given index", () => {
    const editor = useTemplateEditor(() => null);
    editor.addWidget();
    (editor.form.widgetArray[0] as AdminWidgetPayload).label = "Alpha";

    const wrapper = mountWidgetEditor(editor, 0);

    expect(labelOf(wrapper)).toBe("Alpha");
  });

  it("clicking Remove field opens the confirm modal", async () => {
    const editor = useTemplateEditor(() => null);
    editor.addWidget();

    const wrapper = mountWidgetEditor(editor, 0);
    const modal = () => wrapper.findComponent({ name: "ConfirmModal" });

    expect(modal().props("isOpen")).toBe(false);

    await wrapper.find('[aria-label="Remove field"]').trigger("click");

    expect(modal().props("isOpen")).toBe(true);
  });

  it("emits remove when the confirm modal is confirmed", async () => {
    const editor = useTemplateEditor(() => null);
    editor.addWidget();

    const wrapper = mountWidgetEditor(editor, 0);
    await wrapper.find('[aria-label="Remove field"]').trigger("click");
    await wrapper.findComponent({ name: "ConfirmModal" }).trigger("confirm");

    expect(wrapper.emitted("remove")).toHaveLength(1);
  });

  it("does not emit remove when the confirm modal is closed", async () => {
    const editor = useTemplateEditor(() => null);
    editor.addWidget();

    const wrapper = mountWidgetEditor(editor, 0);
    await wrapper.find('[aria-label="Remove field"]').trigger("click");
    await wrapper.findComponent({ name: "ConfirmModal" }).trigger("close");

    expect(wrapper.emitted("remove")).toBeFalsy();
  });

  it("reflects the widget now at index 0 after the original first widget is removed", async () => {
    const editor = useTemplateEditor(() => null);
    editor.addWidget();
    editor.addWidget();
    (editor.form.widgetArray[0] as AdminWidgetPayload).label = "Alpha";
    (editor.form.widgetArray[1] as AdminWidgetPayload).label = "Beta";

    const wrapper = mountWidgetEditor(editor, 0);
    expect(labelOf(wrapper)).toBe("Alpha");

    // Remove widget at index 0. "Beta" is now at index 0.
    editor.removeWidget(0);
    await nextTick();

    // The component at index 0 must show "Beta", not the stale "Alpha".
    expect(labelOf(wrapper)).toBe("Beta");
  });
});
