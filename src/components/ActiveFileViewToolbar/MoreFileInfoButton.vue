<template>
  <ActiveFileViewButton @click="handleInfoButtonClick">
    <InfoIcon />
  </ActiveFileViewButton>
  <Modal
    label="File Info"
    :isOpen="isFileInfoOpen"
    class="max-w-4xl m-auto"
    @close="isFileInfoOpen = false"
  >
    <div v-if="!isFileMetaDataReady">
      <Skeleton v-for="index in 10" :key="index" />
    </div>

    <div v-if="isFileMetaDataReady">
      <span v-if="!fileMetaData">No meta data found.</span>

      <section v-if="fileMetaData?.exif" class="flex flex-col gap-6">
        <Tuple label="File Type">
          {{ fileMetaData.exif.File.FileType }}
        </Tuple>
        <Tuple label="Original Name">
          {{ fileMetaData.sourcefile }}
        </Tuple>
        <Tuple label="File Size">
          {{ fileMetaData.exif.File.FileSize }}
        </Tuple>
        <Tuple label="Image Size">
          {{ fileMetaData.width }}x{{ fileMetaData.height }}
        </Tuple>
        <Tuple v-if="fileMetaData.coordinates" label="Location">
          <div class="bg-neutral-200 p-4 rounded-xl">
            <Map
              :center="{
                lng: fileMetaData.coordinates[0],
                lat: fileMetaData.coordinates[1],
              }"
              :zoom="10"
              mapStyle="streets"
              :apiKey="config.arcgis.apiKey"
              class=""
            >
              <MapMarker
                :lng="fileMetaData.coordinates[0]"
                :lat="fileMetaData.coordinates[1]"
              />
            </Map>
          </div>
        </Tuple>

        <h2 class="text-xl font-bold mt-6 border-t pt-6">EXIF Details</h2>
        <Accordion
          v-for="(exifSectionProps, exifSectionLabel) in fileMetaData.exif"
          :key="exifSectionLabel"
          :label="exifSectionLabel"
          class="border mt-6"
        >
          <Tuple
            v-for="(value, key) in exifSectionProps"
            :key="key"
            :label="key"
          >
            {{ value }}
          </Tuple>
        </Accordion>
      </section>
      <section v-else>
        <div v-for="(value, key) in fileMetaData" :key="key" class="my-6">
          <Tuple :label="key">
            {{ value }}
          </Tuple>
        </div>
      </section>
    </div>
  </Modal>
</template>
<script setup lang="ts">
import { ref, defineAsyncComponent } from "vue";
import ActiveFileViewButton from "./ActiveFileViewButton.vue";
import Modal from "../Modal/Modal.vue";
import { FileMetaData } from "@/types/FileMetaDataTypes";
import api from "@/api";
import { useAssetStore } from "@/stores/assetStore";
import Skeleton from "../Skeleton/Skeleton.vue";
import { computed } from "vue";
import Tuple from "../Tuple/Tuple.vue";
import Accordion from "../Accordion/Accordion.vue";
import config from "@/config";
import InfoIcon from "@/icons/InfoIcon.vue";

const Map = defineAsyncComponent(() => import("@/components/Map/Map.vue"));
const MapMarker = defineAsyncComponent(
  () => import("@/components/MapMarker/MapMarker.vue")
);

const isFileInfoOpen = ref(false);
const fileMetaData = ref<FileMetaData | null | undefined>(undefined);
const isFileMetaDataReady = computed(() => fileMetaData.value !== undefined);

const assetStore = useAssetStore();

async function handleInfoButtonClick() {
  isFileInfoOpen.value = !isFileInfoOpen.value;
  fileMetaData.value = undefined;
  fileMetaData.value = await api.getFileMetaData(assetStore.activeFileObjectId);
}
</script>
<style scoped></style>
