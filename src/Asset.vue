<template>
    <div class="flex-container">
        <div class="flex-child">
            <DigitalAssetContainer />
            <ViewContainer v-if="store.objectId" :objectId="store.objectId" :isPrimaryElement="false" />
        </div>
        <div class="flex-child">
            <ViewContainer v-if="objectId" :objectId="objectId" :isPrimaryElement="true" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from "@vue/runtime-core";
import { ref } from "vue";
import { getAsset, getTemplate } from "@/Helpers/displayUtils";
import ViewContainer from "@/ViewComponents/ViewContainer.vue";
import DigitalAssetContainer from "@/ViewComponents/DigitalAssetContainer.vue";
import { useAssetStore } from "@/stores/assetStore";

const store = useAssetStore();

store.objectId = null;
store.fileObjectId = null;

interface Props {
    objectId: string;
}

const asset: any = ref(null);
const template = ref(null);

const props = defineProps<Props>();


</script>

<style scoped>
.flex-container {
    display: flex;
}.flex-child {
    flex: 1;
    margin-let: 1em;
    margin-right: 1em;
}
</style>