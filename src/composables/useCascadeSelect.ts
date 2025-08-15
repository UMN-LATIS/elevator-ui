import { MultiSelectWidgetContent, SelectOption } from "@/types";
import { isObject } from "@vueuse/core";
import invariant from "tiny-invariant";
import { computed, MaybeRefOrGetter, toValue, reactive, toRefs } from "vue";

export interface NestedOptionsObj {
  [category: string]: string[] | Record<string, NestedOptionsObj | []>;
}

export interface Level {
  id: string;
  label: string;
  depth: number;
}

// tree node
export interface FlatOption {
  id: string | number;
  depth: Level["depth"];
  value: string | number;
  parentId: FlatOption["id"] | null;
}

export type OptionsLookup = Map<FlatOption["id"], FlatOption>;
export type LevelLookup = Map<Level["id"], Level>;

const toAlphaNum = (str: string) => str.replace(/[^a-zA-Z0-9]/g, "");

// recursively converts nested options to a flat list of options
// returns a lookup of levels an a lookup of options
function toFlatOptionsAndLevels(
  nestedOptions: NestedOptionsObj,
  levelDepth = 0,
  parentId: FlatOption["id"] | null = null
) {
  const levelLookup: Map<Level["id"], Level> = new Map();
  const optionsLookup: Map<FlatOption["id"], FlatOption> = new Map();

  // get the levels from the nested options
  const levelLabel = Object.keys(nestedOptions)[0];

  // if no level label, we're done
  if (!levelLabel) {
    return { levelLookup, optionsLookup };
  }

  // otherwise, add the current level to the lookup
  const levelId = toAlphaNum(levelLabel).toLowerCase();
  const level: Level = {
    id: levelId,
    label: levelLabel,
    depth: levelDepth,
  };
  levelLookup.set(levelId, level);

  // then proces each option at this level
  const options = nestedOptions[levelLabel];

  // CASE 1: options is an array of strings
  if (Array.isArray(options)) {
    options.forEach((option) => {
      const optionId = `${levelId}-${toAlphaNum(option).toLowerCase()}`;
      const flatOption: FlatOption = {
        id: optionId,
        depth: levelDepth,
        value: option,
        parentId,
      };
      optionsLookup.set(optionId, flatOption);
    });

    // an array means we're done with this level
    return { levelLookup, optionsLookup };
  }

  // CASE 2: options is an object with nested options
  if (isObject(options)) {
    Object.entries(options).forEach(([value, moreNestedOptions]) => {
      // add this option to the lookup
      const optionId = `${levelId}-${toAlphaNum(value).toLowerCase()}`;
      const flatOption: FlatOption = {
        id: optionId,
        depth: levelDepth,
        value,
        parentId,
      };
      optionsLookup.set(optionId, flatOption);

      // then recursively process the nested options
      // if the nested options is an array, it means we're done with this level
      if (Array.isArray(moreNestedOptions)) {
        return;
      }

      // otherwise, recurse into the nested options
      const {
        levelLookup: nestedLevelLookup,
        optionsLookup: nestedOptionsLookup,
      } = toFlatOptionsAndLevels(moreNestedOptions, levelDepth + 1, optionId);

      // merge the nested lookups into the main lookups
      nestedLevelLookup.forEach((lvl) => levelLookup.set(lvl.id, lvl));
      nestedOptionsLookup.forEach((opt) => optionsLookup.set(opt.id, opt));

      return {
        levelLookup,
        optionsLookup,
      };
    });
  }

  // if we reach here, it means we have processed all options at this level
  return { levelLookup, optionsLookup };
}

