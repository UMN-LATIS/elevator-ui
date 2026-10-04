import { afterEach, describe, expect, it } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import type { Component } from "vue";
import DataTable from "./DataTable.vue";
import type { DataTableColumn, DataTableHandle } from "@/types";

interface Fruit {
  id: number;
  name: string;
  note: string;
}

const FRUITS: Fruit[] = [
  { id: 1, name: "Banana", note: "yellow" },
  { id: 2, name: "Apple", note: "crisp" },
  { id: 3, name: "Cherry", note: "pitted" },
];

function columnsWith(
  overrides: Partial<Record<"note", Partial<DataTableColumn<Fruit>>>> = {}
): DataTableColumn<Fruit>[] {
  return [
    {
      id: "name",
      label: "Name",
      sortValue: (fruit) => fruit.name,
      searchValue: (fruit) => fruit.name,
    },
    {
      id: "note",
      label: "Note",
      searchValue: (fruit) => fruit.note,
      ...overrides.note,
    },
  ];
}

const CELL_SLOTS = {
  "cell-name": `<template #cell-name="{ row }">{{ row.name }}</template>`,
  "cell-note": `<template #cell-note="{ row }">{{ row.note }}</template>`,
};

// mount() types a generic component with its default row
// type, so Fruit columns fail to type-check against it
const FruitTable = DataTable as unknown as Component;

let wrapper: VueWrapper | null = null;

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
});

function mountTable({
  props = {},
  slots = {},
}: {
  props?: Record<string, unknown>;
  slots?: Record<string, string>;
} = {}): VueWrapper {
  wrapper = mount(FruitTable, {
    props: {
      itemName: { singular: "fruit", plural: "fruits" },
      rows: FRUITS,
      columns: columnsWith(),
      ...props,
    },
    slots: { ...CELL_SLOTS, ...slots },
    attachTo: document.body,
  });
  return wrapper;
}

function bodyRowTexts(table: VueWrapper): string[] {
  return table.findAll("tbody tr").map((row) =>
    row
      .findAll("td")
      .map((cell) => cell.text().trim())
      .filter(Boolean)
      .join(" ")
  );
}

async function search(table: VueWrapper, text: string): Promise<void> {
  await table.find('input[type="search"]').setValue(text);
}

describe("DataTable", () => {
  it("renders one cell per visible column, under its header", () => {
    const table = mountTable({
      props: { columns: columnsWith({ note: { isHidden: true } }) },
    });

    expect(table.findAll("thead th")).toHaveLength(1);
    for (const row of table.findAll("tbody tr")) {
      expect(row.findAll("td")).toHaveLength(1);
    }
    expect(table.text()).not.toContain("yellow");
  });

  it("searches only the columns on screen", async () => {
    const table = mountTable({
      props: { columns: columnsWith({ note: { isHidden: true } }) },
    });

    await search(table, "yellow");

    expect(bodyRowTexts(table)).toEqual(["No fruits match your search."]);
  });

  it("filters rows by any visible column's search value", async () => {
    const table = mountTable();

    await search(table, "crisp");

    expect(bodyRowTexts(table)).toEqual(["Apple crisp"]);
  });

  it.each([
    [{ rows: [] }, "No fruits yet."],
    [{ rows: [], isFiltered: true }, "No fruits match the filter."],
    [{ status: "pending" }, "Loading fruits…"],
    [{ status: "error" }, "Could not load fruits."],
  ])("with %o shows %s", (props, message) => {
    const table = mountTable({ props });

    expect(bodyRowTexts(table)).toEqual([message]);
  });

  it("sorts ascending, then descending, from the header", async () => {
    const table = mountTable();
    const sortButton = table.get("thead button");

    await sortButton.trigger("click");
    expect(bodyRowTexts(table).map((text) => text.split(" ")[0])).toEqual([
      "Apple",
      "Banana",
      "Cherry",
    ]);

    await sortButton.trigger("click");
    expect(bodyRowTexts(table).map((text) => text.split(" ")[0])).toEqual([
      "Cherry",
      "Banana",
      "Apple",
    ]);
  });

  describe("expanding rows", () => {
    const DETAIL = {
      detail: `<template #detail="{ row }">Detail of {{ row.name }}</template>`,
    };

    it("adds no chevron column without a detail slot", () => {
      const table = mountTable();

      expect(table.findAll("thead th")).toHaveLength(2);
      expect(table.find("button[aria-expanded]").exists()).toBe(false);
    });

    it("shows a chevron only on rows that can expand", () => {
      const table = mountTable({
        props: { canExpand: (fruit: Fruit) => fruit.name !== "Apple" },
        slots: DETAIL,
      });

      const labels = table
        .findAll("button[aria-expanded]")
        .map((button) => button.attributes("aria-label"));
      expect(labels).toEqual([
        "Toggle details for fruit",
        "Toggle details for fruit",
      ]);
    });

    it("names each chevron after its row and toggles the detail", async () => {
      const table = mountTable({
        props: {
          canExpand: () => true,
          rowName: (fruit: Fruit) => fruit.name,
        },
        slots: DETAIL,
      });
      const chevron = table.get(
        'button[aria-label="Toggle details for Banana"]'
      );

      await chevron.trigger("click");
      expect(chevron.attributes("aria-expanded")).toBe("true");
      expect(table.text()).toContain("Detail of Banana");

      await chevron.trigger("click");
      expect(chevron.attributes("aria-expanded")).toBe("false");
      expect(table.text()).not.toContain("Detail of Banana");
    });
  });

  describe("toolbar", () => {
    it("renders the toolbarEnd slot beside the search box", () => {
      const table = mountTable({
        slots: { toolbarEnd: `<button type="button">Create Fruit</button>` },
      });

      expect(table.text()).toContain("Create Fruit");
      expect(table.get("table").text()).not.toContain("Create Fruit");
    });

    it("is absent when nothing is searchable and no slot fills it", () => {
      const unsearchable: DataTableColumn<Fruit>[] = [
        { id: "name", label: "Name" },
      ];
      const table = mountTable({ props: { columns: unsearchable } });

      expect(
        table.element.firstElementChild?.querySelector("table")
      ).not.toBeNull();
    });
  });

  describe("reveal", () => {
    it("clears the search, expands, and marks the row until its flash ends", async () => {
      const table = mountTable({
        props: { canExpand: () => true },
        slots: {
          detail: `<template #detail="{ row }">Detail of {{ row.name }}</template>`,
        },
      });
      await search(table, "Banana");

      await (table.vm as unknown as DataTableHandle).reveal(3, {
        expand: true,
      });
      await flushPromises();

      const cherryRow = table.get('[data-row-id="3"]');
      expect(bodyRowTexts(table)).toHaveLength(4);
      expect(table.text()).toContain("Detail of Cherry");
      expect(cherryRow.attributes("aria-current")).toBe("true");
      expect(document.activeElement).toBe(cherryRow.element);

      await cherryRow.trigger("animationend");
      expect(cherryRow.attributes("aria-current")).toBeUndefined();
    });
  });
});
