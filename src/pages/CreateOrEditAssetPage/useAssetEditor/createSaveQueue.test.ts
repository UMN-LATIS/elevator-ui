import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSaveQueue } from "./createSaveQueue";

// Flush all pending microtasks (Promise chains).
// With fake timers, setTimeout is frozen, but microtasks still drain automatically —
// this helper just ensures we've yielded enough for async chains to settle.
const flushMicrotasks = () => new Promise<void>((r) => queueMicrotask(r));

describe("createSaveQueue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  // Returns a saveFn mock plus manual controls for each invocation.
  function makeControllableSaveFn() {
    const resolves: Array<() => void> = [];
    const rejects: Array<(e: unknown) => void> = [];
    const fn = vi.fn().mockImplementation(
      () =>
        new Promise<void>((res, rej) => {
          resolves.push(res);
          rejects.push(rej);
        }),
    );
    return { fn, resolves, rejects };
  }

  describe("basic behavior", () => {
    it("fires the save immediately when no save is in flight", async () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const { save } = createSaveQueue(saveFn, 100);

      save();
      await flushMicrotasks();

      expect(saveFn).toHaveBeenCalledTimes(1);
    });

    it("returns a promise that resolves after the save completes", async () => {
      const { fn, resolves } = makeControllableSaveFn();
      const { save } = createSaveQueue(fn, 0);

      const result = save();
      await flushMicrotasks();
      resolves[0]();
      await flushMicrotasks();

      await expect(result).resolves.toBeUndefined();
    });

    it("starts a fresh save immediately after the queue becomes idle", async () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const { save } = createSaveQueue(saveFn, 100);

      // First cycle: let save complete and cooldown expire so loop exits
      save();
      await flushMicrotasks();
      await vi.advanceTimersByTimeAsync(100);
      await flushMicrotasks();

      expect(saveFn).toHaveBeenCalledTimes(1);

      // Second call should fire immediately — no in-flight save
      save();
      await flushMicrotasks();

      expect(saveFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("coalescing", () => {
    it("coalesces saves requested while one is in flight into a single additional call", async () => {
      const { fn, resolves } = makeControllableSaveFn();
      const { save } = createSaveQueue(fn, 0);

      const p1 = save();
      await flushMicrotasks(); // first save now in flight

      // Multiple saves arrive while first is in flight
      const p2 = save();
      const p3 = save();
      const p4 = save();

      // Complete the first save
      resolves[0]();
      await flushMicrotasks();
      await vi.advanceTimersByTimeAsync(0); // advance past 0ms cooldown
      await flushMicrotasks();

      await expect(p1).resolves.toBeUndefined();

      // p2/p3/p4 were coalesced — only one additional saveFn call
      resolves[1]();
      await flushMicrotasks();
      await vi.advanceTimersByTimeAsync(0);
      await flushMicrotasks();

      await expect(p2).resolves.toBeUndefined();
      await expect(p3).resolves.toBeUndefined();
      await expect(p4).resolves.toBeUndefined();

      expect(fn).toHaveBeenCalledTimes(2); // 4 saves → 2 actual calls
    });
  });

  describe("cooldown", () => {
    it("does not fire a second save until the cooldown has elapsed", async () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const { save } = createSaveQueue(saveFn, 1000);

      save();
      await flushMicrotasks(); // first save completes

      save(); // queue another during cooldown
      await flushMicrotasks();

      expect(saveFn).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(999);
      await flushMicrotasks();
      expect(saveFn).toHaveBeenCalledTimes(1); // still cooling down

      await vi.advanceTimersByTimeAsync(1);
      await flushMicrotasks();
      expect(saveFn).toHaveBeenCalledTimes(2); // cooldown expired, second save fired
    });

    it("resolves the save promise before the cooldown finishes", async () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const { save } = createSaveQueue(saveFn, 1000);

      const p = save();
      await flushMicrotasks(); // saveFn resolves, callbacks called

      // Promise should be resolved even though cooldown hasn't expired
      await expect(p).resolves.toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("rejects the promise when saveFn throws", async () => {
      const error = new Error("network error");
      const saveFn = vi.fn().mockRejectedValue(error);
      const { save } = createSaveQueue(saveFn, 0);

      const result = save();
      await flushMicrotasks();

      await expect(result).rejects.toThrow("network error");
    });

    it("rejects all promises snapshotted in the failing iteration", async () => {
      // To get multiple saves into the same snapshot, we queue them during a
      // cooldown period — the loop hasn't started its next iteration yet, so
      // all three callbacks are snapshotted together when it does.
      const error = new Error("save failed");
      const { fn, resolves, rejects } = makeControllableSaveFn();
      // First invocation succeeds, second fails
      fn.mockImplementationOnce(() => new Promise<void>((r) => resolves.push(r)));
      fn.mockImplementationOnce(() => new Promise<void>((_, rej) => rejects.push(rej)));

      const { save } = createSaveQueue(fn, 100);

      // Complete the first save so we're in the cooldown
      save();
      await flushMicrotasks();
      resolves[0]();
      await flushMicrotasks();

      // Queue three saves during the cooldown — all will be snapshotted together
      const p1 = save();
      const p2 = save();
      const p3 = save();

      // Advance past cooldown — loop runs second iteration, snapshots all three
      await vi.advanceTimersByTimeAsync(100);
      await flushMicrotasks();

      // Second save is now in flight — reject it
      rejects[0](error);
      await flushMicrotasks();

      await expect(p1).rejects.toThrow("save failed");
      await expect(p2).rejects.toThrow("save failed");
      await expect(p3).rejects.toThrow("save failed");
    });

    it("rejects saves that arrived during a failing in-flight save", async () => {
      // Bug: saves added to the queue AFTER the snapshot is taken (i.e. while
      // saveFn() is awaiting) are not in rejectSnapshot. When the catch block
      // fires it only rejects the snapshot, leaving the in-flight arrivals
      // hanging forever unless a subsequent save() happens to pick them up.
      const error = new Error("save failed");
      const { fn, rejects } = makeControllableSaveFn();
      const { save } = createSaveQueue(fn, 0);

      // p1 starts the loop; the loop synchronously snapshots p1 and awaits saveFn
      const p1 = save();
      await flushMicrotasks(); // saveFn now in flight

      // p2 and p3 arrive after the snapshot — their callbacks are NOT in rejectSnapshot
      const p2 = save();
      const p3 = save();

      // Fail the in-flight save
      rejects[0](error);
      await flushMicrotasks();

      await expect(p1).rejects.toThrow("save failed");
      await expect(p2).rejects.toThrow("save failed");
      await expect(p3).rejects.toThrow("save failed");
    });

    it("starts a fresh loop on the next save() call after an error", async () => {
      const error = new Error("save failed");
      const saveFn = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue(undefined);

      const { save } = createSaveQueue(saveFn, 0);

      // First save fails
      const p1 = save();
      await flushMicrotasks();
      await expect(p1).rejects.toThrow("save failed");

      // Second save should start fresh and succeed
      const p2 = save();
      await flushMicrotasks();
      await vi.advanceTimersByTimeAsync(0);
      await flushMicrotasks();

      await expect(p2).resolves.toBeUndefined();
      expect(saveFn).toHaveBeenCalledTimes(2);
    });
  });
});
