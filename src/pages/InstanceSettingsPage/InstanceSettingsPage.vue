<template>
  <DefaultLayout>
    <div class="p-4 md:p-8 max-w-4xl mx-auto w-full">
      <header class="mb-8">
        <p class="text-sm md:text-base font-medium text-neutral-500 uppercase">
          Admin
        </p>
        <h1 class="text-2xl md:text-4xl font-bold">Instance Settings</h1>
      </header>

      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <SpinnerIcon class="w-8 h-8 animate-spin" />
        <span class="ml-2">Loading settings...</span>
      </div>

      <div v-else-if="isError" class="text-red-600 p-4 bg-red-50 rounded-md">
        Failed to load instance settings. Please try again.
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSave">
        <!-- General Settings -->
        <FormSection title="General">
          <InputGroup
            v-model="form.name"
            label="Instance Name"
            required
            placeholder="My Elevator Instance" />
          <InputGroup
            v-model="form.domain"
            label="Domain"
            required
            placeholder="example.edu" />
          <InputGroup
            v-model="form.ownerHomepage"
            label="Owner Contact"
            placeholder="https:// or mailto:" />
          <InputGroup
            v-model="form.googleAnalyticsKey"
            label="Google Analytics Key"
            placeholder="UA-XXXXX-Y or G-XXXXXXX" />
        </FormSection>

        <!-- Featured Asset -->
        <FormSection title="Featured Asset">
          <InputGroup
            v-model="form.featuredAsset"
            label="Featured Asset ID"
            placeholder="Asset ID for homepage feature" />
          <TextAreaGroup
            :modelValue="form.featuredAssetText ?? ''"
            label="Featured Asset Text"
            placeholder="Text to display above the featured asset"
            @update:modelValue="form.featuredAssetText = $event || null" />
        </FormSection>

        <!-- Display Options -->
        <FormSection title="Display Options">
          <ToggleField
            v-model="form.showCollectionInSearchResults"
            label="Show Collection in Search Results" />
          <ToggleField
            v-model="form.showTemplateInSearchResults"
            label="Show Template in Search Results" />
          <ToggleField
            v-model="form.showPreviousNextSearchResults"
            label="Show Previous/Next in Asset View" />
          <ToggleField
            v-model="form.hideVideoAudio"
            label="Hide Video/Audio Download Links" />
          <ToggleField
            v-model="form.allowIndexing"
            label="Allow Search Engine Indexing" />
          <ToggleField
            v-model="form.autoloadMaxSearchResults"
            label="Autoload Search Results (under 1000)" />
        </FormSection>

        <!-- Advanced Features -->
        <FormSection title="Advanced Features">
          <ToggleField
            v-model="form.useVoyagerViewer"
            label="Use Smithsonian Voyager for 3D" />
          <ToggleField
            v-model="form.automaticAltText"
            label="Auto-generate Alt Text and Captions" />
          <ToggleField
            v-model="form.enableHLSStreaming"
            label="Enable HLS Streaming" />
          <ToggleField
            v-model="form.useCentralAuth"
            label="Use Central Authentication" />
        </FormSection>

        <!-- Vue Interface Options -->
        <FormSection title="Vue Interface Options">
          <ToggleField
            v-model="form.enableThemes"
            label="Enable Theme Selection" />
          <SelectGroup
            v-if="form.enableThemes"
            v-model="form.defaultTheme"
            :options="themeOptions"
            label="Default Theme" />
          <InputGroup
            v-model="form.customHomeRedirect"
            label="Custom Home Redirect"
            placeholder="/collections or custom URL" />
          <InputGroup
            v-model="form.maximumMoreLikeThis"
            label="More Like This Display Count"
            type="number" />
          <InputGroup
            v-model="form.defaultTextTruncationHeight"
            label="Text Area Collapsed Height (px)"
            type="number" />
        </FormSection>

        <!-- Notes -->
        <FormSection title="Notes">
          <TextAreaGroup
            :modelValue="form.notes ?? ''"
            label="Instance Notes"
            placeholder="Internal notes about this instance"
            inputClass="h-32"
            @update:modelValue="form.notes = $event || null" />
        </FormSection>

        <!-- Form Actions -->
        <div class="flex justify-end gap-4 pt-4 border-t border-neutral-200">
          <Button type="submit" variant="primary" :disabled="isSaving">
            <SpinnerIcon v-if="isSaving" class="w-4 h-4 animate-spin" />
            {{ isSaving ? "Saving..." : "Save Settings" }}
          </Button>
        </div>
      </form>
    </div>
  </DefaultLayout>
</template>

<script setup lang="tsx">
import { ref, watch, computed, type FunctionalComponent } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import TextAreaGroup from "@/components/TextAreaGroup/TextAreaGroup.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import Button from "@/components/Button/Button.vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import Toggle from "@/components/Toggle/Toggle.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import { useToastStore } from "@/stores/toastStore";
import {
  useInstanceSettingsQuery,
  useUpdateInstanceSettingsMutation,
  getDefaultInstanceSettings,
} from "@/queries/useInstanceSettingsQuery";
import type { InstanceSettings, SelectOption } from "@/types";

const props = defineProps<{
  instanceId: number;
}>();

const toastStore = useToastStore();

const {
  data: settingsData,
  isLoading,
  isError,
} = useInstanceSettingsQuery(() => props.instanceId);

const updateMutation = useUpdateInstanceSettingsMutation();
const isSaving = computed(() => updateMutation.isPending.value);

// Form state - initialized from query data
const form = ref<InstanceSettings>(
  getDefaultInstanceSettings(props.instanceId)
);

// Sync form with fetched data
watch(
  settingsData,
  (newData) => {
    if (newData) {
      form.value = { ...newData };
    }
  },
  { immediate: true }
);

// Theme options for the select
const themeOptions = computed((): SelectOption<string>[] => [
  { id: "default", label: "Default" },
  { id: "dark", label: "Dark" },
]);

async function handleSave() {
  if (!props.instanceId) {
    toastStore.addToast({
      title: "Error",
      message: "Instance ID not available",
      variant: "error",
    });
    return;
  }

  try {
    await updateMutation.mutateAsync({
      ...form.value,
      instanceId: props.instanceId,
    });

    toastStore.addToast({
      title: "Saved",
      message: "Instance settings saved successfully.",
      variant: "success",
      duration: 3000,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    toastStore.addToast({
      title: "Error",
      message: `Failed to save settings: ${message}`,
      variant: "error",
    });
  }
}

// ToggleField component for consistent toggle styling
const ToggleField: FunctionalComponent<{
  modelValue: boolean;
  label: string;
  "onUpdate:modelValue"?: (value: boolean) => void;
}> = (props) => (
  <div class="flex items-center justify-between py-2">
    <span class="text-sm text-neutral-700">{props.label}</span>
    <Toggle
      modelValue={props.modelValue}
      settingLabel={props.label}
      onUpdate:modelValue={props["onUpdate:modelValue"]}
    />
  </div>
);

// FormSection component for grouping fields
const FormSection: FunctionalComponent<{ title: string }> = (
  props,
  { slots }
) => (
  <section class="bg-white rounded-lg border border-neutral-200 p-6 grid md:grid-cols-[15rem,1fr] gap-4 items-start">
    <h2 class="text-lg font-semibold">{props.title}</h2>
    <div class="space-y-4">{slots.default?.()}</div>
  </section>
);
</script>

<style scoped></style>
