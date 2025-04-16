<template>
  <form class="grid grid-cols-[1fr,auto]" @submit.prevent="$emit('save')">
    <section class="p-4">
      <h1 class="text-2xl font-bold mb-8">{{ title }}</h1>
      <div class="flex flex-col gap-4">
        <EditWidget
          v-for="{ widgetDef, widgetContents } in widgetDefAndContents"
          :key="widgetDef.widgetId"
          :widgetDef="widgetDef"
          :widgetContents="widgetContents"
          @update:widgetContents="
            $emit('update:asset', { ...asset, [widgetDef.fieldTitle]: $event })
          " />
      </div>
    </section>
    <aside
      class="bg-neutral-200 p-4 border-l-2 border-neutral-900 sticky top-20 flex flex-col gap-6">
      <div class="grid grid-cols-2 gap-4">
        <Button variant="primary" type="submit">Save</Button>
        <Button variant="secondary" @click="$emit('cancel')">Cancel</Button>
      </div>
      <SelectGroup
        :modelValue="String(template.templateId)"
        :options="templateOptions"
        label="Template"
        required
        @update:templateId="$emit('update:templateId', $event)" />
      <SelectGroup
        :modelValue="String(asset.collectionId)"
        :options="collectionOptions"
        label="Collection"
        required
        @update:modelValue="
          $emit('update:asset', {
            ...asset,
            collectionId: Number.parseInt($event),
          })
        " />
    </aside>
  </form>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";
import EditWidget from "@/components/EditAssetForm/EditWidget/EditWidget.vue";
import Button from "@/components/Button/Button.vue";
import { Asset, Template, WidgetContent, WidgetProps } from "@/types";
import { getWidgetContents } from "@/helpers/displayUtils";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";

const props = withDefaults(
  defineProps<{
    template: Template;
    asset: Asset;
    title?: string;
  }>(),
  {
    title: "Edit Asset",
  }
);

defineEmits<{
  (e: "save"): void;
  (e: "cancel"): void;
  (e: "update:templateId", templateId: string): void;
  (e: "update:asset", asset: Asset): void;
}>();

const localTemplateId = ref("");
const instanceStore = useInstanceStore();

const templateOptions = computed(() => {
  return (
    instanceStore.instance.templates?.map((template) => ({
      label: template.name,
      id: template.id.toString(),
    })) ?? []
  );
});

const collectionOptions = computed(() => {
  return (
    instanceStore.collections?.map((collection) => ({
      label: collection.title,
      id: collection.id.toString(),
    })) ?? []
  );
});

const widgetDefAndContents = computed(
  (): Array<{
    widgetDef: WidgetProps;
    widgetContents: WidgetContent[];
  }> =>
    props.template.widgetArray.map((widgetDef) => ({
      widgetDef,
      widgetContents: getWidgetContents({
        asset: props.asset,
        widget: widgetDef,
      }) as WidgetContent[],
    }))
);
</script>
<style scoped></style>
