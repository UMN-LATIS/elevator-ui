import { describe, it, expect } from "vitest";
import { type NestedOptionsObj, useCascadeSelect } from "./useCascadeSelect";

const nestedOptions: NestedOptionsObj = {
  country: {
    usa: {
      "State or Province": {
        mn: [],
        wi: [],
        "South Dakota": [],
      },
    },
    canada: {
      "State or Province": ["quebec", "alberta"],
    },
  },
};

describe("useCascadeSelect", () => {
  /**
   * The CascadeSelect component takes an options object
   * which alternates category -> value -> category -> value
   * like { country: usa: { state: { minnesota: ... }}}
   * so a category object contains value objects, which
   * contain more category objects, and so on.
   *
   * This structure is complex to work with. So, the goal of
   * this component is to act as an intercessor by turning
   * the complext nested object into a flatter structure
   * which we can filter.
   */

  it("converts a nested options object to a flat list of options sorted by level and value", () => {
    const { flatOptions } = useCascadeSelect(() => nestedOptions);

    expect(flatOptions).toEqual([
      // countries
      {
        id: "canada",
        depth: 0,
        value: "canada",
        parentId: null,
      },
      {
        id: "usa",
        depth: 0,
        value: "usa",
        parentId: null,
      },

      // states and provinces
      {
        id: "canada-alberta",
        depth: 1,
        value: "alberta",
        parentId: "canada",
      },
      {
        id: "usa-mn",
        depth: 1,
        value: "mn",
        parentId: "usa",
      },
      {
        id: "canada-quebec",
        depth: 1,
        value: "quebec",
        parentId: "canada",
      },
      {
        id: "usa-southdakota",
        depth: 1,
        value: "South Dakota",
        parentId: "usa",
      },
      {
        id: "usa-wi",
        depth: 1,
        value: "wi",
        parentId: "usa",
      },
    ]);
  });

  it("returns the levels of the nested options", () => {
    const { levels } = useCascadeSelect(nestedOptions);

    expect(levels).toEqual([
      {
        id: "country",
        label: "country",
        depth: 0,
      },
      {
        id: "stateorprovince",
        label: "State or Province",
        depth: 1,
      },
    ]);
  });

  it("gets all options by a given level", () => {
    const { getOptionsByDepth } = useCascadeSelect(nestedOptions);

    const optionsAtLevel0 = getOptionsByDepth(0);
    expect(optionsAtLevel0).toEqual([
      {
        id: "canada",
        depth: 0,
        value: "canada",
        parentId: null,
      },
      {
        id: "usa",
        depth: 0,
        value: "usa",
        parentId: null,
      },
    ]);

    const optionsAtLevel1 = getOptionsByDepth(1);
    expect(optionsAtLevel1).toEqual([
      {
        id: "canada-alberta",
        depth: 1,
        value: "alberta",
        parentId: "canada",
      },
      {
        id: "usa-mn",
        depth: 1,
        value: "mn",
        parentId: "usa",
      },
      {
        id: "canada-quebec",
        depth: 1,
        value: "quebec",
        parentId: "canada",
      },
      {
        id: "usa-southdakota",
        depth: 1,
        value: "South Dakota",
        parentId: "usa",
      },
      {
        id: "usa-wi",
        depth: 1,
        value: "wi",
        parentId: "usa",
      },
    ]);
  });

  it("captures deeper levels that only exist under later siblings", () => {
    const tricky: NestedOptionsObj = {
      category: {
        // first sibling is a leaf (array) so depth ends here on this path
        alpha: [],
        // second sibling introduces a new deeper level
        beta: {
          Subcategory: {
            one: [],
            two: [],
          },
        },
      },
    };

    const { levels, flatOptions, getOptionsByDepth } = useCascadeSelect(tricky);

    expect(levels).toEqual([
      { id: "category", label: "category", depth: 0 },
      { id: "subcategory", label: "Subcategory", depth: 1 },
    ]);

    // level 0 options
    expect(getOptionsByDepth(0)).toEqual([
      { id: "alpha", depth: 0, value: "alpha", parentId: null },
      { id: "beta", depth: 0, value: "beta", parentId: null },
    ]);

    // level 1 options (children of beta only)
    expect(getOptionsByDepth(1)).toEqual([
      {
        id: "beta-one",
        depth: 1,
        value: "one",
        parentId: "beta",
      },
      {
        id: "beta-two",
        depth: 1,
        value: "two",
        parentId: "beta",
      },
    ]);

    // flat options should include all 4
    expect(flatOptions).toEqual([
      { id: "alpha", depth: 0, value: "alpha", parentId: null },
      { id: "beta", depth: 0, value: "beta", parentId: null },
      {
        id: "beta-one",
        depth: 1,
        value: "one",
        parentId: "beta",
      },
      {
        id: "beta-two",
        depth: 1,
        value: "two",
        parentId: "beta",
      },
    ]);
  });

  it("handles duplicate option names at the same level with different parents", () => {
    // This test case reproduces the bug where options with the same name
    // at the same level might not all show up because they have the same id
    const duplicateNamesOptions: NestedOptionsObj = {
      City: {
        minneapolis: {
          Neighborhood: ["downtown", "uptown", "northeast"],
        },
        mankato: {
          Neighborhood: ["downtown", "eastside", "westside"],
        },
      },
    };

    const { getOptionsByDepth } = useCascadeSelect(duplicateNamesOptions);

    // Should have 6 neighborhood options total (3 from each city)
    const neighborhoodOptions = getOptionsByDepth(1);
    expect(neighborhoodOptions).toHaveLength(6);

    // Should include both "downtown" options with different parent IDs
    const downtownOptions = neighborhoodOptions.filter(
      (opt) => opt.value === "downtown"
    );
    expect(downtownOptions).toHaveLength(2);

    // They should have different parent IDs
    const parentIds = downtownOptions.map((opt) => opt.parentId);
    expect(parentIds).toEqual(
      expect.arrayContaining(["minneapolis", "mankato"])
    );
    expect(parentIds[0]).not.toBe(parentIds[1]);
  });
});
