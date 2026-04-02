import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import MovieHandlerSidecar from "./MovieHandlerSidecar.vue";
import type { UploadWidgetDef, WithId, UploadWidgetContent } from "@/types";

const defaultSidecars: WithId<UploadWidgetContent["sidecars"]> = {
  id: "test-id",
  captions: "",
  chapters: "",
  language: null,
};

const defaultWidgetDef: UploadWidgetDef = {
  type: "upload",
  fieldTitle: "Upload",
  label: "Upload",
  fieldData: {},
};

function mountSidecar(
  sidecars: Partial<WithId<UploadWidgetContent["sidecars"]>> = {},
) {
  return mount(MovieHandlerSidecar, {
    props: {
      sidecars: { ...defaultSidecars, ...sidecars },
      widgetDef: defaultWidgetDef,
      fileMetaData: null,
    },
  });
}

describe("MovieHandlerSidecar", () => {
  it("renders a language select", () => {
    const wrapper = mountSidecar();
    const labels = wrapper.findAll("label");
    const languageLabel = labels.find((l) => l.text().includes("Language"));
    expect(languageLabel).toBeDefined();
  });

  it("shows the placeholder when no language is set", () => {
    const wrapper = mountSidecar({ language: null });
    const select = wrapper.find("select");
    const selected = select.find("option[selected]");
    expect(selected.text()).toBe("Auto-detect language");
  });

  it("selects the correct language when set", () => {
    const wrapper = mountSidecar({ language: "es" });
    const select = wrapper.find("select");
    expect((select.element as HTMLSelectElement).value).toBe("es");
  });

  it("emits update:sidecars with language when changed", async () => {
    const wrapper = mountSidecar();
    const select = wrapper.find("select");
    await select.setValue("fr");

    const emitted = wrapper.emitted("update:sidecars");
    expect(emitted).toBeTruthy();
    expect(emitted![0][0]).toMatchObject({ language: "fr" });
  });

  it("includes English as the first language option", () => {
    const wrapper = mountSidecar();
    const options = wrapper.findAll("select option");
    // First option is the placeholder, second should be English
    expect(options[1].text()).toBe("English");
    expect(options[1].attributes("value")).toBe("en");
  });

  it("preserves existing sidecar values when emitting language change", async () => {
    const wrapper = mountSidecar({
      captions: "some captions",
      chapters: "some chapters",
    });
    const select = wrapper.find("select");
    await select.setValue("de");

    const emitted = wrapper.emitted("update:sidecars");
    expect(emitted![0][0]).toMatchObject({
      captions: "some captions",
      chapters: "some chapters",
      language: "de",
    });
  });
});
