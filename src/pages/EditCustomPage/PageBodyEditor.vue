<template>
  <div class="page-body-editor">
    <!-- rich mode reuses TextEditorGroup's label row, source mode renders
         its own matching row for the textarea. Deliberate duplication to
         keep label/control a11y wiring in one place each. -->
    <div v-if="mode === 'source'">
      <div class="flex justify-between items-baseline mb-2">
        <label
          :for="`page-body-source-${id}`"
          class="block text-xs font-medium text-on-surface uppercase">
          {{ label }}
        </label>
        <ModeToggle :mode="mode" @update:mode="handleModeToggle" />
      </div>

      <Notification
        v-if="markupQuillWouldRemove.length > 0"
        title="The visual editor can't keep this HTML"
        type="info"
        class="mb-2 !max-w-full"
        data-testid="page-body-source-notice">
        <p>
          Editing here preserves everything. Switching to the visual editor
          would remove:
        </p>
        <ul class="list-disc ml-6 mt-2 font-mono text-sm">
          <li v-for="item in markupQuillWouldRemove" :key="item">
            {{ toMarkupLabel(item) }}
          </li>
        </ul>
        <div class="mt-4">
          <Button variant="tertiary" @click="requestRichMode">
            Use the visual editor anyway
          </Button>
        </div>
      </Notification>

      <div class="grid gap-4 lg:grid-cols-2">
        <textarea
          :id="`page-body-source-${id}`"
          v-model="sourceDraft"
          rows="20"
          class="w-full font-mono text-sm bg-surface-container border border-outline-variant rounded-lg p-3 focus:ring-2 focus:ring-primary focus:outline-none"
          data-testid="page-body-source-textarea"
          spellcheck="false"
          @input="emit('edited')" />
        <div
          class="border border-outline-variant rounded-lg p-3 overflow-auto"
          data-testid="page-body-preview">
          <p class="text-xs font-medium text-on-surface-variant uppercase mb-2">
            Preview
          </p>
          <SanitizedHTML
            :html="sourceDraft"
            :addTags="['style']"
            class="prose prose-neutral max-w-none" />
        </div>
      </div>
    </div>

    <TextEditorGroup
      v-else
      ref="richEditorRef"
      v-model="richDraft"
      :label="label"
      enableImageInsert
      :enableHtmlEditButton="false"
      @userInput="emit('edited')">
      <template #corner>
        <ModeToggle :mode="mode" @update:mode="handleModeToggle" />
      </template>
    </TextEditorGroup>

    <ConfirmModal
      :isOpen="isConfirmingRichMode"
      title="Switch to the visual editor?"
      type="warning"
      confirmLabel="I understand, switch"
      cancelLabel="Keep editing HTML"
      @close="isConfirmingRichMode = false"
      @confirm="enterRichMode">
      <p>The visual editor will remove HTML it can't represent:</p>
      <ul class="list-disc ml-6 mt-2 font-mono text-sm">
        <li v-for="item in markupPendingRemoval" :key="item">
          {{ toMarkupLabel(item) }}
        </li>
      </ul>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useId } from "vue";
import { useDebounce } from "@vueuse/core";
import TextEditorGroup from "@/components/TextEditorGroup/TextEditorGroup.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import Notification from "@/components/Notification/Notification.vue";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import Button from "@/components/Button/Button.vue";
import ModeToggle from "./PageBodyModeToggle.vue";
import { markupLostByQuill } from "./markupLostByQuill";

const props = withDefaults(
  defineProps<{
    // the stored page body, already loaded when this component mounts
    body: string;
    label?: string;
  }>(),
  {
    label: "Body",
  }
);

const emit = defineEmits<{
  // fired on any user edit, and on a confirmed switch into the visual
  // editor, since that rewrite is user-authorized
  (event: "edited"): void;
}>();

const id = useId();

const sourceDraft = ref(props.body);
const richDraft = ref(props.body);
const richEditorRef = ref<InstanceType<typeof TextEditorGroup>>();

// markupLostByQuill runs clipboard.convert, which costs tens of
// milliseconds on a large body (measured 48 ms at 13 kB), so the live
// answer trails typing rather than running on every keystroke.
const settledSourceDraft = useDebounce(sourceDraft, 400);

/** What the visual editor would strip from the source draft as it stands. */
const markupQuillWouldRemove = computed(() =>
  markupLostByQuill(settledSourceDraft.value)
);

type EditorMode = "source" | "rich";
const mode = ref<EditorMode>(
  markupQuillWouldRemove.value.length ? "source" : "rich"
);

const isConfirmingRichMode = ref(false);
// captured when the confirm opens, so the dialog names what was actually
// checked rather than whatever the debounce had settled on
const markupPendingRemoval = ref<string[]>([]);

function toMarkupLabel(item: string): string {
  return item.startsWith("@") ? `${item.slice(1)} (attribute)` : `<${item}>`;
}

function handleModeToggle(nextMode: EditorMode): void {
  if (nextMode === mode.value) return;
  if (nextMode === "rich") {
    requestRichMode();
    return;
  }

  // leaving the visual editor only reads quill out, no confirm needed
  sourceDraft.value = richEditorRef.value?.getSemanticHtml() ?? richDraft.value;
  mode.value = "source";
}

function requestRichMode(): void {
  // check the draft as typed, not the debounced copy, in case the admin
  // clicks within the debounce window
  const wouldRemove = markupLostByQuill(sourceDraft.value);

  if (wouldRemove.length === 0) {
    // nothing to destroy, so no consent needed, and no edited mark
    // either: an untouched body still saves verbatim
    richDraft.value = sourceDraft.value;
    mode.value = "rich";
    return;
  }

  markupPendingRemoval.value = wouldRemove;
  isConfirmingRichMode.value = true;
}

function enterRichMode(): void {
  isConfirmingRichMode.value = false;
  richDraft.value = sourceDraft.value;
  mode.value = "rich";
  emit("edited");
}

/** The HTML to persist, read from whichever mode is active. */
function getBodyToSave(): string {
  if (mode.value === "source") return sourceDraft.value;
  return richEditorRef.value?.getSemanticHtml() ?? richDraft.value;
}

defineExpose({
  getBodyToSave,
});
</script>
