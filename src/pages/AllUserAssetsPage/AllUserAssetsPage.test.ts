/**
 * AllUserAssetsPage tests.
 *
 * Regression test for issue #469: the page was showing "No assets found."
 * while the initial fetch was still in flight. This happened because
 * useAllUserAssets sets initialData to an empty array, so the query's `data`
 * is [] immediately. The page was checking `!allUserAssets.length` without
 * first confirming the fetch had completed.
 *
 * Fix: suppress the empty state message while `isFetching` is true.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { ref } from "vue";
import { createPinia, setActivePinia } from "pinia";

vi.mock("@/queries/useAllUserAssets", () => ({
  useAllUserAssets: vi.fn(),
}));

vi.mock("@/queries/useDeleteAssetMutation", () => ({
  useDeleteAssetMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/stores/errorStore", () => ({
  useErrorStore: () => ({ setError: vi.fn() }),
}));

import AllUserAssetsPage from "./AllUserAssetsPage.vue";
import { useAllUserAssets } from "@/queries/useAllUserAssets";

const mockUseAllUserAssets = vi.mocked(useAllUserAssets);

describe("AllUserAssetsPage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  function mount({ isFetching = false, data = [] as unknown[] } = {}) {
    mockUseAllUserAssets.mockReturnValue({
      data: ref(data),
      isFetching: ref(isFetching),
    } as ReturnType<typeof useAllUserAssets>);

    return shallowMount(AllUserAssetsPage, {
      global: {
        stubs: { DefaultLayout: { template: "<slot />" }, RouterLink: { template: "<a><slot /></a>" } },
      },
    });
  }

  it("does not show 'No assets found.' while the fetch is in flight", () => {
    const wrapper = mount({ isFetching: true, data: [] });
    expect(wrapper.text()).not.toContain("No assets found.");
  });

  it("shows 'No assets found.' when fetch completes with no results", () => {
    const wrapper = mount({ isFetching: false, data: [] });
    expect(wrapper.text()).toContain("No assets found.");
  });

  it("shows the table when fetch completes with results", () => {
    const wrapper = mount({ isFetching: false, data: [{ id: "1", title: "My Asset" }] });
    expect(wrapper.text()).not.toContain("No assets found.");
    expect(wrapper.findComponent({ name: "UserAssetsTable" }).exists()).toBe(true);
  });
});
