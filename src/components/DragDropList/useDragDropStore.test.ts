import { describe, it, expect } from "vitest";
import { useDragDropStore } from "./useDragDropStore";

describe("useDragDropStore moveItem", () => {
  it("does not mutate the caller's array when moving an item to another list", () => {
    // A fresh groupId per test, since the store keeps its groups in
    // module-scope state shared across every useDragDropStore() call.
    const store = useDragDropStore("move-item-no-mutation");

    const sourceItems = [{ id: "a" }, { id: "b" }];
    const targetItems = [{ id: "c" }];
    store.setList("source", sourceItems);
    store.setList("target", targetItems);

    store.moveItem(
      {
        groupId: "move-item-no-mutation",
        listId: "source",
        sourceIndex: 0,
      },
      {
        groupId: "move-item-no-mutation",
        listId: "target",
        targetIndex: 0,
      },
      null
    );

    // the arrays the caller handed to setList are untouched...
    expect(sourceItems).toEqual([{ id: "a" }, { id: "b" }]);
    expect(targetItems).toEqual([{ id: "c" }]);
    // ...the store's own lists reflect the move
    expect(store.getList("source")?.items).toEqual([{ id: "b" }]);
    expect(store.getList("target")?.items).toEqual([
      { id: "c" },
      { id: "a" },
    ]);
  });
});
