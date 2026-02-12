<template>
  <div class="component-showcase min-h-screen bg-surface">
    <!-- Header with Theme Selector -->
    <div class="sticky top-0 z-50 bg-surface-container-high shadow-md">
      <div
        class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-on-surface">Component Showcase</h1>
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium text-on-surface">Theme:</label>
          <select
            v-model="currentTheme"
            class="px-3 py-2 rounded border border-outline bg-surface text-on-surface">
            <option value="default">Light (Default)</option>
            <option value="dark">Dark</option>
            <option value="primary-tint">Primary Tint</option>
            <option value="folwell">Folwell (UMN)</option>
            <option value="st-thomas">St. Thomas</option>
            <option value="hotdog">Hotdog Stand</option>
            <option value="vaporwave">Vaporwave</option>
            <option value="matrix">Matrix</option>
            <option value="barbie">Barbie</option>
            <option value="ocean-sunset">Ocean Sunset</option>
            <option value="dracula">Dracula</option>
            <option value="solarized">Solarized</option>
            <option value="nord">Nord</option>
            <option value="nord-light">Nord Light</option>
            <option value="gameboy">Game Boy</option>
            <option value="tron">Tron</option>
            <option value="construction">Construction Zone</option>
            <option value="hotrod">Hot Rod</option>
            <option value="brutalist">Brutalist</option>
            <option value="neobrutalist">Neobrutalist</option>
            <option value="natural">Natural</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-6 py-8">
      <!-- Buttons Section -->
      <Section title="Buttons">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ComponentCard label="Primary">
            <Button variant="primary">Primary Button</Button>
          </ComponentCard>
          <ComponentCard label="Secondary">
            <Button variant="secondary">Secondary</Button>
          </ComponentCard>
          <ComponentCard label="Tertiary">
            <Button variant="tertiary">Tertiary</Button>
          </ComponentCard>
          <ComponentCard label="Danger">
            <Button variant="danger">Danger</Button>
          </ComponentCard>
          <ComponentCard label="Disabled">
            <Button variant="primary" disabled>Disabled</Button>
          </ComponentCard>
          <ComponentCard label="With Icon">
            <Button variant="primary">
              <PlusIcon class="w-4 h-4" />
              Add Item
            </Button>
          </ComponentCard>
        </div>
      </Section>

      <!-- Icon Buttons Section -->
      <Section title="Icon Buttons">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ComponentCard label="Plus Icon">
            <IconButton title="Add">
              <PlusIcon class="w-6 h-6" />
            </IconButton>
          </ComponentCard>
          <ComponentCard label="Options Icon">
            <IconButton title="More options">
              <OptionsIcon class="w-6 h-6" />
            </IconButton>
          </ComponentCard>
          <ComponentCard label="Search Icon">
            <IconButton title="Search">
              <SearchIcon class="w-6 h-6" />
            </IconButton>
          </ComponentCard>
          <ComponentCard label="Disabled">
            <IconButton title="Disabled" disabled>
              <PlusIcon class="w-6 h-6" />
            </IconButton>
          </ComponentCard>
        </div>
      </Section>

      <!-- Input Components -->
      <Section title="Input Components">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ComponentCard label="TextInput">
            <InputGroup
              id="text-input"
              v-model="textValue"
              fieldTitle="Text Input"
              placeholder="Enter text..."
              type="text" />
          </ComponentCard>
          <ComponentCard label="TextInput (Disabled)">
            <InputGroup
              id="disabled-input"
              fieldTitle="Disabled Input"
              placeholder="Disabled..."
              type="text"
              disabled />
          </ComponentCard>
          <ComponentCard label="TextArea">
            <TextAreaGroup
              id="text-area"
              v-model="textAreaValue"
              label="Text Area"
              placeholder="Enter multiple lines..." />
          </ComponentCard>
          <ComponentCard label="Toggle">
            <Toggle
              v-model="toggleValue"
              settingLabel="Enable feature"
              onLabel="On"
              offLabel="Off" />
          </ComponentCard>
        </div>
      </Section>

      <!-- Select & Dropdown -->
      <Section title="Selectors">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ComponentCard label="SelectGroup">
            <SelectGroup
              v-model="selectedValue"
              label="Select Option"
              :options="selectOptions" />
          </ComponentCard>
          <ComponentCard label="AutoCompleteInput">
            <AutoCompleteInput
              id="autocomplete"
              v-model="autoCompleteValue"
              fieldTitle="Search Fruits"
              :options="fruitOptions"
              placeholder="Type to search..."
              :filterFn="filterFruits" />
          </ComponentCard>
          <ComponentCard label="DropDown Menu">
            <DropDown>
              <template #default>
                <Button variant="secondary">Menu ▼</Button>
              </template>
              <template #menu>
                <div class="py-2">
                  <button
                    class="w-full px-4 py-2 text-left hover:bg-surface-container text-on-surface">
                    Option 1
                  </button>
                  <button
                    class="w-full px-4 py-2 text-left hover:bg-surface-container text-on-surface">
                    Option 2
                  </button>
                  <button
                    class="w-full px-4 py-2 text-left hover:bg-surface-container text-on-surface">
                    Option 3
                  </button>
                </div>
              </template>
            </DropDown>
          </ComponentCard>
        </div>
      </Section>

      <!-- Chips -->
      <Section title="Chips">
        <div class="flex flex-wrap gap-2">
          <Chip
            v-for="(chip, idx) in chips"
            :key="idx"
            @remove="chips.splice(idx, 1)">
            {{ chip }}
          </Chip>
        </div>
      </Section>

      <!-- Avatar -->
      <Section title="Avatar">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ComponentCard label="Avatar - Image">
            <Avatar
              name="John Doe"
              image="https://ui-avatars.com/api/?name=John+Doe&background=random" />
          </ComponentCard>
          <ComponentCard label="Avatar - Initials">
            <Avatar name="Jane Smith" />
          </ComponentCard>
          <ComponentCard label="Avatar - Large">
            <Avatar name="Large Avatar" size="lg" />
          </ComponentCard>
          <ComponentCard label="Avatar - Small">
            <Avatar name="Small Avatar" size="sm" />
          </ComponentCard>
        </div>
      </Section>

      <!-- Panel & Accordion -->
      <Section title="Accordion & Panel">
        <div class="space-y-4">
          <Panel label="Panel Title" :isOpen="true">
            <p class="text-on-surface">
              This is the panel content. Panels provide a contained area for
              content.
            </p>
          </Panel>
          <Accordion :items="accordionItems" />
        </div>
      </Section>

      <!-- Tabs -->
      <Section title="Tabs">
        <Tabs
          :activeTabId="activeTab.id"
          :onTabChange="(tab) => (activeTab = tab)"
          :tabs="tabItems" />
      </Section>

      <!-- Tooltip -->
      <Section title="Tooltip">
        <Tooltip content="Helpful information appears on hover">
          <Button variant="secondary">Hover me</Button>
        </Tooltip>
      </Section>

      <!-- Skeleto Loaders -->
      <Section title="Skeleton Loaders">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ComponentCard label="Skeleton">
            <Skeleton class="w-full h-12" />
          </ComponentCard>
          <ComponentCard label="SkeletonCard">
            <SkeletonCard />
          </ComponentCard>
          <ComponentCard label="SkeletonResultRow">
            <SkeletonResultRow />
          </ComponentCard>
        </div>
      </Section>

      <!-- Images -->
      <Section title="Images & Media">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ComponentCard label="LazyLoadImage">
            <LazyLoadImage
              src="https://via.placeholder.com/300x200"
              alt="Placeholder image" />
          </ComponentCard>
          <ComponentCard label="ThumbnailImage">
            <ThumbnailImage
              src="https://via.placeholder.com/150x150?text=Thumbnail"
              alt="Placeholder thumbnail" />
          </ComponentCard>
          <ComponentCard label="ThumbnailGeneric">
            <ThumbnailGeneric />
          </ComponentCard>
        </div>
      </Section>

      <!-- Utility Buttons -->
      <Section title="Utility Buttons">
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <ComponentCard label="XButton">
            <XButton @click="() => {}" />
          </ComponentCard>
          <ComponentCard label="Arrow Right">
            <ArrowButton direction="right" />
          </ComponentCard>
          <ComponentCard label="Arrow Left">
            <ArrowButton direction="left" />
          </ComponentCard>
          <ComponentCard label="FullscreenButton">
            <FullscreenButton :isFullscreen="false" @click="() => {}" />
          </ComponentCard>
        </div>
      </Section>

      <!-- Links & Interactive -->
      <Section title="Links & Notifications">
        <div class="space-y-4">
          <ComponentCard label="Link">
            <Link href="#" class="text-primary hover:underline">Click me</Link>
          </ComponentCard>
          <ComponentCard label="Notification - Info">
            <Notification
              type="info"
              title="Information"
              message="This is an informational notification." />
          </ComponentCard>
          <ComponentCard label="Notification - Success">
            <Notification
              type="success"
              title="Success"
              message="Operation completed successfully." />
          </ComponentCard>
          <ComponentCard label="Notification - Danger">
            <Notification
              type="danger"
              title="Error"
              message="Something went wrong." />
          </ComponentCard>
        </div>
      </Section>

      <!-- Modal -->
      <Section title="Modal">
        <ComponentCard label="Modal Dialog">
          <Button variant="primary" @click="showModal = true">
            Open Modal
          </Button>
          <Modal
            :isOpen="showModal"
            label="Modal Title"
            @close="showModal = false">
            <template #default>
              <p class="text-on-surface mb-4">
                This is a modal dialog. Click outside or the close button to
                dismiss.
              </p>
            </template>
            <template #footer>
              <div class="flex gap-2 justify-end">
                <Button variant="tertiary" @click="showModal = false">
                  Close
                </Button>
                <Button variant="primary">Save</Button>
              </div>
            </template>
          </Modal>
        </ComponentCard>
      </Section>

      <!-- Color Palette -->
      <Section title="Color Palette">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <ColorBox label="Primary" class="bg-primary" />
          <ColorBox label="Secondary" class="bg-secondary" />
          <ColorBox label="Tertiary" class="bg-tertiary" />
          <ColorBox label="Error" class="bg-error" />
          <ColorBox label="Success" class="bg-success" />
          <ColorBox label="Warning" class="bg-warning" />
          <ColorBox label="Info" class="bg-info" />
          <ColorBox label="Surface" class="bg-surface" />
          <ColorBox label="Container" class="bg-surface-container" />
          <ColorBox label="Outline" class="bg-outline" />
        </div>
      </Section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import Button from "@/components/Button/Button.vue";
