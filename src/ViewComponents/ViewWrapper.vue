<template>
    <ViewContainer :asset="asset" :template="template" :isPrimaryElement="false" />
</template>

<script setup lang="ts">
import { getAsset } from "@/Helpers/displayUtils";
import ViewContainer from "@/ViewComponents/ViewContainer.vue";
import { onMounted, ref } from 'vue';
import { useTemplateStore } from "@/stores/templateStore";
const asset: any = ref(null);
const template = ref(null);
const templateStore = useTemplateStore();
interface Props {
    objectId: string;
}

const props = defineProps<Props>();


onMounted(async () => {
    if (props.objectId) {
        asset.value = await getAsset(props.objectId);
        if (asset.value.templateId) {
            template.value = await templateStore.loadTemplate(asset.value.templateId);
        }

    }
});

</script>