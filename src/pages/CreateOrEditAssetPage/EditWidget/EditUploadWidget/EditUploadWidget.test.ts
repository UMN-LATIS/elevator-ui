import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { defineComponent, h, nextTick, reactive, type PropType } from "vue";
import * as T from "@/types";
import { ASSET_EDITOR_PROVIDE_KEY } from "@/constants/constants";
import EditUploadWidget from "./EditUploadWidget.vue";

/**
 * Props lag the state by a render, so an item the state gained in this
 * flush (a just-completed upload) is missing from `props.widgetContents`
 * until the next render. A write built from the props array in that window
 * replaces the state's array and silently drops the newer item.
 *
 * These tests guard the fix: every write this widget emits is built from the
 * state via `contentsInState()`, so an item the props have not caught up
 * to survives an item edit and a regenerate-all toggle.
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

function makeUploadItem(uuid: string): T.WithUuid<T.UploadWidgetContent> {
  return {
    uuid,
    fileId: `${uuid}-hash`,
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
      type: Array as PropType<T.WithUuid<T.UploadWidgetContent>[]>,
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
  propItems: T.WithUuid<T.UploadWidgetContent>[];
  stateItems: T.WithUuid<T.UploadWidgetContent>[];
}) {
  const assetEditorStub = reactive({
    localAsset: { [widgetDef.fieldTitle]: options.stateItems },
    updateWidgetContents: vi.fn(),
    savedAsset: null,
    saveAsset: vi.fn(),
  });

  return mount(EditUploadWidget, {
    props: {
      collectionId: 7,
      widgetDef,
      widgetContents: options.propItems,
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

  describe("when the state holds an item the widgetContents prop has not received yet", () => {
    const settledItem = makeUploadItem("item-a");
    const itemFromThisFlush = makeUploadItem("item-b");

    // exercises handleUpdateItem
    it("keeps the newer item when one item is edited", async () => {
      const wrapper = mountWidget({
        propItems: [settledItem],
        stateItems: [settledItem, itemFromThisFlush],
      });

      wrapper.findComponent(EditUploadWidgetItemStub).vm.$emit("update:item", {
        ...settledItem,
        fileDescription: "a caption typed during the upload",
      });
      await nextTick();

      const writes = wrapper.emitted("update:widgetContents");
      expect(writes).toBeTruthy();
      const lastWrite = writes?.at(-1);
      const itemsWritten =
        lastWrite?.[0] as T.WithUuid<T.UploadWidgetContent>[];

      expect(itemsWritten.map((item) => item.uuid)).toEqual([
        "item-a",
        "item-b",
      ]);
    });

    // exercises handleRegenerateAllDerivatives
    it("keeps the newer item when Regenerate All Derivatives is toggled", async () => {
      const wrapper = mountWidget({
        propItems: [settledItem],
        stateItems: [settledItem, itemFromThisFlush],
      });

      await wrapper.get("button").trigger("click");

      const writes = wrapper.emitted("update:widgetContents");
      expect(writes).toBeTruthy();
      const lastWrite = writes?.at(-1);
      const itemsWritten =
        lastWrite?.[0] as T.WithUuid<T.UploadWidgetContent>[];

      expect(itemsWritten.map((item) => item.uuid)).toEqual([
        "item-a",
        "item-b",
      ]);
    });
  });
});