import IconButton from "@/components/IconButton/IconButton.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import TextAreaGroup from "@/components/TextAreaGroup/TextAreaGroup.vue";
import SelectGroup from "@/components/SelectGroup/SelectGroup.vue";
import DropDown from "@/components/DropDown/DropDown.vue";
import Toggle from "@/components/Toggle/Toggle.vue";
import Chip from "@/components/Chip/Chip.vue";
import Avatar from "@/components/Avatar/Avatar.vue";
import Panel from "@/components/Panel/Panel.vue";
import Accordion from "@/components/Accordion/Accordion.vue";
import Tabs from "@/components/Tabs/Tabs.vue";
import Link from "@/components/Link/Link.vue";
import Notification from "@/components/Notification/Notification.vue";
import Modal from "@/components/Modal/Modal.vue";
import AutoCompleteInput from "@/components/AutoCompleteInput/AutoCompleteInput.vue";
import Tooltip from "@/components/Tooltip/Tooltip.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";
import SkeletonCard from "@/components/SkeletonCard/SkeletonCard.vue";
import SkeletonResultRow from "@/components/SkeletonResultRow/SkeletonResultRow.vue";
import LazyLoadImage from "@/components/LazyLoadImage/LazyLoadImage.vue";
import ThumbnailImage from "@/components/ThumbnailImage/ThumbnailImage.vue";
import ThumbnailGeneric from "@/components/ThumbnailGeneric/ThumbnailGeneric.vue";
import XButton from "@/components/XButton/XButton.vue";
import ArrowButton from "@/components/ArrowButton/ArrowButton.vue";
import FullscreenButton from "@/components/FullscreenButton/FullscreenButton.vue";

