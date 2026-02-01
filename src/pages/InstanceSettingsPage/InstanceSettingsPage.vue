<template>
  <DefaultLayout>
    <div
      class="md:grid lg:grid-cols-[minmax(0,1fr),minmax(auto,20rem)] relative min-h-screen">
      <div class="p-4 md:p-8 max-w-4xl mx-auto w-full mb-20 lg:mb-0">
        <header class="mb-8">
          <h1 class="text-2xl md:text-4xl font-bold">Instance Settings</h1>
        </header>

        <div v-if="isLoading" class="flex justify-center items-center py-12">
          <SpinnerIcon class="w-8 h-8 animate-spin" />
          <span class="ml-2">Loading settings...</span>
        </div>

        <div
          v-else-if="isError"
          class="text-red-600 p-4 bg-red-50 rounded-md border border-red-200">
          Failed to load instance settings.
        </div>

        <form v-else id="instance-settings-form" @submit.prevent="handleSave">
          <!-- General Settings -->
          <FormSection id="general" title="General">
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
            <TextAreaGroup
              :modelValue="form.notes ?? ''"
              label="Instance Notes"
              placeholder="Internal notes about this instance"
              inputClass="h-24"
              @update:modelValue="form.notes = $event || null" />
          </FormSection>

          <FormSection id="authentication" title="Authentication">
            <ToggleField
              v-model="form.useCentralAuth"
              label="Use Central Authentication" />
          </FormSection>

          <FormSection id="customization" title="Customization">
            <InputGroup
              v-model="form.customHomeRedirect"
              label="Custom Home Redirect"
              placeholder="e.g. /collections or custom URL" />
            <InputGroup
              v-model="form.googleAnalyticsKey"
              label="Google Analytics Key"
              placeholder="UA-XXXXX-Y or G-XXXXXXX" />
            <SelectGroup
              v-model="form.useCustomHeader"
              :options="customHeaderOptions"
              label="Display Custom Header/Footer" />
            <TextAreaGroup
              v-if="!!form.useCustomHeader"
              :modelValue="form.customHeaderText ?? ''"
              label="Custom Header Content"
              placeholder="HTML content for custom header"
              inputClass="h-24 font-mono text-sm"
              @update:modelValue="form.customHeaderText = $event || null" />
            <TextAreaGroup
              v-if="!!form.useCustomHeader"
              :modelValue="form.customFooterText ?? ''"
              label="Custom Footer Content"
              placeholder="HTML content for custom footer"
              inputClass="h-24 font-mono text-sm"
              @update:modelValue="form.customFooterText = $event || null" />

            <FormSubSection :isOpen="!!form.useCustomCSS">
              <ToggleField v-model="form.useCustomCSS" label="Use Custom CSS" />
              <template #details>
                <TextAreaGroup
                  v-if="!!form.useCustomCSS"
                  :modelValue="form.customHeaderCSS ?? ''"
                  label="Custom CSS"
                  placeholder="Custom CSS styles"
                  inputClass="h-32 font-mono text-sm"
                  @update:modelValue="form.customHeaderCSS = $event || null" />
              </template>
            </FormSubSection>
            <FormSubSection :isOpen="form.useHeaderLogo">
              <ToggleField
                v-model="form.useHeaderLogo"
                label="Use Header Logo" />
              <template #details>
                <div v-if="form.useHeaderLogo" class="space-y-3">
                  <label class="block text-xs font-medium uppercase">
                    Logo Image (PNG)
                  </label>
                  <div
                    v-if="headerImagePreview && !headerImageError"
                    class="border border-neutral-200 rounded-md p-2 bg-neutral-50">
                    <img
                      :src="headerImagePreview"
                      alt="Current header image"
                      class="max-h-24 object-contain"
                      @error="headerImageError = true"
                      @load="headerImageError = false" />
                  </div>
                  <input
                    ref="headerImageInput"
                    type="file"
                    accept="image/png"
                    class="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    @change="handleHeaderImageChange" />
                </div>
              </template>
            </FormSubSection>
          </FormSection>

          <FormSection id="storage" title="Storage">
            <InputGroup
              v-model="form.amazonS3Key"
              label="Amazon S3 Key"
              placeholder="AWS access key ID" />
            <InputGroup
              v-model="form.amazonS3Secret"
              label="Amazon S3 Secret"
              :type="showS3Secret ? 'text' : 'password'"
              placeholder="AWS secret access key">
              <template #append>
                <button
                  type="button"
                  class="p-1.5 text-neutral-500 hover:text-neutral-700 focus:outline-none"
                  @click="showS3Secret = !showS3Secret">
                  <EyeIcon v-if="showS3Secret" class="w-5 h-5" />
                  <EyeOffIcon v-else class="w-5 h-5" />
                </button>
              </template>
            </InputGroup>
            <InputGroup
              v-model="form.defaultBucket"
              label="Default Bucket"
              placeholder="S3 bucket name" />
            <InputGroup
              v-model="form.bucketRegion"
              label="Bucket Region"
              placeholder="e.g., us-east-1" />
          </FormSection>

          <FormSection id="featured-asset" title="Featured Asset">
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

          <FormSection id="search-settings" title="Search">
            <ToggleField
              v-model="form.showCollectionInSearchResults"
              label="Show Collection in Search Results" />
            <ToggleField
              v-model="form.showTemplateInSearchResults"
              label="Show Template in Search Results" />
            <ToggleField
              v-model="form.allowIndexing"
              label="Allow Search Engine Indexing" />
            <ToggleField
              v-model="form.autoloadMaxSearchResults"
              label="Autoload Search Results (under 1000)" />
          </FormSection>

          <FormSection id="assets" title="Assets">
            <ToggleField
              v-model="form.enableInterstitial"
              label="Show Interstitial When Embedding via API" />
            <TextAreaGroup
              v-if="form.enableInterstitial"
              :modelValue="form.interstitialText ?? ''"
              label="Interstitial Text"
              placeholder="Text shown in embed interstitial"
              inputClass="h-24"
              @update:modelValue="form.interstitialText = $event || null" />
            <ToggleField
              v-model="form.showPreviousNextSearchResults"
              label="Show Previous/Next in Asset View" />
            <ToggleField
              v-model="form.hideVideoAudio"
              label="Hide Video/Audio Download Links" />
            <ToggleField
              v-model="form.automaticAltText"
              label="Auto-generate Alt Text and Captions" />
            <ToggleField
              v-model="form.useVoyagerViewer"
              label="Use Smithsonian Voyager for 3D" />
            <ToggleField
              v-model="form.enableHLSStreaming"
              label="Enable HLS Streaming" />
            <InputGroup
              v-model="form.maximumMoreLikeThis"
              label="More Like This Results"
              type="number" />
            <InputGroup
              v-model="form.defaultTextTruncationHeight"
              label="Text Area Collapsed Height (px)"
              type="number" />
          </FormSection>

          <FormSection id="user-interface" title="User Interface">
            <SelectGroup
              v-model="form.interfaceVersion"
              :options="interfaceVersionOptions"
              label="Interface Version" />
            <FormSubSection
              v-if="!!form.interfaceVersion"
              :isOpen="form.enableTheming">
              <ToggleField
                v-model="form.enableTheming"
                label="Enable Theme Selection" />
              <template #details>
                <SelectGroup
                  v-if="form.enableTheming"
                  v-model="form.defaultTheme"
                  :options="themeOptions"
                  label="Default Theme" />
                <div v-if="form.enableTheming" class="space-y-2">
                  <label class="block text-xs font-medium uppercase">
                    Available Themes
                  </label>
                  <div class="flex flex-wrap gap-4">
                    <label
                      v-for="theme in allThemes"
                      :key="theme"
                      class="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        :value="theme"
                        :checked="form.availableThemes?.includes(theme)"
                        class="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                        @change="toggleTheme(theme)" />
                      {{ theme }}
                    </label>
                  </div>
                </div>
              </template>
            </FormSubSection>
          </FormSection>
        </form>
      </div>
      <!-- sidebar -->
      <aside
        class="sidebar-container bg-[--app-sidebar-backgroundColor] text-[--app-sidebar-textColor] [border-left:var(--app-borderWidth)_solid_var(--app-borderColor)] p-6 fixed bottom-0 left-0 w-full lg:static">
        <div class="sticky top-20 flex flex-col gap-6">
          <div v-if="!isLoading && !isError" class="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              :disabled="!hasUnsavedChanges"
              @click="handleCancel">
              Cancel
            </Button>
            <Button
              type="submit"
              form="instance-settings-form"
              variant="primary"
              :disabled="isSaving">
              <SpinnerIcon v-if="isSaving" class="w-4 h-4 animate-spin" />
              {{ isSaving ? "Saving..." : "Save" }}
            </Button>
            <p
              v-if="hasUnsavedChanges"
              class="col-span-2 text-xs text-amber-600 text-center">
              You have unsaved changes
            </p>
          </div>
          <SettingsTableOfContents class="hidden lg:block" />
        </div>
      </aside>
    </div>
  </DefaultLayout>
