import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent } from "vue";
import { createRouter, createMemoryHistory } from "vue-router";
import type { Router } from "vue-router";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia } from "pinia";
import { queryKeys } from "./drawerGroupQueries";
import { GROUP_TYPES } from "@/types";
import type { GroupTypeDetails, PermissionsGroup } from "@/types";

const seminarGroup: PermissionsGroup = {
  id: 5,
  type: GROUP_TYPES.USER,
  label: "Spring Seminar",
  entries_count: 2,
};

const botanyGroup: PermissionsGroup = {
  id: 6,
  type: GROUP_TYPES.USER,
  label: "Botany Students",
  entries_count: 0,
};

const userGroupType: GroupTypeDetails = {
  type: GROUP_TYPES.USER,
  label: "Users",
  description: "Named users",
  entryHints: [],
  adminOnly: false,
};

// Only the two lists this tab reads are stubbed. Other modules re-export
// the rest of the fetchers, so the real ones stay in place.
vi.mock("@/api/fetchers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/fetchers")>();
  return {
    ...actual,
    fetchDrawerGroups: vi.fn(async () => [seminarGroup, botanyGroup]),
    fetchDrawerGroupTypes: vi.fn(async () => [userGroupType]),
  };
});

// The detail panels fetch members and entries of their own, which the
// deep link does not touch.
const Stub = defineComponent({ template: "<div />" });

// Arriving from the Rules tab means the groups list is already cached, so
// the deep-link watch sees its data during setup rather than after a
// fetch. Seeding reproduces that ordering.
async function mountGroupsTab(
  initialPath: string,
  { isCacheWarm = false }: { isCacheWarm?: boolean } = {}
) {
  const router: Router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/:pathMatch(.*)*", component: Stub }],
  });
  await router.push(initialPath);
  await router.isReady();

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  if (isCacheWarm) {
    queryClient.setQueryData(queryKeys.drawerGroupsList(), [
      seminarGroup,
      botanyGroup,
    ]);
    queryClient.setQueryData(queryKeys.drawerGroupTypes(), [userGroupType]);
  }

  const GroupsTabContent = (await import("./GroupsTabContent.vue")).default;

  const wrapper = mount(GroupsTabContent, {
    attachTo: document.body,
    global: {
      plugins: [createPinia(), router, [VueQueryPlugin, { queryClient }]],
      stubs: {
        GroupFormModal: true,
        GroupMemberManager: true,
        GroupEntriesManager: true,
        ConfirmModal: true,
      },
    },
  });

  // the groups query resolves, then tryFocus retries across frames
  await flushPromises();
  await new Promise((resolve) => setTimeout(resolve, 50));
  await flushPromises();

  return { wrapper, router };
}

describe("GroupsTabContent deep link", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Arriving from the Rules tab: its group list is already cached, so the
  // watch has its data during setup.
  it("focuses the row named by ?group with the list already cached", async () => {
    const { wrapper, router } = await mountGroupsTab("/?tab=groups&group=5", {
      isCacheWarm: true,
    });

    expect(document.activeElement?.getAttribute("data-group-row")).toBe("5");
    expect(router.currentRoute.value.query.group).toBeUndefined();
    expect(router.currentRoute.value.query.tab).toBe("groups");

    wrapper.unmount();
  });

  it("focuses the row named by ?group", async () => {
    const { wrapper, router } = await mountGroupsTab("/?tab=groups&group=5");

    const focusedRow = document.activeElement;
    expect(focusedRow?.getAttribute("data-group-row")).toBe("5");

    // the param is spent, so a refresh does not replay the jump
    expect(router.currentRoute.value.query.group).toBeUndefined();
    // and the tab it arrived on survives the cleanup
    expect(router.currentRoute.value.query.tab).toBe("groups");

    wrapper.unmount();
  });

  it("expands the linked group so its members are in reach", async () => {
    const { wrapper } = await mountGroupsTab("/?tab=groups&group=5");

    const linkedRow = document.querySelector('[data-group-row="5"]');
    expect(linkedRow?.getAttribute("aria-current")).toBe("true");
    expect(wrapper.findComponent({ name: "GroupMemberManager" }).exists()).toBe(
      true
    );

    wrapper.unmount();
  });

  // The Rules tab link is a route change, and the tabs are v-if, so the
  // tab mounts while that navigation is still settling. The watch then
  // rewrites the query from inside its own setup.
  it("focuses the row when the link mounts the tab mid-navigation", async () => {
    const router: Router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/:pathMatch(.*)*", component: Stub }],
    });
    await router.push("/?tab=rules");
    await router.isReady();

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(queryKeys.drawerGroupsList(), [
      seminarGroup,
      botanyGroup,
    ]);
    queryClient.setQueryData(queryKeys.drawerGroupTypes(), [userGroupType]);

    const GroupsTabContent = (await import("./GroupsTabContent.vue")).default;

    // stands in for the page's <Tab id="groups">, which is v-if'd on the
    // active tab
    const TabHost = defineComponent({
      components: { GroupsTabContent },
      setup: () => ({ route: router.currentRoute }),
      template: `<GroupsTabContent v-if="route.query.tab === 'groups'" />`,
    });

    const wrapper = mount(TabHost, {
      attachTo: document.body,
      global: {
        plugins: [createPinia(), router, [VueQueryPlugin, { queryClient }]],
        stubs: {
          GroupFormModal: true,
          GroupMemberManager: true,
          GroupEntriesManager: true,
          ConfirmModal: true,
        },
      },
    });
    await flushPromises();

    await router.push("/?tab=groups&group=5");
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 50));
    await flushPromises();

    expect(document.activeElement?.getAttribute("data-group-row")).toBe("5");
    expect(router.currentRoute.value.query.group).toBeUndefined();
    expect(router.currentRoute.value.query.tab).toBe("groups");

    wrapper.unmount();
  });

  it("leaves every row alone without the param", async () => {
    const { wrapper } = await mountGroupsTab("/?tab=groups");

    expect(document.activeElement).toBe(document.body);
    const unlinkedRow = document.querySelector('[data-group-row="5"]');
    expect(unlinkedRow?.getAttribute("aria-current")).toBeNull();

    wrapper.unmount();
  });
});