// Helper components
import Section from "./Section.vue";
import ComponentCard from "./ComponentCard.vue";
import ColorBox from "./ColorBox.vue";

// Icons
import PlusIcon from "@/icons/PlusIcon.vue";
import OptionsIcon from "@/icons/OptionsIcon.vue";
import SearchIcon from "@/icons/SearchIcon.vue";

interface SelectOption {
  id: string | number;
  label: string;
  value: string | number;
}

interface TabItem {
  id: string;
  label: string;
}

interface AccordionItem {
  title: string;
  content: string;
}

// State
const currentTheme = ref("default");
const textValue = ref("");
const textAreaValue = ref("");
const autoCompleteValue = ref("");
const selectedValue = ref("option1");
const toggleValue = ref(false);
const activeTab = ref<TabItem>({ id: "tab-1", label: "Tab 1" });
const showModal = ref(false);
const chips = ref(["React", "Vue", "Angular"]);

// Options
const selectOptions: SelectOption[] = [
  { id: 1, label: "Option 1", value: "option1" },
  { id: 2, label: "Option 2", value: "option2" },
  { id: 3, label: "Option 3", value: "option3" },
];

const fruitOptions = [
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
  { label: "Cherry", value: "cherry" },
  { label: "Date", value: "date" },
  { label: "Elderberry", value: "elderberry" },
  { label: "Fig", value: "fig" },
];

const accordionItems: AccordionItem[] = [
  {
    title: "Section 1",
    content:
      "Content for section 1. This demonstrates the accordion component.",
  },
  {
    title: "Section 2",
    content:
      "Content for section 2. Accordions allow collapsible content sections.",
  },
  {
    title: "Section 3",
    content: "Content for section 3. Users can expand/collapse as needed.",
  },
];

const tabItems: TabItem[] = [
  { id: "tab-1", label: "Tab 1" },
  { id: "tab-2", label: "Tab 2" },
  { id: "tab-3", label: "Tab 3" },
];

// Filter function
function filterFruits(
  options: Array<{ label: string; value: string }>,
  query: string
) {
  return options.filter((opt) =>
    opt.label.toLowerCase().includes(query.toLowerCase())
  );
}

// Theme watcher
watch(currentTheme, (newTheme) => {
  if (newTheme === "default") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", newTheme);
  }
});

// Initialize theme on mount
if (currentTheme.value === "default") {
  document.documentElement.removeAttribute("data-theme");
} else {
  document.documentElement.setAttribute("data-theme", currentTheme.value);
}
</script>

<style scoped>
.component-showcase {
  color: var(--on-surface);
}

:deep(label) {
  color: var(--on-surface);
}

:deep(input),
:deep(select),
:deep(textarea) {
  background-color: var(--surface);
  color: var(--on-surface);
  border-color: var(--outline);
}

:deep(input:focus),
:deep(select:focus),
:deep(textarea:focus) {
  border-color: var(--primary);
  outline: none;
}
</style>
