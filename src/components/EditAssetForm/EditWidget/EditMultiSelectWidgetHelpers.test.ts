import { Option } from "@/components/CascadeSelect2/CascadeSelect.vue";
import {
  toCascadeSelectOptions,
  toCascadeSelectPath,
  toMultiSelectFieldContents,
} from "@/components/EditAssetForm/EditWidget/EditMultiSelectWidgetHelpers";
import { MultiSelectWidgetContent, MultiSelectWidgetProps } from "@/types";
import { describe, it, expect } from "vitest";

describe("toCascadeSelectOptions", () => {
  it("transforms empty object into empty array", () => {
    expect(toCascadeSelectOptions({})).toEqual([]);
  });

  it("transforms simple object into array of options", () => {
    expect(
      toCascadeSelectOptions({
        country: ["usa", "canada"],
      })
    ).toEqual([
      {
        type: "country",
        label: "usa",
        value: "usa",
      },
      {
        type: "country",
        label: "canada",
        value: "canada",
      },
    ]);
  });

  it("transforms a nested object into array of options", () => {
    const nestedObject = {
      country: {
        usa: {
          state: ["mn", "wi"],
        },
        canada: {
          state: ["qc", "ab"],
        },
      },
    };

    const expectedOptions = [
      {
        type: "country",
        label: "usa",
        value: "usa",
        children: [
          { type: "state", label: "mn", value: "mn" },
          { type: "state", label: "wi", value: "wi" },
        ],
      },
      {
        type: "country",
        label: "canada",
        value: "canada",
        children: [
          { type: "state", label: "qc", value: "qc" },
          { type: "state", label: "ab", value: "ab" },
        ],
      },
    ];

    expect(toCascadeSelectOptions(nestedObject)).toEqual(expectedOptions);
  });

  it("transforms multiselect widget def fieldData (options object) into cascade select options", () => {
    const widgetDefFieldData: MultiSelectWidgetProps["fieldData"] = {
      country: {
        usa: {
          state: {
            minnesota: {
              city: {
                mankato: { neighborhood: ["campus", "downtown"] },
                minneapolis: { neighborhood: ["uptown", "downtown"] },
              },
            },
            wisconsin: { city: ["madison", "milwaukee"] },
          },
        },
        canada: {
          state: {
            quebec: { city: ["montreal"] },
            alberta: { city: ["fakeville", "faketown"] },
          },
        },
      },
    };

    const expectedOptions: Option[] = [
      {
        type: "country",
        label: "usa",
        value: "usa",
        children: [
          {
            type: "state",
            label: "minnesota",
            value: "minnesota",
            children: [
              {
                type: "city",
                label: "mankato",
                value: "mankato",
                children: [
                  { type: "neighborhood", label: "campus", value: "campus" },
                  {
                    type: "neighborhood",
                    label: "downtown",
                    value: "downtown",
                  },
                ],
              },
              {
                type: "city",
                label: "minneapolis",
                value: "minneapolis",
                children: [
                  { type: "neighborhood", label: "uptown", value: "uptown" },
                  {
                    type: "neighborhood",
                    label: "downtown",
                    value: "downtown",
                  },
                ],
              },
            ],
          },
          {
            type: "state",
            label: "wisconsin",
            value: "wisconsin",
            children: [
              { type: "city", label: "madison", value: "madison" },
              { type: "city", label: "milwaukee", value: "milwaukee" },
            ],
          },
        ],
      },
      {
        type: "country",
        label: "canada",
        value: "canada",
        children: [
          {
            type: "state",
            label: "quebec",
            value: "quebec",
            children: [{ type: "city", label: "montreal", value: "montreal" }],
          },
          {
            type: "state",
            label: "alberta",
            value: "alberta",
            children: [
              { type: "city", label: "fakeville", value: "fakeville" },
              { type: "city", label: "faketown", value: "faketown" },
            ],
          },
        ],
      },
    ];

    expect(toCascadeSelectOptions(widgetDefFieldData)).toEqual(expectedOptions);
  });
});

describe("toCascadeSelectPath", () => {
  const widgetDefFieldData: MultiSelectWidgetProps["fieldData"] = {
    country: {
      usa: {
        state: {
          minnesota: {
            city: {
              mankato: { neighborhood: ["campus", "downtown"] },
              minneapolis: { neighborhood: ["uptown", "downtown"] },
            },
          },
          wisconsin: { city: ["madison", "milwaukee"] },
        },
      },
      canada: {
        state: {
          quebec: { city: ["montreal"] },
          alberta: { city: ["fakeville", "faketown"] },
        },
      },
    },
  };

  it("transforms empty field contents to an empty path", () => {
    const fieldContents: MultiSelectWidgetContent["fieldContents"] = {};
    const expectedPath: string[] = [];
    expect(toCascadeSelectPath(widgetDefFieldData, fieldContents)).toEqual(
      expectedPath
    );
  });

  it("transforms field contents to a path", () => {
    expect(
      toCascadeSelectPath(widgetDefFieldData, {
        country: "usa",
      })
    ).toEqual(["usa"]);

    expect(
      toCascadeSelectPath(widgetDefFieldData, {
        country: "usa",
        state: "minnesota",
      })
    ).toEqual(["usa", "minnesota"]);
  });

  it("does not care about order of keys in fieldContents", () => {
    expect(
      toCascadeSelectPath(widgetDefFieldData, {
        state: "minnesota",
        country: "usa",
      })
    ).toEqual(["usa", "minnesota"]);
  });

  it("should handle empty string values in fieldContents", () => {
    const fieldContents: MultiSelectWidgetContent["fieldContents"] = {
      city: "faketown",
      state: "alberta",
      country: "canada",
      neighborhood: "",
    };
    const expectedPath: string[] = ["canada", "alberta", "faketown"];
    expect(toCascadeSelectPath(widgetDefFieldData, fieldContents)).toEqual(
      expectedPath
    );
  });
});

describe("toMultiSelectFieldContents", () => {
  const widgetDefFieldData: MultiSelectWidgetProps["fieldData"] = {
    country: {
      usa: {
        state: {
          minnesota: {
            city: {
              mankato: { neighborhood: ["campus", "downtown"] },
              minneapolis: { neighborhood: ["uptown", "downtown"] },
            },
          },
          wisconsin: { city: ["madison", "milwaukee"] },
        },
      },
      canada: {
        state: {
          quebec: { city: ["montreal"] },
          alberta: { city: ["fakeville", "faketown"] },
        },
      },
    },
  };
  it("transforms a path of values into field contents object", () => {
    const pathOfValues = ["usa", "minnesota", "mankato", "campus"];
    const expectedFieldContents: MultiSelectWidgetContent["fieldContents"] = {
      country: "usa",
      state: "minnesota",
      city: "mankato",
      neighborhood: "campus",
    };
    expect(
      toMultiSelectFieldContents(widgetDefFieldData, pathOfValues)
    ).toEqual(expectedFieldContents);
  });
});
