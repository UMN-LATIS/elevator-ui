import { describe, expect, it } from "vitest";
import { findDeepestPath } from "./findDeepestPath";

describe("findDeepestPath", () => {
  it("should return an empty array for a nontraversable object", () => {
    expect(findDeepestPath({})).toEqual([]);
    expect(findDeepestPath("string")).toEqual([]);
    expect(findDeepestPath(123)).toEqual([]);
    expect(findDeepestPath(null)).toEqual([]);
    expect(findDeepestPath(undefined)).toEqual([]);
    expect(findDeepestPath([])).toEqual([]);
  });
  it("should return the deepest path in a nested object", () => {
    expect(findDeepestPath({ a: 1 })).toEqual(["a"]);
    expect(findDeepestPath({ a: { b: { c: 3 } } })).toEqual(["a", "b", "c"]);
  });

  it("should return the deepest path in a nested object with multiple branches", () => {
    const obj = {
      country: {
        us: {
          state: {
            mn: {
              city: ["mpls", "st paul"],
            },
            wi: {
              city: ["madison", "milwaukee"],
            },
          },
        },
        ca: {
          state: {
            bc: {
              city: {
                vancouver: {
                  neighborhood: ["kitsilano", "yaletown"],
                },
                victoria: {
                  neighborhood: ["downtown", "james bay"],
                },
              },
              qc: {
                city: ["montreal", "quebec city"],
              },
            },
          },
        },
      },
    };

    expect(findDeepestPath(obj)).toEqual([
      "country",
      "ca",
      "state",
      "bc",
      "city",
      "vancouver",
      "neighborhood",
    ]);
  });
});
