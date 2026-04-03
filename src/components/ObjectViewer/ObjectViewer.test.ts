import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ObjectViewer from "./ObjectViewer.vue";

vi.mock("@/config", () => ({
  default: {
    instance: {
      base: { url: "https://example.com" },
    },
  },
}));

vi.mock("@/helpers/useTheming", () => ({
  useTheming: () => ({
    activeTheme: { value: "light" },
  }),
}));

describe("ObjectViewer", () => {
  it("renders an iframe with a title attribute when title prop is provided", () => {
    const wrapper = mount(ObjectViewer, {
      props: {
        fileHandlerId: "abc123",
        parentAssetId: "asset456",
        title: "A photograph of a sunset over a lake",
      },
    });

    const iframe = wrapper.find("iframe");
    expect(iframe.exists()).toBe(true);
    expect(iframe.attributes("title")).toBe(
      "A photograph of a sunset over a lake"
    );
  });

  it("falls back to a generic title when no title prop is provided", () => {
    const wrapper = mount(ObjectViewer, {
      props: {
        fileHandlerId: "abc123",
        parentAssetId: "asset456",
      },
    });

    const iframe = wrapper.find("iframe");
    expect(iframe.exists()).toBe(true);
    expect(iframe.attributes("title")).toBe("Asset viewer");
  });

  it("does not render an iframe when fileHandlerId is null", () => {
    const wrapper = mount(ObjectViewer, {
      props: {
        fileHandlerId: null,
      },
    });

    expect(wrapper.find("iframe").exists()).toBe(false);
  });
});
