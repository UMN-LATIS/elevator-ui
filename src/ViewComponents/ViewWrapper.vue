<template>
    <ViewContainer v-if="nestedTemplate != null" :asset="nestedAsset" :template="nestedTemplate" />
</template>

<script setup lang="ts">
import { getAsset, getTemplate } from "@/Helpers/displayUtils";
import ViewContainer from "@/ViewComponents/ViewContainer.vue";
import { onMounted, ref } from 'vue';
const nestedAsset: any = ref(null);
const nestedTemplate = ref(null);

interface Props {
    objectId: string;
}

const props = defineProps<Props>();

onMounted(async () => {
    if (props.objectId) {
        nestedAsset.value = await getAsset(props.objectId);
        if (nestedAsset.value.templateId) {
            nestedTemplate.value = await getTemplate(nestedAsset.value.templateId);
        }

    }
});

</script>