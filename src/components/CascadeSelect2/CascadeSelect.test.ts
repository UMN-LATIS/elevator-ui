import { describe, it, expect } from "vitest";
import {
  getOptionsForLevel,
  hasOptionsAtLevel,
  getTypeForLevel,
  getLabelForLevel,
  getPlaceholderForLevel,
  shouldDisableLevel,
  calculateVisibleLevels,
  getSelectionPath,
} from "./cascadeSelectHelpers";
import type { Option } from "./CascadeSelect.vue";

// Test data
const testOptions: Option[] = [
  {
    label: "United States",
    value: "us",
    type: "country",
    children: [
      {
        label: "California",
        value: "ca",
        type: "state",
        children: [
          { label: "Los Angeles", value: "la", type: "city" },
          { label: "San Francisco", value: "sf", type: "city" },
        ],
      },
      {
        label: "New York",
        value: "ny",
        type: "state",
        children: [
          { label: "New York City", value: "nyc", type: "city" },
          { label: "Buffalo", value: "buf", type: "city" },
        ],
      },
    ],
  },
  {
    label: "Canada",
    value: "ca",
    type: "country",
    children: [
      {
        label: "Ontario",
        value: "on",
        type: "province",
        children: [
          { label: "Toronto", value: "tor", type: "city" },
          { label: "Ottawa", value: "ott", type: "city" },
        ],
      },
    ],
  },
];

const typeLabels = {
  country: "Country",
  state: "US State",
  province: "Canadian Province",
  city: "City",
};

const typePlaceholders = {
  country: "Select a country",
  state: "Select a state",
  province: "Select a province",
  city: "Select a city",
};

describe("getOptionsForLevel", () => {
  it("returns all options for level 0", () => {
    const result = getOptionsForLevel(testOptions, [], 0);
    expect(result).toEqual(testOptions);
    expect(result.length).toBe(2);
  });

  it("returns correct options for level 1 with US selected", () => {
    const result = getOptionsForLevel(testOptions, ["us"], 1);
    expect(result.length).toBe(2);
    expect(result[0].value).toBe("ca");
    expect(result[1].value).toBe("ny");
  });

  it("returns correct options for level 2 with US and CA selected", () => {
    const result = getOptionsForLevel(testOptions, ["us", "ca"], 2);
    expect(result.length).toBe(2);
    expect(result[0].value).toBe("la");
    expect(result[1].value).toBe("sf");
  });

  it("returns empty array if selection path is invalid", () => {
    const result = getOptionsForLevel(testOptions, ["invalid"], 1);
    expect(result).toEqual([]);
  });

  it("returns empty array if selection is incomplete", () => {
    const result = getOptionsForLevel(testOptions, [], 1);
    expect(result).toEqual([]);
  });
});

describe("hasOptionsAtLevel", () => {
  it("returns true for level 0", () => {
    expect(hasOptionsAtLevel(testOptions, [], 0)).toBe(true);
  });

  it("returns true for valid path with options", () => {
    expect(hasOptionsAtLevel(testOptions, ["us"], 1)).toBe(true);
    expect(hasOptionsAtLevel(testOptions, ["us", "ca"], 2)).toBe(true);
  });

  it("returns false for invalid path", () => {
    expect(hasOptionsAtLevel(testOptions, ["invalid"], 1)).toBe(false);
  });

  it("returns false for path with no children", () => {
    expect(hasOptionsAtLevel(testOptions, ["us", "ca", "la"], 3)).toBe(false);
  });
});

describe("getTypeForLevel", () => {
  it("returns country for level 0", () => {
    expect(getTypeForLevel(testOptions, [], 0)).toBe("country");
  });

  it("returns state for US states", () => {
    expect(getTypeForLevel(testOptions, ["us"], 1)).toBe("state");
  });

  it("returns province for Canadian provinces", () => {
    expect(getTypeForLevel(testOptions, ["ca"], 1)).toBe("province");
  });

  it("returns city for city level", () => {
    expect(getTypeForLevel(testOptions, ["us", "ca"], 2)).toBe("city");
  });

  it("returns fallback for invalid path", () => {
    expect(getTypeForLevel(testOptions, ["invalid"], 1)).toBe("level-1");
  });
});

