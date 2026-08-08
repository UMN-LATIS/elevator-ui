import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { defineComponent, h, nextTick, reactive, type PropType } from "vue";
import * as T from "@/types";
import { ASSET_EDITOR_PROVIDE_KEY } from "@/constants/constants";
import EditUploadWidget from "./EditUploadWidget.vue";

/**
 * EditUploadWidget writes to the editor two different ways, and only one of
 * them is safe.
 *
 * `handleCompleteUpload` and `handleDeleteContent` call
 * `assetEditor.updateWidgetContents` with rows read from `currentContents()`,
 * which reads the model. The docblock on `currentContents` says why: props
 * lag by a render, so anything derived from `props.widgetContents` can be
 * built on a stale array.
 *
 * `handleUpdateItem` and `handleRegenerateAllDerivatives` build their rows
 * from `props.widgetContents` anyway and emit them up the widget chain, which
 * lands in the same `updateWidgetContents` four hops later. In the render-lag
 * window the docblock describes, that emit carries an array missing whatever
 * the model gained, and the write replaces rather than merges, so the newer
 * row is dropped.
 *
 * These tests pin that drop. Both carry `it.fails`, so the suite is green
 * against the bug and a later commit that removes the marker has proved the
 * test failed before the fix rather than asserting it in a message.
 */

const widgetDef: T.UploadWidgetDef = {
  widgetId: 1,
  type: "upload",
  allowMultiple: true,
  attemptAutocomplete: false,
  fieldTitle: "media",
  label: "Media",
  tooltip: "",
  fieldData: {},
  display: true,
  displayInPreview: true,
  required: false,
  searchable: false,
  directSearch: false,
  clickToSearch: false,
  clickToSearchType: 0,
  viewOrder: 0,
  templateOrder: 0,
};

function makeUploadRow(id: string): T.WithId<T.UploadWidgetContent> {
  return {
    id,
    fileId: `${id}-hash`,
    fileDescription: "",
    fileType: "image/jpeg",
    searchData: "",
    loc: null,
    sidecars: {},
  };
}

/** Renders the slots EditUploadWidget fills, so the real children mount. */
const EditWidgetLayoutStub = defineComponent({
  props: {
    widgetContents: {
      type: Array as PropType<T.WithId<T.UploadWidgetContent>[]>,
      required: true,
    },
  },
  setup(props, { slots }) {
    return () =>
      h("div", [
        slots.moreWidgetActions?.(),
        ...props.widgetContents.map((item) => slots.fieldContents?.({ item })),
        slots.footer?.(),
      ]);
  },
});

const EditUploadWidgetItemStub = defineComponent({
  name: "EditUploadWidgetItem",
  props: { item: { type: Object, required: true } },
  emits: ["update:item", "toggle:details"],
  setup: () => () => h("div"),
});

/** The dropdown that holds Regenerate All Derivatives, opened. */
const PassThroughStub = defineComponent({
  setup:
    (_props, { slots }) =>
    () =>
      h("div", slots.default?.()),
});

function mountWidget(options: {
  propRows: T.WithId<T.UploadWidgetContent>[];
  modelRows: T.WithId<T.UploadWidgetContent>[];
}) {
  const assetEditorStub = reactive({
    localAsset: { [widgetDef.fieldTitle]: options.modelRows },
    updateWidgetContents: vi.fn(),
    savedAsset: null,
    saveAsset: vi.fn(),
  });

  return mount(EditUploadWidget, {
    props: {
      collectionId: 7,
      widgetDef,
      widgetContents: options.propRows,
      isOpen: true,
    },
    global: {
      provide: { [ASSET_EDITOR_PROVIDE_KEY as symbol]: assetEditorStub },
      stubs: {
        EditWidgetLayout: EditWidgetLayoutStub,
        EditUploadWidgetItem: EditUploadWidgetItemStub,
        DropDown: PassThroughStub,
        DropDownItem: PassThroughStub,
        FileUploader: true,
        VerticalDotsIcon: true,
        CircleFilledCheckIcon: true,
        Circle: true,
      },
    },
  });
}

describe("EditUploadWidget", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("when the model holds a row the widgetContents prop has not received yet", () => {
    const settledRow = makeUploadRow("row-a");
    const rowFromThisFlush = makeUploadRow("row-b");

    // handleUpdateItem builds from props.widgetContents
    it.fails("keeps the newer row when one item is edited", async () => {
      const wrapper = mountWidget({
        propRows: [settledRow],
        modelRows: [settledRow, rowFromThisFlush],
      });

      wrapper.findComponent(EditUploadWidgetItemStub).vm.$emit("update:item", {
        ...settledRow,
        fileDescription: "a caption typed during the upload",
      });
      await nextTick();

      const writes = wrapper.emitted("update:widgetContents");
      expect(writes).toBeTruthy();
      const rowsWritten = writes?.at(
        -1
      )?.[0] as T.WithId<T.UploadWidgetContent>[];

      expect(rowsWritten.map((row) => row.id)).toEqual(["row-a", "row-b"]);
    });

    // handleRegenerateAllDerivatives builds from props.widgetContents
    it.fails(
      "keeps the newer row when Regenerate All Derivatives is toggled",
      async () => {
        const wrapper = mountWidget({
          propRows: [settledRow],
          modelRows: [settledRow, rowFromThisFlush],
        });

        await wrapper.get("button").trigger("click");

        const writes = wrapper.emitted("update:widgetContents");
        expect(writes).toBeTruthy();
        const rowsWritten = writes?.at(
          -1
        )?.[0] as T.WithId<T.UploadWidgetContent>[];

        expect(rowsWritten.map((row) => row.id)).toEqual(["row-a", "row-b"]);
      }
    );
  });
});