</template>

<script setup lang="tsx">
import {
  ref,
  watch,
  computed,
  onUnmounted,
  type FunctionalComponent,
} from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import TextAreaGroup from "@/components/TextAreaGroup/TextAreaGroup.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import Button from "@/components/Button/Button.vue";
import SpinnerIcon from "@/icons/SpinnerIcon.vue";
import EyeIcon from "@/icons/EyeIcon.vue";
import EyeOffIcon from "@/icons/EyeOffIcon.vue";
import Toggle from "@/components/Toggle/Toggle.vue";
import { useToastStore } from "@/stores/toastStore";
import config from "@/config";
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

// UI state for password visibility
const showS3Secret = ref(false);

// Header image state
const selectedHeaderImage = ref<File | null>(null);
const headerImageError = ref(false);
const headerImageObjectUrl = ref<string | null>(null);

// Create object URL when file changes, revoking previous one to prevent memory leaks
watch(selectedHeaderImage, (newFile, _oldFile) => {
  if (headerImageObjectUrl.value) {
    URL.revokeObjectURL(headerImageObjectUrl.value);
    headerImageObjectUrl.value = null;
  }
  if (newFile) {
    headerImageObjectUrl.value = URL.createObjectURL(newFile);
  }
});

// Cleanup object URL on unmount
onUnmounted(() => {
  if (headerImageObjectUrl.value) {
    URL.revokeObjectURL(headerImageObjectUrl.value);
  }
});

