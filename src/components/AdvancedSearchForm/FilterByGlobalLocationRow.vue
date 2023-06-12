<template>
  <div
    class="filter-row"
    :class="{
      'filter-row--is-only-row': searchStore.totalFieldFilterCount === 1,
      'filter-row--is-first-row': rowIndex === 0,
    }"
  >
    <Button
      class="text-xs filter-row__operator"
      variant="tertiary"
      type="button"
      @click="handleSearchOperatorClick"
    >
      {{ searchOperator }}
    </Button>
    <p class="filter-row__name text-sm p-2">Any Location</p>

    <div class="filter-row__value flex flex-col gap-2">
      <div>
        <InputGroup
          v-if="searchStore.filterBy.globalLocation"
          id="filter-by-location-lng"
          :modelValue="searchStore.filterBy.globalLocation.lng.toString()"
          class="text-sm"
          inputClass="!bg-white !border !border-neutral-200"
          label="Longitude"
          placeholder="Longitude"
          @update:modelValue="handleLngUpdate"
        />
        <p v-if="isLngTouched && !isLngValid" class="text-xs text-red-500 mt-1">
          Longitude must be between -180 and 180
        </p>
      </div>
      <div>
        <InputGroup
          v-if="searchStore.filterBy.globalLocation"
          id="filter-by-location-lat"
          :modelValue="searchStore.filterBy.globalLocation.lat.toString()"
          class="text-sm"
          inputClass="!bg-white !border !border-neutral-200"
          label="Latitude"
          placeholder="Latitude"
          @update:modelValue="handleLatUpdate"
        />
        <p v-if="isLatTouched && !isLatValid" class="text-xs text-red-500 mt-2">
          Latitude must be between -90 and 90
        </p>
      </div>
      <div>
        <InputGroup
          v-if="searchStore.filterBy.globalLocation"
          id="filter-by-location-radius"
          :modelValue="searchStore.filterBy.globalLocation.radius.toString()"
          class="text-sm"
          inputClass="!bg-white !border !border-neutral-200"
          label="Within Radius"
          placeholder="Within Radius"
          @update:modelValue="handleRadiusUpdate"
        >
          <template #append>
            <button
              class="text-xs text-neutral-400 uppercase pr-2 cursor-default"
              type="button"
              @click="focusRadiusInput"
            >
              miles
            </button>
          </template>
        </InputGroup>
        <p
          v-if="isRadiusTouched && !isRadiusValid"
          class="text-xs text-red-500 mt-2"
        >
          Radius must be between 0 and 1000
        </p>
      </div>
    </div>

    <button
      class="filter-row__remove py-2 self-start w-full flex items-center justify-center"
      type="button"
      @click="handleRemoveFilter"
    >
      <CircleXIcon class="!w-5 !h-5" />
    </button>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import Button from "@/components/Button/Button.vue";
import { CircleXIcon } from "@/icons";
import { useSearchStore } from "@/stores/searchStore";
import InputGroup from "@/components/InputGroup/InputGroup.vue";

defineProps<{
  rowIndex: number;
}>();

const searchStore = useSearchStore();

const searchOperator = computed(
  () => searchStore.filterBy.searchableFieldsOperator
);

const isLatTouched = ref(false);
const isLngTouched = ref(false);
const isRadiusTouched = ref(false);

const isLatValid = computed(() => {
  const lat = parseFloat(searchStore.filterBy.globalLocation?.lat ?? "");
  if (isNaN(lat)) return false;
  return lat && lat >= -90 && lat <= 90;
});

const isLngValid = computed(() => {
  const lng = parseFloat(searchStore.filterBy.globalLocation?.lng ?? "");
  if (isNaN(lng)) return false;
  return lng && lng >= -180 && lng <= 180;
});

const isRadiusValid = computed(() => {
  const radius = parseFloat(searchStore.filterBy.globalLocation?.radius ?? "");
  if (isNaN(radius)) return false;
  return radius && radius > 0;
});

function focusRadiusInput() {
  // if Miles label is clicked, focus the input
  document
    .querySelector<HTMLInputElement>("#filter-by-location-radius")
    ?.focus();
}

function handleLngUpdate(newLng: string) {
  isLngTouched.value = true;
  searchStore.updateLocationFilter({
    lng: newLng,
  });
}

function handleLatUpdate(newLat: string) {
  isLatTouched.value = true;
  searchStore.updateLocationFilter({
    lat: newLat,
  });
}

function handleRadiusUpdate(newRadius: string) {
  isRadiusTouched.value = true;
  searchStore.updateLocationFilter({
    radius: newRadius,
  });
}

function handleSearchOperatorClick() {
  const currentOperator = searchStore.filterBy.searchableFieldsOperator;
  const newOperator = currentOperator === "AND" ? "OR" : "AND";
  searchStore.updateSearchableFieldsOperator(newOperator);
}

function handleRemoveFilter() {
  searchStore.removeLocationFilter();
}
</script>
<style scoped>
.filter-row {
  display: grid;
  grid-template-areas: "operator name value is-fuzzy remove";
  grid-template-columns: 2rem 1fr 2fr 3rem 2rem;
  align-items: baseline;
  gap: 0.25rem;
}

@media (max-width: 30rem) {
  .filter-row {
    grid-template-areas:
      "operator name is-fuzzy remove"
      ". value . .";
    grid-template-columns: 2rem 1fr 3rem 2rem;
  }
}

.filter-row--is-only-row {
  grid-template-areas: "name value is-fuzzy remove";
  grid-template-columns: 1fr 2fr 3rem 2rem;
}

.filter-row--is-first-row .filter-row__operator {
  display: none;
}

.filter-row__operator {
  grid-area: operator;
}
.filter-row__name {
  grid-area: name;
}

.filter-row__value {
  grid-area: value;
}

.filter-row__is-fuzzy {
  grid-area: is-fuzzy;
}

.filter-row__remove {
  grid-area: remove;
  justify-self: end;
}
</style>
