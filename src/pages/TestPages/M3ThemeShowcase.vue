<template>
  <div class="min-h-screen bg-surface">
    <!-- Header with Theme Selector -->
    <div class="sticky top-0 z-50 bg-surface-container-high shadow-md">
      <div
        class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-on-surface">
          Material Design 3 Theme Showcase
        </h1>
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium text-on-surface">Theme:</label>
          <select
            v-model="currentTheme"
            class="px-3 py-2 rounded border border-outline bg-surface text-on-surface">
            <option value="default">Light (Default)</option>
            <option value="dark">Dark</option>
            <option value="primary-tint">Primary Tint (color-mix)</option>
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
            <option value="natural">Natural</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-6 py-8 space-y-12">
      <!-- Surface Colors -->
      <Section title="Surface Hierarchy">
        <p class="text-on-surface-variant mb-6">
          Surface colors create visual depth through tone. Each level indicates
          different elevation or prominence without relying on shadows.
        </p>
        <div class="space-y-6">
          <!-- Base Surface -->
          <div class="p-8 bg-surface rounded-lg border border-outline">
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-on-surface">
                surface (Base)
              </h3>
              <p class="text-sm text-on-surface-variant">
                Default page/app background
              </p>
            </div>

            <!-- Surface Variants within Base Surface -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div
                class="p-4 bg-surface-dim rounded border border-outline-variant">
                <div class="text-sm font-medium text-on-surface">
                  surface-dim
                </div>
                <div class="text-xs text-on-surface-variant">
                  Reduced emphasis backgrounds
                </div>
              </div>
              <div
                class="p-4 bg-surface-bright rounded border border-outline-variant">
                <div class="text-sm font-medium text-on-surface">
                  surface-bright
                </div>
                <div class="text-xs text-on-surface-variant">
                  Elevated/highlighted backgrounds
                </div>
              </div>
            </div>

            <!-- Surface Container Hierarchy -->
            <div class="space-y-3">
              <h4 class="text-sm font-semibold text-on-surface">
                Surface Containers (Nested from lowest to highest):
              </h4>
              <div
                class="p-6 bg-surface-container-lowest rounded border border-outline-variant">
                <div class="text-sm font-medium text-on-surface mb-2">
                  surface-container-lowest
                </div>
                <div class="p-5 bg-surface-container-low rounded">
                  <div class="text-sm font-medium text-on-surface mb-2">
                    surface-container-low
                  </div>
                  <div class="p-4 bg-surface-container rounded">
                    <div class="text-sm font-medium text-on-surface mb-2">
                      surface-container (default)
                    </div>
                    <div class="p-4 bg-surface-container-high rounded">
                      <div class="text-sm font-medium text-on-surface mb-2">
                        surface-container-high
                      </div>
                      <div class="p-3 bg-surface-container-highest rounded">
                        <div class="text-sm font-medium text-on-surface">
                          surface-container-highest
                        </div>
                        <div class="text-xs text-on-surface-variant mt-1">
                          Most prominent elevation
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Contrast Grid -->
          <div>
            <h4 class="text-sm font-semibold text-on-surface mb-3">
              Surface Container Contrast Comparison:
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
              <ColorSwatch
                label="lowest"
                bgClass="bg-surface-container-lowest"
                textClass="text-on-surface" />
              <ColorSwatch
                label="low"
                bgClass="bg-surface-container-low"
                textClass="text-on-surface" />
              <ColorSwatch
                label="default"
                bgClass="bg-surface-container"
                textClass="text-on-surface" />
              <ColorSwatch
                label="high"
                bgClass="bg-surface-container-high"
                textClass="text-on-surface" />
              <ColorSwatch
                label="highest"
                bgClass="bg-surface-container-highest"
                textClass="text-on-surface" />
            </div>
          </div>
        </div>
      </Section>

      <!-- Text Color Hierarchy -->
      <Section title="Text on Surface">
        <div class="p-6 bg-surface rounded-lg border border-outline space-y-4">
          <div>
            <div class="text-2xl font-bold text-on-surface">
              Primary Text (on-surface)
            </div>
            <div class="text-sm text-on-surface-variant">
              Use for main headings and important content
            </div>
          </div>
          <div>
            <div class="text-lg text-on-surface-variant">
              Secondary Text (on-surface-variant)
            </div>
            <div class="text-sm text-on-surface-variant">
              Use for secondary information, captions, and supporting text
            </div>
          </div>
          <div class="flex gap-4 items-center">
            <span class="text-on-surface">Default emphasis</span>
            <span class="text-on-surface-variant">Lower emphasis</span>
          </div>
        </div>
      </Section>

      <!-- Accent Colors -->
      <Section title="Accent Colors">
        <!-- Primary -->
        <div class="mb-8">
          <h3 class="text-lg font-semibold text-on-surface mb-3">
            Primary - Main Interactive Color
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-6 bg-primary rounded-lg">
              <div class="text-on-primary font-medium">primary</div>
              <div class="text-sm text-on-primary opacity-80">
                on-primary text
              </div>
              <button
                class="mt-4 px-4 py-2 bg-on-primary text-primary rounded font-medium">
                Button on Primary
              </button>
            </div>
            <div class="p-6 bg-primary-container rounded-lg">
              <div class="text-on-primary-container font-medium">
                primary-container
              </div>
              <div class="text-sm text-on-primary-container opacity-80">
                Tonal background for grouped content
              </div>
              <div class="mt-4 p-3 bg-primary rounded">
                <div class="text-sm text-on-primary">
                  Primary accent within container
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Secondary -->
        <div class="mb-8">
          <h3 class="text-lg font-semibold text-on-surface mb-3">
            Secondary - Supporting Accent
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-6 bg-secondary rounded-lg">
              <div class="text-on-secondary font-medium">secondary</div>
              <div class="text-sm text-on-secondary opacity-80">
                on-secondary text
              </div>
            </div>
            <div class="p-6 bg-secondary-container rounded-lg">
              <div class="text-on-secondary-container font-medium">
                secondary-container
              </div>
              <div class="text-sm text-on-secondary-container opacity-80">
                Tonal background for secondary content
              </div>
            </div>
          </div>
        </div>

        <!-- Tertiary -->
        <div class="mb-8">
          <h3 class="text-lg font-semibold text-on-surface mb-3">
            Tertiary - Contrasting Accent
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-6 bg-tertiary rounded-lg">
              <div class="text-on-tertiary font-medium">tertiary</div>
              <div class="text-sm text-on-tertiary opacity-80">
                on-tertiary text
              </div>
            </div>
            <div class="p-6 bg-tertiary-container rounded-lg">
              <div class="text-on-tertiary-container font-medium">
                tertiary-container
              </div>
              <div class="text-sm text-on-tertiary-container opacity-80">
                Tonal background for special highlights
              </div>
            </div>
          </div>
        </div>
      </Section>

      <!-- Semantic States -->
      <Section title="Semantic State Colors">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Error -->
          <div class="space-y-3">
            <div class="p-4 bg-error rounded-lg">
              <div class="text-on-error font-medium">error</div>
              <div class="text-sm text-on-error opacity-80">
                Destructive actions
              </div>
            </div>
            <div class="p-4 bg-error-container rounded-lg">
              <div class="text-on-error-container font-medium">
                error-container
              </div>
              <div class="text-sm text-on-error-container opacity-80">
                Error background
              </div>
            </div>
          </div>

          <!-- Success -->
          <div class="space-y-3">
            <div class="p-4 bg-success rounded-lg">
              <div class="text-on-success font-medium">success</div>
              <div class="text-sm text-on-success opacity-80">
                Positive feedback
              </div>
            </div>
            <div class="p-4 bg-success-container rounded-lg">
              <div class="text-on-success-container font-medium">
                success-container
              </div>
              <div class="text-sm text-on-success-container opacity-80">
                Success background
              </div>
            </div>
          </div>

          <!-- Warning -->
          <div class="space-y-3">
            <div class="p-4 bg-warning rounded-lg">
              <div class="text-on-warning font-medium">warning</div>
              <div class="text-sm text-on-warning opacity-80">
                Caution states
              </div>
            </div>
            <div class="p-4 bg-warning-container rounded-lg">
              <div class="text-on-warning-container font-medium">
                warning-container
              </div>
              <div class="text-sm text-on-warning-container opacity-80">
                Warning background
              </div>
            </div>
          </div>

          <!-- Info -->
          <div class="space-y-3">
            <div class="p-4 bg-info rounded-lg">
              <div class="text-on-info font-medium">info</div>
              <div class="text-sm text-on-info opacity-80">Informational</div>
            </div>
            <div class="p-4 bg-info-container rounded-lg">
              <div class="text-on-info-container font-medium">
                info-container
              </div>
              <div class="text-sm text-on-info-container opacity-80">
                Info background
              </div>
            </div>
          </div>
        </div>
      </Section>

      <!-- Outline Colors -->
      <Section title="Outline & Borders">
        <div class="space-y-4">
          <div
            class="p-6 bg-surface-container rounded-lg border-2 border-outline">
            <div class="text-on-surface font-medium mb-2">
              outline (border-outline)
            </div>
            <div class="text-sm text-on-surface-variant">
              Important borders: inputs, focused elements, strong separators
            </div>
          </div>
          <div
            class="p-6 bg-surface-container rounded-lg border border-outline-variant">
            <div class="text-on-surface font-medium mb-2">
              outline-variant (border-outline-variant)
            </div>
            <div class="text-sm text-on-surface-variant">
              Decorative borders: dividers, subtle separators
            </div>
          </div>
        </div>
      </Section>

      <!-- Inverse Colors -->
      <Section title="Inverse Colors">
        <p class="text-on-surface-variant mb-4">
          For elements that contrast with the main surface, like tooltips or
          snackbars
        </p>
        <div class="p-8 bg-inverse-surface rounded-lg">
          <div class="text-inverse-on-surface text-lg font-medium mb-2">
            inverse-surface
          </div>
          <div class="text-inverse-on-surface opacity-80 mb-4">
            Text uses inverse-on-surface for readability
          </div>
          <div
            class="inline-block px-4 py-2 bg-inverse-primary rounded text-inverse-surface font-medium">
            inverse-primary interactive element
          </div>
        </div>
      </Section>

      <!-- Practical Example: Card Layout -->
      <Section title="Practical Example: Card Layout">
        <div class="p-6 bg-surface-container-low rounded-lg space-y-4">
          <div class="p-6 bg-surface-container rounded-lg shadow-sm">
            <h3 class="text-xl font-bold text-on-surface mb-2">
              Example Card Title
            </h3>
            <p class="text-on-surface-variant mb-4">
              This card demonstrates how different surface containers create
              visual hierarchy. The outer container uses surface-container-low,
              while this card uses surface-container to appear elevated.
            </p>
            <div class="p-4 bg-surface-container-high rounded mb-4">
              <div class="text-sm font-medium text-on-surface mb-2">
                Nested Section (surface-container-high)
              </div>
              <p class="text-sm text-on-surface-variant">
                This nested section stands out with higher container level.
              </p>
            </div>
            <div class="flex gap-3">
              <button
                class="px-4 py-2 bg-primary text-on-primary rounded font-medium">
                Primary Action
              </button>
              <button
                class="px-4 py-2 bg-secondary text-on-secondary rounded font-medium">
                Secondary
              </button>
              <button
                class="px-4 py-2 border border-outline text-on-surface rounded font-medium">
                Outlined
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 bg-success-container rounded">
              <div class="text-sm font-medium text-on-success-container">
                Success State
              </div>
            </div>
            <div class="p-4 bg-warning-container rounded">
              <div class="text-sm font-medium text-on-warning-container">
                Warning State
              </div>
            </div>
            <div class="p-4 bg-error-container rounded">
              <div class="text-sm font-medium text-on-error-container">
                Error State
              </div>
            </div>
          </div>
        </div>
      </Section>

      <!-- Practical Example: Form Inputs -->
      <Section title="Practical Example: Form Inputs">
        <p class="text-on-surface-variant mb-6">
          Form inputs demonstrate how interactive elements use surface, outline,
          and accent colors to show state changes.
        </p>
        <div class="p-6 bg-surface-container rounded-lg space-y-6">
          <!-- Text Input -->
          <div class="space-y-2">
            <label
              for="text-input"
              class="block text-sm font-medium text-on-surface">
              Text Input
            </label>
            <input
              id="text-input"
              v-model="sampleText"
              type="text"
              placeholder="Enter some text..."
              class="w-full px-4 py-2 bg-surface border-2 border-outline rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors" />
            <p class="text-xs text-on-surface-variant">
              Uses surface background with outline border. Focus state shows
              primary color.
            </p>
          </div>

          <!-- Text Area -->
          <div class="space-y-2">
            <label
              for="textarea-input"
              class="block text-sm font-medium text-on-surface">
              Text Area
            </label>
            <textarea
              id="textarea-input"
              v-model="sampleTextArea"
              rows="3"
              placeholder="Enter multiple lines..."
              class="w-full px-4 py-2 bg-surface border-2 border-outline rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors resize-none"></textarea>
          </div>

          <!-- Select Dropdown -->
          <div class="space-y-2">
            <label
              for="select-input"
              class="block text-sm font-medium text-on-surface">
              Select Dropdown
            </label>
            <select
              id="select-input"
              v-model="sampleSelect"
              class="w-full px-4 py-2 bg-surface border-2 border-outline rounded-lg text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors">
              <option value="">Choose an option...</option>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
            </select>
          </div>

          <!-- Checkbox -->
          <div class="flex items-center gap-3">
            <input
              id="checkbox-input"
              v-model="sampleCheckbox"
              type="checkbox"
              class="w-5 h-5 rounded border-2 border-outline text-primary focus:ring-2 focus:ring-primary/20 bg-surface" />
            <label for="checkbox-input" class="text-sm text-on-surface">
              Checkbox uses primary color when checked
            </label>
          </div>

          <!-- Radio Buttons -->
          <div class="space-y-2">
            <p class="text-sm font-medium text-on-surface">Radio Buttons</p>
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <input
                  id="radio1"
                  v-model="sampleRadio"
                  type="radio"
                  value="radio1"
                  class="w-4 h-4 border-2 border-outline text-primary focus:ring-2 focus:ring-primary/20" />
                <label for="radio1" class="text-sm text-on-surface">
                  Radio Option 1
                </label>
              </div>
              <div class="flex items-center gap-3">
                <input
                  id="radio2"
                  v-model="sampleRadio"
                  type="radio"
                  value="radio2"
                  class="w-4 h-4 border-2 border-outline text-primary focus:ring-2 focus:ring-primary/20" />
                <label for="radio2" class="text-sm text-on-surface">
                  Radio Option 2
                </label>
              </div>
            </div>
          </div>

          <!-- Disabled Input -->
          <div class="space-y-2">
            <label
              for="disabled-input"
              class="block text-sm font-medium text-on-surface-variant">
              Disabled Input
            </label>
            <input
              id="disabled-input"
              type="text"
              disabled
              value="This input is disabled"
              class="w-full px-4 py-2 bg-surface-container-low border-2 border-outline-variant rounded-lg text-on-surface-variant cursor-not-allowed opacity-60" />
          </div>

          <!-- Input with Error State -->
          <div class="space-y-2">
            <label
              for="error-input"
              class="block text-sm font-medium text-on-surface">
              Input with Error
            </label>
            <input
              id="error-input"
              v-model="errorInput"
              type="text"
              placeholder="Must be at least 5 characters"
              class="w-full px-4 py-2 bg-surface border-2 rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none transition-colors"
              :class="
                errorInput.length > 0 && errorInput.length < 5
                  ? 'border-error focus:ring-2 focus:ring-error/20'
                  : 'border-outline focus:border-primary focus:ring-2 focus:ring-primary/20'
              " />
            <p
              v-if="errorInput.length > 0 && errorInput.length < 5"
              class="text-xs text-error">
              Error: Input must be at least 5 characters
            </p>
          </div>

          <!-- Input with Success State -->
          <div class="space-y-2">
            <label
              for="success-input"
              class="block text-sm font-medium text-on-surface">
              Input with Success
            </label>
            <input
              id="success-input"
              v-model="successInput"
              type="email"
              placeholder="Enter your email"
              class="w-full px-4 py-2 bg-surface border-2 rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none transition-colors"
              :class="
                successInput.includes('@') && successInput.includes('.')
                  ? 'border-success focus:ring-2 focus:ring-success/20'
                  : 'border-outline focus:border-primary focus:ring-2 focus:ring-primary/20'
              " />
            <p
              v-if="successInput.includes('@') && successInput.includes('.')"
              class="text-xs text-success">
              ✓ Valid email format
            </p>
          </div>
        </div>
      </Section>

      <!-- Practical Example: Modal with Backdrop -->
      <Section title="Practical Example: Modal with Backdrop">
        <p class="text-on-surface-variant mb-6">
          Modals use scrim (backdrop), inverse colors, and elevated surfaces to
          draw focus and create clear visual hierarchy.
        </p>
        <div class="p-6 bg-surface-container rounded-lg">
          <button
            class="px-6 py-3 bg-primary text-on-primary rounded-lg font-medium hover:opacity-90 transition-opacity"
            @click="showModal = true">
            Open Modal
          </button>
          <p class="text-sm text-on-surface-variant mt-4">
            Click to see how the modal uses scrim overlay,
            surface-container-highest for the dialog, and proper text contrast.
          </p>
        </div>

        <!-- Modal -->
        <Teleport to="body">
          <Transition name="modal">
            <div
              v-if="showModal"
              class="fixed inset-0 z-50 flex items-center justify-center p-4"
              @click.self="showModal = false">
              <!-- Scrim/Backdrop -->
              <div
                class="absolute inset-0 bg-scrim/60 backdrop-blur-sm"
                @click="showModal = false"></div>

              <!-- Modal Dialog -->
              <div
                class="relative bg-surface-container-highest rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                @click.stop>
                <!-- Modal Header -->
                <div class="px-6 pt-6 pb-4 border-b border-outline-variant">
                  <h3 class="text-xl font-bold text-on-surface">Modal Title</h3>
                  <p class="text-sm text-on-surface-variant mt-1">
                    surface-container-highest with scrim backdrop
                  </p>
                </div>

                <!-- Modal Content -->
                <div class="px-6 py-4 space-y-4">
                  <p class="text-on-surface">
                    This modal demonstrates several M3 design principles:
                  </p>
                  <ul
                    class="list-disc list-inside space-y-2 text-on-surface-variant text-sm">
                    <li>
                      <strong class="text-on-surface">Scrim overlay:</strong>
                      The backdrop uses scrim color at 60% opacity with blur
                    </li>
                    <li>
                      <strong class="text-on-surface">Elevated surface:</strong>
                      Dialog uses surface-container-highest for prominence
                    </li>
                    <li>
                      <strong class="text-on-surface">Clear hierarchy:</strong>
                      Border dividers and proper spacing
                    </li>
                    <li>
                      <strong class="text-on-surface">Accessible text:</strong>
                      on-surface and on-surface-variant for contrast
                    </li>
                  </ul>

                  <!-- Example form in modal -->
                  <div class="p-4 bg-surface-container rounded-lg space-y-3">
                    <label
                      for="modal-input"
                      class="block text-sm font-medium text-on-surface">
                      Input within modal
                    </label>
                    <input
                      id="modal-input"
                      v-model="modalInput"
                      type="text"
                      placeholder="Shows surface contrast..."
                      class="w-full px-3 py-2 bg-surface border-2 border-outline rounded text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    <p class="text-xs text-on-surface-variant">
                      Input uses surface, creating contrast within the modal's
                      surface-container-highest
                    </p>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div
                  class="px-6 py-4 bg-surface-container border-t border-outline-variant flex justify-end gap-3">
                  <button
                    class="px-4 py-2 text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
                    @click="showModal = false">
                    Cancel
                  </button>
                  <button
                    class="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium hover:opacity-90 transition-opacity"
                    @click="showModal = false">
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </Teleport>
      </Section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import Section from "./Section.vue";
import ColorSwatch from "./ColorSwatch.vue";

const currentTheme = ref("default");

// Form input states
const sampleText = ref("");
const sampleTextArea = ref("");
const sampleSelect = ref("");
const sampleCheckbox = ref(false);
const sampleRadio = ref("radio1");
const errorInput = ref("");
const successInput = ref("");

// Modal state
const showModal = ref(false);
const modalInput = ref("");

watch(
  currentTheme,
  (newTheme) => {
    if (newTheme === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* Modal transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-surface-container-highest,
.modal-leave-active .bg-surface-container-highest {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from .bg-surface-container-highest {
  transform: scale(0.9);
  opacity: 0;
}

.modal-leave-to .bg-surface-container-highest {
  transform: scale(0.9);
  opacity: 0;
}
</style>