const headerImagePreview = computed(() => {
  if (headerImageObjectUrl.value) {
    return headerImageObjectUrl.value;
  }
  // Show existing image if useHeaderLogo is enabled
  if (form.value.useHeaderLogo) {
    return `${config.instance.base.origin}/assets/instanceAssets/${props.instanceId}.png`;
  }
  return null;
});

function handleHeaderImageChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  selectedHeaderImage.value = file;
  headerImageError.value = false;
}

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

// Track unsaved changes by comparing form to saved data
const hasUnsavedChanges = computed(() => {
  if (!settingsData.value) return false;
  return JSON.stringify(form.value) !== JSON.stringify(settingsData.value);
});

// Reset form to saved state
function handleCancel() {
  if (!settingsData.value) return;
  form.value = { ...settingsData.value };
  selectedHeaderImage.value = null;
}

// Theme options for the select
const themeOptions = computed(
  (): SelectOption<string>[] =>
    settingsData.value?.availableThemes?.map((theme) => ({
      id: theme,
      label: theme,
    })) ?? []
);

// Custom header display options
const customHeaderOptions = computed((): SelectOption<0 | 1 | 2>[] => [
  { id: 0, label: "Never" },
  { id: 1, label: "Always" },
  { id: 2, label: "Only on Home Page" },
]);

// Interface version options
const interfaceVersionOptions = computed((): SelectOption<0 | 1>[] => [
  { id: 0, label: "Classic" },
  { id: 1, label: "VueJS" },
]);

// All available themes from config
const allThemes = computed(() => config.instance.theming.availableThemes);

// Table of contents sections
const tocSections = [
  { id: "general", label: "General" },
  { id: "authentication", label: "Authentication" },
  { id: "customization", label: "Customization" },
  { id: "storage", label: "Storage" },
  { id: "featured-asset", label: "Featured Asset" },
  { id: "search-settings", label: "Search" },
  { id: "assets", label: "Assets" },
  { id: "user-interface", label: "User Interface" },
] as const;

function toggleTheme(theme: string) {
  const current = form.value.availableThemes ?? [];
  const isSelected = current.includes(theme);
  form.value.availableThemes = isSelected
    ? current.filter((t) => t !== theme)
    : [...current, theme];
}

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
  <div class="flex items-center justify-between gap-4 flex-wrap">
    <span class="text-sm text-neutral-700">{props.label}</span>
    <Toggle
      modelValue={props.modelValue}
      settingLabel={props.label}
      onUpdate:modelValue={props["onUpdate:modelValue"]}
    />
  </div>
);

// FormSection component for grouping fields
const FormSection: FunctionalComponent<{ title: string; id?: string }> = (
  props,
  { slots, attrs }
) => (
  <section
    id={attrs.id as string}
    class="border-t border-neutral-300 py-6 grid sm:grid-cols-[15rem,1fr] gap-4 items-start">
    <h2 class="text-lg font-semibold">{props.title}</h2>
    <div class="space-y-4">{slots.default?.()}</div>
  </section>
);

const FormSubSection: FunctionalComponent<{
  isOpen: boolean;
}> = ({ isOpen = false }, { slots }) => (
  <section
    class={`flex flex-col gap-4 ${
      isOpen ? "border border-neutral-300 p-2 rounded-md" : ""
    }`}>
    {slots.default?.()}
    {isOpen && slots.details?.()}
  </section>
);

// SettingsTableOfContents component for sidebar navigation
const SettingsTableOfContents: FunctionalComponent = () => (
  <nav>
    <h2 class="text-xs tracking-wide font-medium uppercase mb-2 opacity-70">
      Contents
    </h2>
    <ol class="text-sm space-y-1">
      {tocSections.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            class="block py-1 text-current opacity-70 hover:opacity-100 transition-opacity no-underline hover:no-underline"
            onClick={(e: MouseEvent) => {
              e.preventDefault();
              const element = document.getElementById(section.id);
              if (element) {
                window.scrollTo({
                  top: element.offsetTop - 80,
                  behavior: "smooth",
                });
              }
            }}>
            {section.label}
          </a>
        </li>
      ))}
    </ol>
  </nav>
);
</script>

<style scoped></style>
