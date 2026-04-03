import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import ExcerptableIframe from "./ExcerptableIframe.vue";

vi.mock("@/config", () => ({
  default: {
    instance: {
      base: { url: "https://example.com" },
    },
  },
}));

vi.mock("@/helpers/useiFrameMessaging", () => ({
  useIframeMessaging: () => ({
    addResponseHandler: vi.fn(),
    postMessage: vi.fn(),
  }),
  responseTypes: {},
  requestTypes: {},
}));

describe("ExcerptableIframe", () => {
  it("renders an iframe with a title attribute when title prop is provided", () => {
    const wrapper = mount(ExcerptableIframe, {
      props: {
        fileObjectId: "abc123",
        title: "Clip: Interview segment",
      },
    });

    const iframe = wrapper.find("iframe");
    expect(iframe.exists()).toBe(true);
    expect(iframe.attributes("title")).toBe("Clip: Interview segment");
  });

  it("falls back to a default title when no title prop is provided", () => {
    const wrapper = mount(ExcerptableIframe, {
      props: {
        fileObjectId: "abc123",
      },
    });

    const iframe = wrapper.find("iframe");
    expect(iframe.exists()).toBe(true);
    expect(iframe.attributes("title")).toBe("Media player");
  });
});