export const useCascadeSelect = (
  nestedOptions: MaybeRefOrGetter<NestedOptionsObj>
) => {
  const state = reactive({
    selectedOption: null as FlatOption | null,
  });

  const lookups = computed(() => {
    return toFlatOptionsAndLevels(toValue(nestedOptions));
  });

  const levelLookup = computed((): LevelLookup => {
    return lookups.value.levelLookup;
  });

  const optionsLookup = computed((): OptionsLookup => {
    return lookups.value.optionsLookup;
  });

  const selectedPath = computed((): FlatOption[] => {
    if (!state.selectedOption) {
      return [];
    }
    const path: FlatOption[] = [];
    let currentOption: FlatOption | null = state.selectedOption;
    // climb down the tree to the root to build the path
    while (currentOption) {
      path.unshift(currentOption);
      currentOption = currentOption.parentId
        ? optionsLookup.value.get(currentOption.parentId) || null
        : null;
    }
    return path;
  });

  const getOptionsByParentId = (parentId: FlatOption["id"] | null) => {
    return flatOptions.value.filter((option) => option.parentId === parentId);
  };

  const getLabelForOption = (option: FlatOption) => {
    const label = getLevelByDepth(option.depth)?.label;
    invariant(label, `No level found for depth ${option.depth}`);
    return label;
  };

  const currentSelectOptions = computed((): SelectOption<string | number>[] => {
    const currentParentId = state.selectedOption?.parentId ?? null;
    // get the options that are children of the selected option
    return getOptionsByParentId(currentParentId).map((option) => ({
      id: option.id,
      label: String(option.value),
    }));
  });

  const nextSelectOptions = computed((): SelectOption<string | number>[] => {
    // if no selected option, return empty array
    return getOptionsByParentId(state.selectedOption?.id ?? null).map(
      (option) => ({
        id: option.id,
        label: String(option.value),
      })
    );
  });

  // Derived computeds that can reference the base ones
  const getLevel = (levelId: Level["id"]) => {
    return levelLookup.value.get(levelId) || null;
  };

  const widgetFieldContents = computed(() => {
    if (!state.selectedOption) {
      return null;
    }

    return selectedPath.value.reduce((acc, opt) => {
      // get label for opt
      const label = getLabelForOption(opt);

      // widget content keys are alphanumeric version of
      // the level label (spaces and special characters removed
      // so that they can be persisted in a database)
      const widgetContentKey = toAlphaNum(label).toLowerCase();
      return {
        ...acc,
        [widgetContentKey]: opt.value,
      };
    }, {} as MultiSelectWidgetContent["fieldContents"]);
  });

  const flatOptions = computed((): FlatOption[] => {
    return Array.from(optionsLookup.value.values()).sort(
      (a: FlatOption, b: FlatOption) => {
        if (a.depth !== b.depth) {
          // ascending level
          return a.depth - b.depth;
        }
        // ascending value
        return String(a.value).localeCompare(String(b.value));
      }
    );
  });

  const levels = computed((): Level[] => {
    return Array.from(levelLookup.value.values()).sort((a, b) => {
      // ascending depth
      return a.depth - b.depth;
    });
  });

  const getLevelByDepth = (depth: Level["depth"]) => {
    return levels.value.find((level) => level.depth === depth);
  };

  const getOptionsByLevelId = (level: Level["id"]) => {
    return flatOptions.value.filter(
      (option) => option.depth === levelLookup.value.get(level)?.depth
    );
  };

  const getOptionsByDepth = (depth: Level["depth"]): FlatOption[] => {
    const level = getLevelByDepth(depth);
    if (!level) {
      return [];
    }
    return getOptionsByLevelId(level.id);
  };

  const getOption = (optionId: FlatOption["id"]) => {
    return optionsLookup.value.get(optionId) || null;
  };

  const actions = {
    selectOption(optionId: FlatOption["id"] | null) {
      if (!optionId) {
        state.selectedOption = null;
        return;
      }
      const option = getOption(optionId);
      if (option) {
        state.selectedOption = option;
      }
    },

    selectOptionByPath(path: FlatOption[]) {
      if (path.length === 0) {
        state.selectedOption = null;
        return;
      }
      const lastOptionInPath = path[path.length - 1];
      const option = getOption(lastOptionInPath.id);
      if (option) {
        state.selectedOption = option;
      }
    },

    clearSelection() {
      state.selectedOption = null;
    },

    selectOptionByWidgetFieldContents(
      fieldContents: MultiSelectWidgetContent["fieldContents"]
    ) {
      if (!fieldContents) {
        state.selectedOption = null;
        return;
      }

      // normalize the field content keys to lowercase
      // alphanumeric strings
      const normFieldContents: Record<string, string | number> = {};
      for (const key in fieldContents) {
        const normKey = toAlphaNum(key).toLowerCase();
        normFieldContents[normKey] = fieldContents[key];
      }

      // iterate over levels in order of depth
      const path: FlatOption[] = [];
      let parentId: FlatOption["id"] | null = null;

      // note that levels are already sorted by depth
      for (const level of levels.value) {
        // the field contents key is the level label converted to alphanumeric
        const normFieldContentsKey = toAlphaNum(level.label).toLowerCase();

        const valueAtLevel = normFieldContents[normFieldContentsKey];

        // if there's no value for this level, we're done
        if (!valueAtLevel) {
          break;
        }

        // now find the option in this level that matches the value and parentId
        const options = getOptionsByParentId(parentId);
        const matchingOption = options.find(
          (opt) => opt.value === valueAtLevel
        );

        // if no matching option, we can't continue, so break
        if (!matchingOption) {
          break;
        }

        // add the matching option to the path
        path.push(matchingOption);
        // update parentId for the next level
        parentId = matchingOption.id;
      }

      // the last option in the constructed path is the selected option
      actions.selectOptionByPath(path);
    },
  };

  // wrapping in reactive to auto-unwrap refs
  return reactive({
    ...toRefs(state),
    flatOptions,
    levels,
    selectedPath,
    widgetFieldContents,
    currentSelectOptions,
    nextSelectOptions,
    getLevel,
    getLevelByDepth,
    getOption,
    getOptionsByLevelId,
    getOptionsByDepth,
    getOptionsByParentId,
    ...actions,
  });
};
