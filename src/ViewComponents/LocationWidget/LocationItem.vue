<template>
  <template v-if="haveLocation">
    <span
      ><a href="#" @click.prevent="show = true">{{ locationLabel }}</a></span
    >
    <Modal @close="show = false" :show="show">
      It's a map!
      {{ latitude }}, {{ longitude }}
    </Modal>
  </template>
  <template v-else>
    <span>{{ locationLabel }}</span>
  </template>
</template>

<script setup lang="ts">
import { Widget } from "@/types";
import { computed, ref } from "vue";
import Modal from "@/Helpers/Modal/Modal.vue";

interface LocationObject {
  type: string;
  coordinates: number[];
}

interface LocationContent {
  loc: LocationObject;
  address: string;
  isPrimary: boolean;
  locationLabel: string;
}

interface Props {
  locationContent: LocationContent;
  widget: Widget;
}

const props = defineProps<Props>();

const latitude = computed(() => {
  return props.locationContent.loc.coordinates[1].toFixed(2);
});

const longitude = computed(() => {
  return props.locationContent.loc.coordinates[0].toFixed(2);
});

const locationLabel = computed(() => {
  let label = "";
  if (
    props.locationContent.locationLabel &&
    props.locationContent.locationLabel.length > 0
  ) {
    label = props.locationContent.locationLabel;
  } else {
    if (
      props.locationContent.address &&
      props.locationContent.address.length > 0
    ) {
      label = props.locationContent.address;
    } else {
      label = latitude.value + ", " + longitude.value;
    }
  }
  return label;
});

const haveLocation = computed(() => {
  return (
    props.locationContent.loc.coordinates[0] !== 0 &&
    props.locationContent.loc.coordinates[1] !== 0
  );
});

const show = ref(false);
</script>
