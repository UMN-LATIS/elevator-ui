import { MultiSelectWidgetContent } from "@/types";
import { isObject } from "@vueuse/core";
import {
  computed,
  MaybeRefOrGetter,
  ref,
  toValue,
  reactive,
  toRefs,
} from "vue";

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
  id: string;
  level: number;
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
        level: levelDepth,
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
        level: levelDepth,
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

  const getters = {
    lookups: computed(() => {
      return toFlatOptionsAndLevels(toValue(nestedOptions));
    }),

    levelLookup: computed((): LevelLookup => {
      return getters.lookups.value.levelLookup;
    }),

    optionsLookup: computed((): OptionsLookup => {
      return getters.lookups.value.optionsLookup;
    }),

    widgetFieldContents: computed(() => {
      if (!state.selectedOption) {
        return null;
      }

      return getters.convertOptionToWidgetFieldContentsObject(
        state.selectedOption
      );
    }),
    flatOptions: computed((): FlatOption[] => {
      const optionsLookup: OptionsLookup = getters.optionsLookup.value;
      return Array.from(optionsLookup.values()).sort(
        (a: FlatOption, b: FlatOption) => {
          if (a.level !== b.level) {
            // ascending level
            return a.level - b.level;
          }
          // ascending value
          return String(a.value).localeCompare(String(b.value));
        }
      );
    }),

    levels: computed((): Level[] => {
      const levelLookup: LevelLookup = getters.levelLookup.value;
      return Array.from(levelLookup.values()).sort((a, b) => {
        // ascending depth
        return a.depth - b.depth;
      });
    }),

    getLevelByDepth: (depth: Level["depth"]) => {
      return getters.levels.value.find((level) => level.depth === depth);
    },

    getOptionsByLevelId: (level: Level["id"]) => {
      const levelLookup = getters.levelLookup.value;
      return getters.flatOptions.value.filter(
        (option) => option.level === levelLookup.get(level)?.depth
      );
    },

    getOptionsByDepth: (depth: Level["depth"]) => {
      const level = getters.getLevelByDepth(depth);
      if (!level) {
        return [];
      }
      return getters.getOptionsByLevelId(level.id);
    },

    getOptionsByParentId: (parentId: FlatOption["id"] | null) => {
      return getters.flatOptions.value.filter(
        (option) => option.parentId === parentId
      );
    },

    getSelectedPath: (selectedOption: FlatOption | null) => {
      if (!selectedOption) {
        return [];
      }
      const optionsLookup = getters.optionsLookup.value;
      const path: FlatOption[] = [];
      let currentOption: FlatOption | null = selectedOption;
      while (currentOption) {
        // climb down the tree to the root to build the path
        path.unshift(currentOption);
        currentOption = currentOption.parentId
          ? optionsLookup.get(currentOption.parentId) || null
          : null;
      }
      return path;
    },

    convertOptionToWidgetFieldContentsObject: (
      option: FlatOption
    ): MultiSelectWidgetContent["fieldContents"] => {
      return getters.getSelectedPath(option).reduce((acc, opt) => {
        acc[opt.level] = acc[opt.level] || [];
        acc[opt.level].push(opt.value);
        return acc;
      }, {} as MultiSelectWidgetContent["fieldContents"]);
    },

    getOptionById: (optionId: FlatOption["id"]) => {
      return getters.getOptionById(optionId) || null;
    },
  };

  const actions = {
    selectOption(optionId: FlatOption["id"]) {
      const option = getters.getOptionById(optionId);
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
      const option = getters.getOptionById(lastOptionInPath.id);
      if (option) {
        state.selectedOption = option;
      }
    },

    clearSelection() {
      state.selectedOption = null;
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
};
