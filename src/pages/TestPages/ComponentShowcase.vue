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
            <option value="folwell">Folwell (UMN)</option>
            <option value="st-thomas">St. Thomas</option>
            <option value="hotdog">Hotdog</option>
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
          <ComponentCard label="Primary">
            <IconButton title="Add" class="bg-primary text-on-primary">
              <PlusIcon class="w-6 h-6" />
            </IconButton>
          </ComponentCard>
          <ComponentCard label="Secondary">
            <IconButton title="Edit" class="bg-secondary text-on-secondary">
              <PlusIcon class="w-6 h-6" />
            </IconButton>
          </ComponentCard>
          <ComponentCard label="Tertiary">
            <IconButton title="More" class="bg-tertiary text-on-tertiary">
              <OptionsIcon class="w-6 h-6" />
            </IconButton>
          </ComponentCard>
          <ComponentCard label="Disabled">
            <IconButton title="Disabled" disabled>
              <PlusIcon class="w-6 h-6" />
            </IconButton>
          </ComponentCard>
        </div>
      </Section>

      <!-- Input Components Section -->
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

      <!-- Select/Dropdown Components -->
      <Section title="Select & Dropdown">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ComponentCard label="SelectGroup">
            <SelectGroup
              v-model="selectedValue"
              label="Select Option"
              :options="selectOptions" />
          </ComponentCard>
          <ComponentCard label="DropDown">
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

      <!-- Avatar & Media -->
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

      <!-- Panel -->
      <Section title="Panel">
        <Panel label="Panel Title" :isOpen="true">
          <p class="text-on-surface">
            This is the panel content. Panels provide a contained area for
            content.
          </p>
        </Panel>
      </Section>

      <!-- Accordion -->
      <Section title="Accordion">
        <Accordion :items="accordionItems" />
      </Section>

      <!-- Tabs -->
      <Section title="Tabs">
        <Tabs
          :activeTabId="activeTab.id"
          :onTabChange="(tab) => (activeTab = tab)"
          :tabs="tabItems" />
      </Section>

      <!-- Links & Interactive -->
      <Section title="Links & Interactive">
        <div class="space-y-4">
          <ComponentCard label="Link">
            <Link href="#" class="text-primary hover:underline">
              Click me (Link)
            </Link>
          </ComponentCard>

          <ComponentCard label="Notification">
            <Notification
              type="info"
              title="Information"
              message="This is an informational notification." />
          </ComponentCard>
        </div>
      </Section>

      <!-- Modal Example -->
      <Section title="Modal">
        <ComponentCard label="Modal">
          <div class="space-y-2">
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
          </div>
        </ComponentCard>
      </Section>

      <!-- Color Palette Reference -->
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

// Helper components
import Section from "./Section.vue";
import ComponentCard from "./ComponentCard.vue";
import ColorBox from "./ColorBox.vue";

// Icons
import PlusIcon from "@/icons/PlusIcon.vue";
import OptionsIcon from "@/icons/OptionsIcon.vue";

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
const selectedValue = ref("option1");
const toggleValue = ref(false);
const activeTab = ref<TabItem>({ id: "tab-1", label: "Tab 1" });
const showModal = ref(false);

const chips = ref(["React", "Vue", "Angular"]);

// Options for selectors
const selectOptions: SelectOption[] = [
  { id: 1, label: "Option 1", value: "option1" },
  { id: 2, label: "Option 2", value: "option2" },
  { id: 3, label: "Option 3", value: "option3" },
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

// Watch theme changes
watch(currentTheme, (newTheme) => {
  document.documentElement.setAttribute("data-theme", newTheme);
});

// Set initial theme
document.documentElement.setAttribute("data-theme", currentTheme.value);
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
  background-color: oklch(var(--surface));
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
