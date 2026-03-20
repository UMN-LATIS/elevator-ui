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
 *
 * Issue #468: Trash tab — shows soft-deleted assets with restore action.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { ref } from "vue";
import { createPinia, setActivePinia } from "pinia";

const mockRoute = { query: {} as Record<string, string> };
const mockRouter = { replace: vi.fn() };

vi.mock("vue-router", () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
}));

vi.mock("@/queries/useAllUserAssets", () => ({
  useAllUserAssets: vi.fn(),
}));

vi.mock("@/queries/useDeletedUserAssets", () => ({
  useDeletedUserAssets: vi.fn(),
}));

vi.mock("@/queries/useDeleteAssetMutation", () => ({
  useDeleteAssetMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/queries/useRestoreAssetMutation", () => ({
  useRestoreAssetMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/stores/errorStore", () => ({
  useErrorStore: () => ({ setError: vi.fn() }),
}));

vi.mock("@/stores/toastStore", () => ({
  useToastStore: () => ({ addToast: vi.fn() }),
}));

import AllUserAssetsPage from "./AllUserAssetsPage.vue";
import { useAllUserAssets } from "@/queries/useAllUserAssets";
import { useDeletedUserAssets } from "@/queries/useDeletedUserAssets";

const mockUseAllUserAssets = vi.mocked(useAllUserAssets);
const mockUseDeletedUserAssets = vi.mocked(useDeletedUserAssets);

const mockDeletedAssets = [
  {
    objectId: "d1",
    title: "Deleted Photo Essay",
    readyForDisplay: false,
    templateId: 1,
    modifiedDate: { date: "2026-03-10", timezone_type: 3, timezone: "UTC" },
    deletedAt: "2026-03-15T10:30:00.000Z",
  },
  {
    objectId: "d2",
    title: "Deleted Audio Recording",
    readyForDisplay: true,
    templateId: 1,
    modifiedDate: { date: "2026-03-12", timezone_type: 3, timezone: "UTC" },
    deletedAt: "2026-03-16T14:45:00.000Z",
  },
];

describe("AllUserAssetsPage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRoute.query = {};
    mockRouter.replace.mockReset();
  });

  function mount({
    isFetching = false,
    data = [] as unknown[],
    deletedAssets = [] as unknown[],
    isDeletedFetching = false,
    tab,
  }: {
    isFetching?: boolean;
    data?: unknown[];
    deletedAssets?: unknown[];
    isDeletedFetching?: boolean;
    tab?: string;
  } = {}) {
    if (tab) mockRoute.query = { tab };
    mockUseAllUserAssets.mockReturnValue({
      data: ref(data),
      isFetching: ref(isFetching),
    } as ReturnType<typeof useAllUserAssets>);

    mockUseDeletedUserAssets.mockReturnValue({
      data: ref(deletedAssets),
      isFetching: ref(isDeletedFetching),
    } as ReturnType<typeof useDeletedUserAssets>);

    return shallowMount(AllUserAssetsPage, {
      global: {
        stubs: {
          DefaultLayout: { template: "<slot />" },
          RouterLink: { template: "<a><slot /></a>" },
          Tabs: { template: "<div><slot /></div>" },
          Tab: { name: "Tab", template: "<div><slot /></div>", props: ["id", "label"] },
        },
      },
    });
  }

  it("does not show 'No assets found.' while the fetch is in flight", () => {
    const wrapper = mount({ isFetching: true, data: [] });
    expect(wrapper.text()).not.toContain("No assets found.");
    expect(wrapper.text()).not.toContain("No results.");
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

  describe("Trash tab", () => {
    it("renders My Assets and Trash tabs", () => {
      const wrapper = mount();
      const tabs = wrapper.findAllComponents({ name: "Tab" });
      expect(tabs).toHaveLength(2);
      expect(tabs[0].props("id")).toBe("my-assets");
      expect(tabs[1].props("id")).toBe("trash");
    });

    it("shows deleted asset count in Trash tab label", () => {
      const wrapper = mount({ deletedAssets: mockDeletedAssets });
      const tabs = wrapper.findAllComponents({ name: "Tab" });
      const trashTab = tabs.find((t) => t.props("id") === "trash");
      expect(trashTab?.props("label")).toBe("Trash (2)");
    });

    it("shows Trash (0) when no deleted assets exist", () => {
      const wrapper = mount({ deletedAssets: [] });
      const tabs = wrapper.findAllComponents({ name: "Tab" });
      const trashTab = tabs.find((t) => t.props("id") === "trash");
      expect(trashTab?.props("label")).toBe("Trash (0)");
    });

    it("shows deleted assets table when deleted assets exist", () => {
      const wrapper = mount({
        data: [{ objectId: "a1", title: "Active Asset" }],
        deletedAssets: mockDeletedAssets,
      });
      const tables = wrapper.findAllComponents({ name: "UserAssetsTable" });
      expect(tables).toHaveLength(2);
      expect(tables[1].props("data")).toEqual(mockDeletedAssets);
    });

    it("shows empty state when trash has no deleted assets", () => {
      const wrapper = mount({ deletedAssets: [] });
      expect(wrapper.text()).toContain("No deleted assets.");
    });
  });

});
