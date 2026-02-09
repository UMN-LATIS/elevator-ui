<template>
  <div class="relative w-full">
    <div class="relative">
      <input
        :id="id"
        v-model="searchText"
        type="text"
        class="w-full px-4 py-2 rounded-md bg-surface-container border border-outline-variant focus:bg-surface-bright text-sm"
        :placeholder="placeholder"
        @input="handleInput"
        @keydown.down.prevent="handleKeyDown"
        @keydown.up.prevent="handleKeyUp"
        @keydown.enter.prevent="selectSuggestion(selectedIndex)"
        @blur="hideSuggestions" />
      <div v-if="loading" class="absolute right-3 top-2.5">
        <SpinnerIcon />
      </div>
    </div>

    <div
      v-if="suggestions.length > 0"
      class="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
      <div
        v-for="(suggestion, index) in suggestions"
        :key="index"
        :class="[
          'px-4 py-2 cursor-pointer hover:bg-gray-100',
          { 'bg-primary-container': index === selectedIndex },
        ]"
        @mousedown="selectSuggestion(index)"
        @mouseover="selectedIndex = index">
        {{ suggestion.text }}
      </div>
    </div>

    <div v-if="error" class="mt-1 text-sm text-error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, useId } from "vue";
import { GeocoderResult } from "@/types";
import { SpinnerIcon } from "@/icons";

interface Suggestion {
  text: string;
  magicKey: string;
}

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
const selectedIndex = ref(-1);
const loading = ref(false);
const error = ref("");
const debounceTimeout = ref<number | null>(null);

// Watch for initialValue changes
watch(
  () => props.initialValue,
  (newValue) => {
    searchText.value = newValue;
  }
);

const handleInput = () => {
  // Clear previous timeout
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value);
  }

  // Set new timeout to fetch suggestions
  debounceTimeout.value = window.setTimeout(() => {
    if (searchText.value.length >= 3) {
      fetchSuggestions();
    } else {
      suggestions.value = [];
    }
  }, 300); // 300ms debounce
};

const fetchSuggestions = async () => {
  loading.value = true;
  error.value = "";

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
    const data = await response.json();

    if (data.suggestions && data.suggestions.length > 0) {
      suggestions.value = data.suggestions.map((suggestion: Suggestion) => ({
        text: suggestion.text,
        magicKey: suggestion.magicKey,
      }));
      selectedIndex.value = -1;
    } else {
      suggestions.value = [];
    }
  } catch (err) {
    console.error("Error fetching suggestions:", err);
    error.value = "Failed to fetch address suggestions";
    suggestions.value = [];
  } finally {
    loading.value = false;
  }
};

const hideSuggestions = () => {
  // Small delay to allow click events to register
  setTimeout(() => {
    suggestions.value = [];
  }, 200);
};

const handleKeyDown = () => {
  if (suggestions.value.length === 0) return;
  selectedIndex.value = (selectedIndex.value + 1) % suggestions.value.length;
};

const handleKeyUp = () => {
  if (suggestions.value.length === 0) return;
  selectedIndex.value =
    selectedIndex.value <= 0
      ? suggestions.value.length - 1
      : selectedIndex.value - 1;
};

const selectSuggestion = async (index: number) => {
  if (index < 0 || index >= suggestions.value.length) return;

  const selectedSuggestion = suggestions.value[index];
  searchText.value = selectedSuggestion.text;
  suggestions.value = [];

  // Get coordinates for the selected suggestion
  await getCoordinatesForSuggestion(selectedSuggestion);
};

const getCoordinatesForSuggestion = async (suggestion: Suggestion) => {
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
    const data = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      const result = {
        lng: data.candidates[0].location.x,
        lat: data.candidates[0].location.y,
        address: suggestion.text,
      };

      emit("select", result);
    } else {
      error.value = "No results found for this address";
    }
  } catch (err) {
    console.error("Error geocoding address:", err);
    error.value = "Error searching for address";
  } finally {
    loading.value = false;
    // Clear search text after successful selection
    searchText.value = "";
  }
};
</script>
