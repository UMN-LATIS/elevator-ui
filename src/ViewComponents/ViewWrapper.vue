<template>
    <ViewContainer :objectId="objectId" :isPrimaryElement="false" />
</template>

<script setup lang="ts">
import { getAsset } from "@/Helpers/displayUtils";
import ViewContainer from "@/ViewComponents/ViewContainer.vue";
import { onMounted, ref } from 'vue';
import { useTemplateStore } from "@/stores/templateStore";
const nestedAsset: any = ref(null);
const nestedTemplate = ref(null);
const templateStore = useTemplateStore();
interface Props {
    objectId: string;
}

const props = defineProps<Props>();

onMounted(async () => {
    if (props.objectId) {
        nestedAsset.value = await getAsset(props.objectId);
        if (nestedAsset.value.templateId) {
            nestedTemplate.value = await templateStore.loadTemplate(nestedAsset.value.templateId);
        }

    }
});

</script>