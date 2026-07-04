<template>
  <div class="w-full">
    <AutoCompleteInput
      :id="id"
      :modelValue="searchText"
      :items="suggestions"
      :isLoading="loading"
      :placeholder="placeholder"
      :minChars="MIN_SEARCH_CHARS"
      @update:modelValue="handleSearchInput"
      @focus="handleFocus"
      @select="selectSuggestion">
      <template #option="{ item }">{{ item.text }}</template>
    </AutoCompleteInput>

    <div v-if="error" class="mt-1 text-sm text-error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, useId } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { AutoCompleteInput } from "@/components/AutoCompleteInput";
import { GeocoderResult } from "@/types";

interface Suggestion {
  text: string;
  magicKey: string;
}

interface SuggestResponse {
  suggestions?: Suggestion[];
}

interface FindAddressCandidatesResponse {
  candidates?: { location: { x: number; y: number } }[];
}

const MIN_SEARCH_CHARS = 3;

const props = withDefaults(
  defineProps<{
    id?: string;
    apiKey: string;
    placeholder?: string;
    initialValue?: string;
  }>(),
  {
    id: () => useId(),
    placeholder: "Search for an address",
    initialValue: "",
  }
);

const emit = defineEmits<{
  (e: "select", coordinates: GeocoderResult): void;
}>();

const searchText = ref(props.initialValue);
const suggestions = ref<Suggestion[]>([]);
const loading = ref(false);
const error = ref("");

watch(
  () => props.initialValue,
  (newValue) => {
    searchText.value = newValue;
  }
);

// Check the threshold when the debounce fires, not when typing starts,
// so deleting back below it clears stale suggestions instead of fetching.
const debouncedSuggest = useDebounceFn((): void => {
  if (searchText.value.trim().length >= MIN_SEARCH_CHARS) {
    fetchSuggestions();
  } else {
    suggestions.value = [];
  }
}, 300);

function handleSearchInput(value: string): void {
  searchText.value = value;
  error.value = "";
  debouncedSuggest();
}

// Refocusing with searchable text would otherwise open an empty dropdown
// claiming no suggestions, so search for the current text instead.
function handleFocus(): void {
  const hasSearchableText = searchText.value.trim().length >= MIN_SEARCH_CHARS;
  if (hasSearchableText && suggestions.value.length === 0) {
    error.value = "";
    fetchSuggestions();
  }
}

async function fetchSuggestions(): Promise<void> {
  loading.value = true;

  try {
    const suggestUrl =
      "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest";

    const params = new URLSearchParams({
      f: "json",
      text: searchText.value,
      maxSuggestions: "5",
      token: props.apiKey,
    });

    const response = await fetch(`${suggestUrl}?${params}`);
    const data: SuggestResponse = await response.json();

    suggestions.value = data.suggestions ?? [];
  } catch (err) {
    console.error("Error fetching suggestions:", err);
    error.value = "Failed to fetch address suggestions";
    suggestions.value = [];
  } finally {
    loading.value = false;
  }
}

async function selectSuggestion(suggestion: Suggestion): Promise<void> {
  suggestions.value = [];
  loading.value = true;
  error.value = "";

  try {
    const url =
      "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates";

    const params = new URLSearchParams({
      f: "json",
      singleLine: suggestion.text,
      magicKey: suggestion.magicKey,
      outFields: "Match_addr,Addr_type",
      token: props.apiKey,
    });

    const response = await fetch(`${url}?${params}`);
    const data: FindAddressCandidatesResponse = await response.json();
    const candidate = data.candidates?.[0];

    if (candidate) {
      emit("select", {
        lng: candidate.location.x,
        lat: candidate.location.y,
        address: suggestion.text,
      });
    } else {
      error.value = "No results found for this address";
    }
  } catch (err) {
    console.error("Error geocoding address:", err);
    error.value = "Error searching for address";
  } finally {
    loading.value = false;
    searchText.value = "";
  }
}
</script>