describe("getLabelForLevel", () => {
  it("returns correct label for country level", () => {
    expect(getLabelForLevel(testOptions, [], 0, typeLabels)).toBe("Country");
  });

  it("returns correct label for US state level", () => {
    expect(getLabelForLevel(testOptions, ["us"], 1, typeLabels)).toBe(
      "US State"
    );
  });

  it("returns correct label for Canadian province level", () => {
    expect(getLabelForLevel(testOptions, ["ca"], 1, typeLabels)).toBe(
      "Canadian Province"
    );
  });

  it("returns correct label for city level", () => {
    expect(getLabelForLevel(testOptions, ["us", "ca"], 2, typeLabels)).toBe(
      "City"
    );
  });

  it("returns fallback label for unknown type", () => {
    expect(getLabelForLevel(testOptions, ["invalid"], 1, typeLabels)).toBe(
      "Select (Level 2)"
    );
  });
});

describe("getPlaceholderForLevel", () => {
  it("returns correct placeholder for country level", () => {
    expect(getPlaceholderForLevel(testOptions, [], 0, typePlaceholders)).toBe(
      "Select a country"
    );
  });

  it("returns correct placeholder for state level", () => {
    expect(
      getPlaceholderForLevel(testOptions, ["us"], 1, typePlaceholders)
    ).toBe("Select a state");
  });

  it("returns correct placeholder for province level", () => {
    expect(
      getPlaceholderForLevel(testOptions, ["ca"], 1, typePlaceholders)
    ).toBe("Select a province");
  });

  it("returns correct placeholder for city level", () => {
    expect(
      getPlaceholderForLevel(testOptions, ["us", "ca"], 2, typePlaceholders)
    ).toBe("Select a city");
  });

  it("returns fallback placeholder for unknown type", () => {
    expect(
      getPlaceholderForLevel(testOptions, ["invalid"], 1, typePlaceholders)
    ).toBe("Select an option");
  });
});

describe("shouldDisableLevel", () => {
  it("never disables level 0", () => {
    expect(shouldDisableLevel([], 0)).toBe(false);
  });

  it("disables level 1 when level 0 is not selected", () => {
    expect(shouldDisableLevel([], 1)).toBe(true);
  });

  it("enables level 1 when level 0 is selected", () => {
    expect(shouldDisableLevel(["us"], 1)).toBe(false);
  });

  it("disables level 2 when level 1 is not selected", () => {
    expect(shouldDisableLevel(["us"], 2)).toBe(true);
  });

  it("enables level 2 when levels 0 and 1 are selected", () => {
    expect(shouldDisableLevel(["us", "ca"], 2)).toBe(false);
  });
});

describe("calculateVisibleLevels", () => {
  it("shows at least one level when nothing is selected", () => {
    expect(calculateVisibleLevels(testOptions, [])).toBe(1);
  });

  it("shows two levels when country is selected", () => {
    expect(calculateVisibleLevels(testOptions, ["us"])).toBe(2);
  });

  it("shows three levels when country and state are selected", () => {
    expect(calculateVisibleLevels(testOptions, ["us", "ca"])).toBe(3);
  });

  it("shows only three levels when all are selected (no more levels available)", () => {
    expect(calculateVisibleLevels(testOptions, ["us", "ca", "la"])).toBe(3);
  });

  it("handles invalid selection path", () => {
    expect(calculateVisibleLevels(testOptions, ["invalid"])).toBe(1);
  });
});

describe("getSelectionPath", () => {
  it("returns empty array for empty selection", () => {
    const result = getSelectionPath(testOptions, []);
    expect(result).toEqual([]);
  });

  it("returns correct path for country selection", () => {
    const result = getSelectionPath(testOptions, ["us"]);
    expect(result.length).toBe(1);
    expect(result[0]).toBe(testOptions[0]); // Direct reference to the original option
    expect(result[0].label).toBe("United States");
    expect(result[0].type).toBe("country");
  });

  it("returns correct path for country and state selection", () => {
    const result = getSelectionPath(testOptions, ["us", "ca"]);
    expect(result.length).toBe(2);
    expect(result[0]).toBe(testOptions[0]);
    expect(result[1]).toBe(testOptions[0].children![0]); // Direct reference to the original option
    expect(result[0].label).toBe("United States");
    expect(result[1].label).toBe("California");
  });

  it("returns correct path for full selection", () => {
    const result = getSelectionPath(testOptions, ["us", "ca", "la"]);
    expect(result.length).toBe(3);
    expect(result[0]).toBe(testOptions[0]);
    expect(result[1]).toBe(testOptions[0].children![0]);
    expect(result[2]).toBe(testOptions[0].children![0].children![0]); // Direct reference
    expect(result[2].label).toBe("Los Angeles");
  });

  it("handles invalid selection by returning valid portion of path", () => {
    const result = getSelectionPath(testOptions, [
      "us",
      "invalid",
      "something",
    ]);
    expect(result.length).toBe(1);
    expect(result[0]).toBe(testOptions[0]);
  });
});
