import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import AssetViewSkeleton from "./AssetViewSkeleton.vue";

describe("AssetViewSkeleton", () => {
  it("renders a container element with the asset-view-skeleton test id", () => {
    const wrapper = mount(AssetViewSkeleton);
    expect(wrapper.find('[data-testid="asset-view-skeleton"]').exists()).toBe(
      true
    );
  });

  it("renders at least one shared Skeleton primitive to stand in for content", () => {
    const wrapper = mount(AssetViewSkeleton);
    const skeletons = wrapper.findAllComponents({ name: "Skeleton" });
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
