<template>
  <IconButton
    class="more-file-info-button"
    title="More Info"
    @click="handleInfoButtonClick">
    <InfoIcon />
    <span class="sr-only">More Info</span>
  </IconButton>
  <Modal
    label="File Info"
    :isOpen="isFileInfoOpen"
    class="max-w-4xl m-auto h-[75vh]"
    @close="isFileInfoOpen = false">
    <Transition name="fade">
      <div v-if="isFileMetaDataReady">
        <span v-if="!fileMetaData">No meta data found.</span>

        <section v-if="fileMetaData?.exif" class="flex flex-col gap-6">
          <Tuple label="File Type">
            {{ fileMetaData.exif?.File?.FileType ?? "Unknown" }}
          </Tuple>
          <Tuple label="Original Name">
            {{ fileMetaData.sourcefile ?? "Unknown" }}
          </Tuple>
          <Tuple label="File Size">
            {{ fileMetaData.exif?.File?.FileSize ?? "Unknown" }}
          </Tuple>
          <Tuple label="Image Size">
            {{ fileMetaData.width ?? "Unknown" }} x
            {{ fileMetaData.height ?? "Unknonwn" }}
          </Tuple>
          <Tuple v-if="fileMetaData.coordinates" label="Location">
            <div class="bg-surface-container p-4 rounded-xl">
              <Map
                :center="{
                  lng: fileMetaData.coordinates[0],
                  lat: fileMetaData.coordinates[1],
                }"
                :zoom="10"
                mapStyle="streets"
                :apiKey="config.arcgis.apiKey"
                mapContainerClass="!h-[50vh]">
                <MapMarker
                  id="more-info-location-map-marker"
                  :lng="fileMetaData.coordinates[0]"
                  :lat="fileMetaData.coordinates[1]" />
              </Map>
            </div>
          </Tuple>

          <h2 class="text-xl font-bold mt-6 border-t pt-6">EXIF Details</h2>
          <pre>{{ fileMetaData.exif }}</pre>
        </section>
        <section v-else>
          <pre>{{ fileMetaData }}</pre>
        </section>
      </div>
    </Transition>
  </Modal>
</template>
<script setup lang="ts">
import { ref, defineAsyncComponent } from "vue";
import IconButton from "@/components/IconButton/IconButton.vue";
import Modal from "../Modal/Modal.vue";
import { FileMetaData } from "@/types/FileMetaDataTypes";
import api from "@/api";
import { computed } from "vue";
import Tuple from "../Tuple/Tuple.vue";
import config from "@/config";
import InfoIcon from "@/icons/InfoIcon.vue";

const props = defineProps<{
  fileObjectId: string;
}>();

const Map = defineAsyncComponent(() => import("@/components/Map/Map.vue"));
const MapMarker = defineAsyncComponent(
  () => import("@/components/MapMarker/MapMarker.vue")
);

const isFileInfoOpen = ref(false);
const fileMetaData = ref<FileMetaData | null | undefined>(undefined);
const isFileMetaDataReady = computed(() => fileMetaData.value !== undefined);

async function handleInfoButtonClick() {
  isFileInfoOpen.value = !isFileInfoOpen.value;
  fileMetaData.value = undefined;
  fileMetaData.value = await api.getFileMetaData(props.fileObjectId);
}
</script>
<style scoped></style>
