import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, nextTick } from "vue";
import DragDropContainer from "./DragDropContainer.vue";
import DragDropList from "./DragDropList.vue";
import { makeDragData, makeDropData } from "./utils/dataHelpers";
import type { CleanupFn } from "./utils/dnd";
import type { HasId } from "./dndTypes";

type DropPayload = {
  source: { data: Record<string | symbol, unknown> };
  location: {
    current: { dropTargets: { data: Record<string | symbol, unknown> }[] };
  };
};

type MonitorConfig = { onDrop: (payload: DropPayload) => void };

// Stands in for pragmatic-drag-and-drop's registry so the test can see which
// registrations a component released when it unmounted.
const dndRegistry = vi.hoisted(() => ({
  liveMonitors: [] as MonitorConfig[],
  liveElementRegistrations: 0,
}));

vi.mock("./utils/dnd", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./utils/dnd")>();

  function registerElement(): CleanupFn {
    dndRegistry.liveElementRegistrations += 1;
    return () => {
      dndRegistry.liveElementRegistrations -= 1;
    };
  }

  function registerMonitor(config: MonitorConfig): CleanupFn {
    dndRegistry.liveMonitors.push(config);
    return () => {
      const position = dndRegistry.liveMonitors.indexOf(config);
      if (position !== -1) dndRegistry.liveMonitors.splice(position, 1);
    };
  }

  return {
    ...actual,
    announce: vi.fn(),
    draggable: registerElement,
    dropTargetForElements: registerElement,
    monitorForElements: registerMonitor,
  };
});

const GROUP_ID = "test-group";
const LIST_ID = "test-list";

// Every order the list has emitted since the current test began.
const ordersEmitted: string[][] = [];

function mountList(items: HasId[]): VueWrapper {
  return mount(DragDropContainer, {
    props: { groupId: GROUP_ID },
    slots: {
      default: () =>
        h(DragDropList, {
          listId: LIST_ID,
          modelValue: items,
          "onUpdate:modelValue": (reordered: HasId[]) =>
            ordersEmitted.push(reordered.map((item) => String(item.id))),
        }),
    },
    attachTo: document.body,
  });
}

/**
 * Notifies every monitor still registered, the way the real adapter does.
 *
 * No closest edge is attached, so the item lands on the target's own index.
 */
function dropItemOnTarget(
  items: HasId[],
  sourceIndex: number,
  targetIndex: number
): void {
  const payload: DropPayload = {
    source: {
      data: makeDragData({
        sourceId: items[sourceIndex].id,
        sourceIndex,
        groupId: GROUP_ID,
        listId: LIST_ID,
      }),
    },
    location: {
      current: {
        dropTargets: [
          {
            data: makeDropData({
              targetId: items[targetIndex].id,
              targetIndex,
              groupId: GROUP_ID,
              listId: LIST_ID,
            }),
          },
        ],
      },
    },
  };

  [...dndRegistry.liveMonitors].forEach((monitor) => monitor.onDrop(payload));
}

describe("DragDropList", () => {
  beforeEach(() => {
    dndRegistry.liveMonitors.length = 0;
    dndRegistry.liveElementRegistrations = 0;
    ordersEmitted.length = 0;
    document.body.innerHTML = "";
  });

  it("releases its drag and drop registrations on unmount", () => {
    const wrapper = mountList([{ id: "a" }, { id: "b" }]);
    expect(dndRegistry.liveMonitors).toHaveLength(1);
    expect(dndRegistry.liveElementRegistrations).toBeGreaterThan(0);

    wrapper.unmount();

    expect(dndRegistry.liveMonitors).toHaveLength(0);
    expect(dndRegistry.liveElementRegistrations).toBe(0);
  });

  it("moves a dropped item once after the list has been remounted", async () => {
    const items: HasId[] = [{ id: "a" }, { id: "b" }, { id: "c" }];

    mountList(items).unmount();
    mountList(items);

    dropItemOnTarget(items, 0, 1);
    await nextTick();

    expect(ordersEmitted.at(-1)).toEqual(["b", "a", "c"]);
  });
});
