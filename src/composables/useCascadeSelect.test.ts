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
        id: "country-canada",
        depth: 0,
        value: "canada",
        parentId: null,
      },
      {
        id: "country-usa",
        depth: 0,
        value: "usa",
        parentId: null,
      },

      // states and provinces
      {
        id: "stateorprovince-alberta",
        depth: 1,
        value: "alberta",
        parentId: "country-canada",
      },
      {
        id: "stateorprovince-mn",
        depth: 1,
        value: "mn",
        parentId: "country-usa",
      },
      {
        id: "stateorprovince-quebec",
        depth: 1,
        value: "quebec",
        parentId: "country-canada",
      },
      {
        id: "stateorprovince-southdakota",
        depth: 1,
        value: "South Dakota",
        parentId: "country-usa",
      },
      {
        id: "stateorprovince-wi",
        depth: 1,
        value: "wi",
        parentId: "country-usa",
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
        id: "country-canada",
        depth: 0,
        value: "canada",
        parentId: null,
      },
      {
        id: "country-usa",
        depth: 0,
        value: "usa",
        parentId: null,
      },
    ]);

    const optionsAtLevel1 = getOptionsByDepth(1);
    expect(optionsAtLevel1).toEqual([
      {
        id: "stateorprovince-alberta",
        depth: 1,
        value: "alberta",
        parentId: "country-canada",
      },
      {
        id: "stateorprovince-mn",
        depth: 1,
        value: "mn",
        parentId: "country-usa",
      },
      {
        id: "stateorprovince-quebec",
        depth: 1,
        value: "quebec",
        parentId: "country-canada",
      },
      {
        id: "stateorprovince-southdakota",
        depth: 1,
        value: "South Dakota",
        parentId: "country-usa",
      },
      {
        id: "stateorprovince-wi",
        depth: 1,
        value: "wi",
        parentId: "country-usa",
      },
    ]);
  });
});
