<template>
    <div>
        <DigitalAssetContainer />
        <ViewContainer v-if="template" :asset="asset" :template="template" />
    </div>

</template>

<script setup lang="ts">
import { onMounted } from "@vue/runtime-core";
import { ref } from "vue";
import { getAsset, getTemplate } from "@/Helpers/displayUtils";
import ViewContainer from "@/ViewComponents/ViewContainer.vue";

interface Props {
    objectId: string;
}

const asset: any = ref(null);
const template = ref(null);

const props = defineProps<Props>();

onMounted(async () => {
    asset.value = await getAsset(props.objectId);
    if (asset && asset.value && asset.value.templateId) {
        template.value = await getTemplate(asset.value.templateId);
    }
});

</script>