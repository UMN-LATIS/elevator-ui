<template>
  <template v-if="haveLocation">
    <span
      ><a href="#" @click.prevent="show = true">{{ locationLabel }}</a></span
    >
    <Modal :show="show" @close="show = false">
      It's a map!
      {{ latitude }}, {{ longitude }}
    </Modal>
  </template>
  <template v-else>
    <span>{{ locationLabel }}</span>
  </template>
</template>

<script setup lang="ts">
import { LocationWidgetProps, LocationWidgetContent } from "@/types";
import { computed, ref } from "vue";
import Modal from "@/components/Modal/Modal.vue";

interface Props {
  locationContent: LocationWidgetContent;
  widget: LocationWidgetProps;
}

const props = defineProps<Props>();

const latitude = computed(() => {
  return props.locationContent.loc?.coordinates?.[1].toFixed(2) ?? 0;
});

const longitude = computed(() => {
  return props.locationContent.loc?.coordinates?.[0].toFixed(2) ?? 0;
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
  return longitude.value !== 0 && latitude.value !== 0;
});

const show = ref(false);
</script>
