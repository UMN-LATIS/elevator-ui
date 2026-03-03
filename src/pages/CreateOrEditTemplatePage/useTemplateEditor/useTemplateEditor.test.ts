import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, nextTick } from "vue";
import type { AdminTemplate } from "@/types";
import { FIELD_TYPE_IDS } from "@/constants/constants";

// These refs are shared with the mock factory below.
// Variables starting with "mock" are accessible in hoisted vi.mock factories.
const mockTemplateData = ref<AdminTemplate | undefined>(undefined);
const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();

vi.mock("@/queries/useTemplateQuery", () => ({
  useAdminTemplateQuery: () => ({
    data: mockTemplateData,
    isLoading: ref(false),
    isError: ref(false),
  }),
  useCreateTemplateMutation: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: ref(false),
  }),
  useUpdateTemplateMutation: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: ref(false),
  }),
}));

// Import after mock registration so the mock is in place.
import { newWidget, useTemplateEditor } from "./useTemplateEditor";

const makeAdminTemplate = (overrides: Partial<AdminTemplate> = {}): AdminTemplate => ({
  id: 5,
  name: "Test Template",
  showCollection: false,
  showCollectionPosition: 0,
  showTemplate: false,
  showTemplatePosition: 0,
  includeInSearch: true,
  indexForSearching: true,
  isHidden: false,
  templateColor: 0,
  recursiveIndexDepth: 1,
  widgetArray: [],
  ...overrides,
});

describe("newWidget", () => {
  it("sets fieldTypeId to text (1) by default", () => {
    expect(newWidget(1).fieldTypeId).toBe(FIELD_TYPE_IDS["text"]);
  });

  it("uses the provided order for templateOrder and viewOrder", () => {
    const w = newWidget(4);
    expect(w.templateOrder).toBe(4);
    expect(w.viewOrder).toBe(4);
  });

  it("enables display, searchable, and directSearch by default", () => {
    const w = newWidget(1);
    expect(w.display).toBe(true);
    expect(w.searchable).toBe(true);
    expect(w.directSearch).toBe(true);
  });

  it("leaves widgetId and fieldTitle undefined so the server assigns them", () => {
    const w = newWidget(1);
    expect(w.widgetId).toBeUndefined();
    expect(w.fieldTitle).toBeUndefined();
  });
});

describe("useTemplateEditor", () => {
  beforeEach(() => {
    mockTemplateData.value = undefined;
    mockCreateMutateAsync.mockReset();
    mockUpdateMutateAsync.mockReset();
  });

  it("initialises with an empty form in create mode", () => {
    const editor = useTemplateEditor(() => null);
    expect(editor.isEditMode.value).toBe(false);
    expect(editor.form.name).toBe("");
    expect(editor.form.widgetArray).toHaveLength(0);
    expect(editor.form.includeInSearch).toBe(true);
    expect(editor.form.recursiveIndexDepth).toBe(1);
  });

  it("isEditMode is true when a templateId is provided", () => {
    expect(useTemplateEditor(() => 42).isEditMode.value).toBe(true);
  });

  it("isEditMode is false when templateId is null", () => {
    expect(useTemplateEditor(() => null).isEditMode.value).toBe(false);
  });

  it("addWidget appends widgets with ascending templateOrder", () => {
    const editor = useTemplateEditor(() => null);
    editor.addWidget();
    editor.addWidget();
    editor.addWidget();
    expect(editor.form.widgetArray).toHaveLength(3);
    expect(editor.form.widgetArray[0].templateOrder).toBe(1);
    expect(editor.form.widgetArray[1].templateOrder).toBe(2);
    expect(editor.form.widgetArray[2].templateOrder).toBe(3);
  });

  it("removeWidget removes the widget at the given index and leaves others intact", () => {
    const editor = useTemplateEditor(() => null);
    editor.addWidget();
    editor.addWidget();
    editor.addWidget();
    editor.form.widgetArray[0].label = "A";
    editor.form.widgetArray[1].label = "B";
    editor.form.widgetArray[2].label = "C";

    editor.removeWidget(1);

    expect(editor.form.widgetArray).toHaveLength(2);
    expect(editor.form.widgetArray[0].label).toBe("A");
    expect(editor.form.widgetArray[1].label).toBe("C");
  });

  it("removeWidget at index 0 shifts remaining widgets to the front", () => {
    const editor = useTemplateEditor(() => null);
    editor.addWidget();
    editor.addWidget();
    editor.addWidget();
    editor.addWidget();
    editor.form.widgetArray[0].label = "A";
    editor.form.widgetArray[1].label = "B";
    editor.form.widgetArray[2].label = "C";
    editor.form.widgetArray[3].label = "D";

    editor.removeWidget(0);

    expect(editor.form.widgetArray).toHaveLength(3);
    expect(editor.form.widgetArray[0].label).toBe("B");
    expect(editor.form.widgetArray[1].label).toBe("C");
    expect(editor.form.widgetArray[2].label).toBe("D");
  });

  it("populates the form reactively when AdminTemplate data loads", async () => {
    const editor = useTemplateEditor(() => 5);
    expect(editor.form.name).toBe("");

    mockTemplateData.value = makeAdminTemplate({
      name: "My Template",
      showCollection: true,
      recursiveIndexDepth: 2,
      widgetArray: [
        {
          widgetId: 100,
          fieldTitle: "title_1",
          fieldType: "text",
          fieldTypeId: FIELD_TYPE_IDS["text"],
          label: "Title",
          tooltip: "",
          templateOrder: 1,
          viewOrder: 1,
          display: true,
          displayInPreview: true,
          required: true,
          searchable: true,
          allowMultiple: false,
          attemptAutocomplete: false,
          directSearch: true,
          clickToSearch: false,
          clickToSearchType: 0,
          fieldData: null,
        },
      ],
    });

    await nextTick();

    expect(editor.form.name).toBe("My Template");
    expect(editor.form.showCollection).toBe(true);
    expect(editor.form.recursiveIndexDepth).toBe(2);
    expect(editor.form.widgetArray).toHaveLength(1);
    expect(editor.form.widgetArray[0].fieldTitle).toBe("title_1");
    expect(editor.form.widgetArray[0].label).toBe("Title");
  });

  it("save calls createMutation in create mode and returns the new id", async () => {
    mockCreateMutateAsync.mockResolvedValue({ id: 42, name: "New Template" });
    const editor = useTemplateEditor(() => null);
    editor.form.name = "New Template";

    const id = await editor.save();

    expect(mockCreateMutateAsync).toHaveBeenCalledWith(editor.form);
    expect(id).toBe(42);
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });

  it("save calls updateMutation in edit mode and returns the template id", async () => {
    mockUpdateMutateAsync.mockResolvedValue({ id: 5, name: "Updated" });
    const editor = useTemplateEditor(() => 5);

    const id = await editor.save();

    expect(mockUpdateMutateAsync).toHaveBeenCalledWith({ templateId: 5, payload: editor.form });
    expect(id).toBe(5);
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });
});
