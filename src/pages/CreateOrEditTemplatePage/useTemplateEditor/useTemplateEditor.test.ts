import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, nextTick } from "vue";
import type { AdminTemplate } from "@/types";

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
  useFieldTypesQuery: () => ({
    data: ref([
      {
        id: 1,
        name: "text",
        modelName: "TextField",
        hasFieldData: false,
        sampleFieldData: null,
      },
    ]),
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
import {
  newWidget,
  useTemplateEditor,
  isFieldDataTextInvalid,
  formatFieldDataText,
} from "./useTemplateEditor";

const makeAdminTemplate = (
  overrides: Partial<AdminTemplate> = {}
): AdminTemplate => ({
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

describe("isFieldDataTextInvalid", () => {
  it("treats blank text as valid (no config)", () => {
    expect(isFieldDataTextInvalid("")).toBe(false);
    expect(isFieldDataTextInvalid("   \n  ")).toBe(false);
  });

  it("treats parseable JSON as valid", () => {
    expect(isFieldDataTextInvalid('{ "multiSelect": false }')).toBe(false);
    expect(isFieldDataTextInvalid("[]")).toBe(false);
    expect(isFieldDataTextInvalid("null")).toBe(false);
  });

  it("flags text that fails to parse", () => {
    expect(isFieldDataTextInvalid("{ oops }")).toBe(true);
    expect(isFieldDataTextInvalid('{ "a": 1 } alt: { "b": 2 }')).toBe(true);
  });
});

describe("formatFieldDataText", () => {
  it("pretty-prints valid JSON with a 2-space indent", () => {
    expect(formatFieldDataText('{"a":1,"b":[2,3]}')).toBe(
      '{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}'
    );
  });

  it("returns invalid text verbatim so a deliberate non-JSON sample survives", () => {
    const sample = '{ "a": 1 }\n\nalt:\n\n{ "b": 2 }';
    expect(formatFieldDataText(sample)).toBe(sample);
  });

  it("leaves blank text untouched", () => {
    expect(formatFieldDataText("")).toBe("");
    expect(formatFieldDataText("   ")).toBe("   ");
  });
});

describe("newWidget", () => {
  it("uses the provided textTypeId as fieldTypeId", () => {
    expect(newWidget(1, 42).fieldTypeId).toBe(42);
  });

  it("uses the provided order for templateOrder and viewOrder", () => {
    const w = newWidget(4, 1);
    expect(w.templateOrder).toBe(4);
    expect(w.viewOrder).toBe(4);
  });

  it("disables display, searchable, and directSearch by default", () => {
    const w = newWidget(1, 1);
    expect(w.display).toBe(false);
    expect(w.searchable).toBe(false);
    expect(w.directSearch).toBe(false);
  });

  it("leaves widgetId and fieldTitle undefined so the server assigns them", () => {
    const w = newWidget(1, 1);
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

  it("addWidget after removing a middle widget assigns a unique templateOrder", () => {
    const editor = useTemplateEditor(() => null);
    editor.addWidget();
    editor.addWidget();
    editor.addWidget(); // orders: [1, 2, 3]
    editor.removeWidget(1); // remove order 2; remaining: [1, 3]
    editor.addWidget(); // must get order 4, not 3 (which is already taken)

    const orders = editor.form.widgetArray.map((w) => w.templateOrder);
    const uniqueOrders = new Set(orders);
    expect(uniqueOrders.size).toBe(orders.length);
    expect(Math.max(...orders)).toBe(4);
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
          fieldTypeId: 1,
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

  it("converts loaded widget fieldData objects to pretty JSON text", async () => {
    const editor = useTemplateEditor(() => 5);
    mockTemplateData.value = makeAdminTemplate({
      widgetArray: [
        {
          widgetId: 100,
          fieldTitle: "options_1",
          fieldType: "select",
          fieldTypeId: 4,
          label: "Options",
          tooltip: "",
          templateOrder: 1,
          viewOrder: 1,
          display: true,
          displayInPreview: false,
          required: false,
          searchable: false,
          allowMultiple: false,
          attemptAutocomplete: false,
          directSearch: false,
          clickToSearch: false,
          clickToSearchType: 0,
          fieldData: { multiSelect: false, selectGroup: ["a", "b"] },
        },
      ],
    });

    await nextTick();

    expect(editor.form.widgetArray[0].fieldData).toBe(
      JSON.stringify({ multiSelect: false, selectGroup: ["a", "b"] }, null, 2)
    );
  });

  it("converts loaded null fieldData to an empty string", async () => {
    const editor = useTemplateEditor(() => 5);
    mockTemplateData.value = makeAdminTemplate({
      widgetArray: [
        {
          widgetId: 100,
          fieldTitle: "title_1",
          fieldType: "text",
          fieldTypeId: 1,
          label: "Title",
          tooltip: "",
          templateOrder: 1,
          viewOrder: 1,
          display: true,
          displayInPreview: false,
          required: false,
          searchable: false,
          allowMultiple: false,
          attemptAutocomplete: false,
          directSearch: false,
          clickToSearch: false,
          clickToSearchType: 0,
          fieldData: null,
        },
      ],
    });

    await nextTick();

    expect(editor.form.widgetArray[0].fieldData).toBe("");
  });

  it("invalidFieldDataLabels names widgets whose field data text won't parse", () => {
    const editor = useTemplateEditor(() => null);
    editor.addWidget();
    editor.addWidget();
    editor.form.widgetArray[0].label = "Options";
    editor.form.widgetArray[0].fieldData = "{ not json";
    editor.form.widgetArray[1].fieldData = '{ "valid": true }';

    expect(editor.invalidFieldDataLabels.value).toEqual(["Options"]);
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

    expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
      templateId: 5,
      payload: editor.form,
    });
    expect(id).toBe(5);
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });
});
