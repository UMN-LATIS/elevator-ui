import { MultiSelectWidgetContent, SelectOption } from "@/types";
import { isObject } from "@vueuse/core";
import invariant from "tiny-invariant";
import { computed, MaybeRefOrGetter, toValue, reactive, toRefs } from "vue";

export interface NestedOptionsObj {
  [category: string]: string[] | Record<string, NestedOptionsObj | []>;
}
// Example:
// { Country: { usa: { State: { mn: [], wi: [] } }, canada: { State: ["quebec"] } } }

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
const createOptionId = (
  rawValue: string | number,
  parentId: string | number | null = null
) => {
  const valueId = toAlphaNum(String(rawValue)).toLowerCase();
  return parentId !== null ? `${parentId}-${valueId}` : valueId;
};

/**
 * Recursively converts a nested options structure into flat lookups for:
 *  - levels (category metadata per depth)
 *  - options (each concrete selectable value with parent linkage)
 *
 *  Each branching object layer has exactly one "category label" key whose value
 *  is either an array of terminal option strings OR an object whose keys are
 *  option values and whose values are the next category object (again with a
 *  single key) or an empty array to terminate that branch.
 */
function toFlatOptionsAndLevels(
  nestedOptions: NestedOptionsObj,
  levelDepth = 0,
  parentId: FlatOption["id"] | null = null
): { levelLookup: LevelLookup; optionsLookup: OptionsLookup } {
  const levelLookup: Map<Level["id"], Level> = new Map();
  const optionsLookup: Map<FlatOption["id"], FlatOption> = new Map();

  const levelLabel = Object.keys(nestedOptions)[0];
  if (!levelLabel) return { levelLookup, optionsLookup };

  const levelId = toAlphaNum(levelLabel).toLowerCase();
  const level: Level = { id: levelId, label: levelLabel, depth: levelDepth };
  levelLookup.set(levelId, level);

  const options = nestedOptions[levelLabel];

  if (Array.isArray(options)) {
    for (const option of options) {
      const optionId = createOptionId(option, parentId);
      optionsLookup.set(optionId, {
        id: optionId,
        depth: levelDepth,
        value: option,
        parentId,
      });
    }
    return { levelLookup, optionsLookup };
  }

  if (isObject(options)) {
    for (const [value, moreNestedOptions] of Object.entries(options)) {
      const optionId = createOptionId(value, parentId);
      optionsLookup.set(optionId, {
        id: optionId,
        depth: levelDepth,
        value,
        parentId,
      });

      if (!Array.isArray(moreNestedOptions)) {
        const {
          levelLookup: nestedLevelLookup,
          optionsLookup: nestedOptionsLookup,
        } = toFlatOptionsAndLevels(moreNestedOptions, levelDepth + 1, optionId);
        nestedLevelLookup.forEach((lvl) => levelLookup.set(lvl.id, lvl));
        nestedOptionsLookup.forEach((opt) => optionsLookup.set(opt.id, opt));
      }
    }
  }

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
    // climb up the tree to the root to build the path
    while (currentOption) {
      path.unshift(currentOption);
      currentOption = currentOption.parentId
        ? optionsLookup.value.get(currentOption.parentId) || null
        : null;
    }
    return path;
  });

  const getOptionsByParentId = (
    parentId: FlatOption["id"] | null
  ): FlatOption[] =>
    flatOptions.value.filter((option) => option.parentId === parentId);

  const getLabelForOption = (option: FlatOption) => {
    const label = getLevelByDepth(option.depth)?.label;
    invariant(label, `No level found for depth ${option.depth}`);
    return label;
  };

  const currentSelectOptions = computed((): SelectOption<string | number>[] => {
    const currentParentId = state.selectedOption?.parentId ?? null;
    // get the options that are children of the selected option
    return getOptionsByParentId(currentParentId).map(mapOptionToSelect);
  });

  const nextSelectOptions = computed((): SelectOption<string | number>[] => {
    // if no selected option, return empty array
    return getOptionsByParentId(state.selectedOption?.id ?? null).map(
      mapOptionToSelect
    );
  });

  // Derived computeds that can reference the base ones
  const getLevel = (levelId: Level["id"]): Level | null =>
    levelLookup.value.get(levelId) || null;

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

  const flatOptions = computed((): FlatOption[] =>
    Array.from(optionsLookup.value.values()).sort((a, b) =>
      a.depth === b.depth
        ? String(a.value).localeCompare(String(b.value))
        : a.depth - b.depth
    )
  );

  const levels = computed((): Level[] =>
    Array.from(levelLookup.value.values()).sort((a, b) => a.depth - b.depth)
  );

  const getLevelByDepth = (depth: Level["depth"]): Level | undefined =>
    levels.value.find((level) => level.depth === depth);

  const getOptionsByLevelId = (level: Level["id"]): FlatOption[] =>
    flatOptions.value.filter(
      (option) => option.depth === levelLookup.value.get(level)?.depth
    );

  const getOptionsByDepth = (depth: Level["depth"]): FlatOption[] => {
    const level = getLevelByDepth(depth);
    return level ? getOptionsByLevelId(level.id) : [];
  };

  const getOption = (optionId: FlatOption["id"]): FlatOption | null =>
    optionsLookup.value.get(optionId) || null;

  const mapOptionToSelect = (
    option: FlatOption
  ): SelectOption<string | number> => ({
    id: option.id,
    label: String(option.value),
  });

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
