<template>
  <section class="my-4">
    <header class="flex items-baseline gap-2">
      <h3 class="font-bold">Fields</h3>
      <!-- <Button variant="tertiary"> clear </Button> -->
    </header>

    <div>
      {{ searchStore.filterBy.searchableFields }}
    </div>

    <DropDown
      v-if="instanceStore.searchableFields.length"
      label="Add Field"
      class="inline-flex border border-neutral-900 rounded-md"
      alignment="left"
      labelClass="p-2 !pr-0"
    >
      <div class="max-h-[50vh] overflow-y-auto">
        <DropDownItem
          v-for="field in instanceStore.searchableFields"
          :key="field.id"
          @click="
            searchStore.addSearchableFieldFilter({
              ...field,
              value: '',
              isFuzzy: false,
            })
          "
        >
          {{ field.label }}
        </DropDownItem>
      </div>
    </DropDown>
  </section>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/Button/Button.vue";
import { XIcon } from "@/icons";
import { useSearchStore } from "@/stores/searchStore";
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import { useInstanceStore } from "@/stores/instanceStore";

const instanceStore = useInstanceStore();
const searchStore = useSearchStore();
</script>
<style scoped></style>
