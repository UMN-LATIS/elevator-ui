<template>
  <div class="flex items-center gap-2" data-testid="page-markup-style">
    <Tooltip
      v-if="isCustomHtml && markupLostBySimplifying.length"
      class="max-w-sm"
      :tip="`Turning off Custom HTML will remove ${toMarkupList(
        markupLostBySimplifying
      )}`">
      <button
        type="button"
        aria-label="This page uses HTML the toolbar cannot produce"
        class="inline-flex items-center rounded-full text-warning hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        data-testid="page-markup-warning">
        <TriangleAlertIcon class="size-4" />
      </button>
    </Tooltip>

    <Toggle
      :modelValue="isCustomHtml"
      settingLabel="Custom HTML"
      offLabel="Custom HTML"
      @update:modelValue="handleToggle" />

    <ConfirmModal
      :isOpen="isConfirmingSimpleFormatting"
      title="Turn off Custom HTML?"
      type="warning"
      panelClass="!max-w-4xl"
      confirmLabel="Turn off Custom HTML"
      cancelLabel="Keep Custom HTML"
      @close="isConfirmingSimpleFormatting = false"
      @confirm="emit('chooseMarkupStyle', 'simpleFormatting')">
      <p>
        The toolbar cannot produce every tag and attribute on this page. Turning
        Custom HTML off rewrites the body, removing:
      </p>
      <p class="font-mono mt-1">{{ toMarkupList(markupLostBySimplifying) }}</p>

      <div class="grid gap-3 md:grid-cols-2 mt-4">
        <div>
          <p class="text-xs font-medium uppercase mb-1">Now</p>
          <pre
            class="h-64 overflow-auto rounded border border-outline-variant bg-surface p-2 text-xs whitespace-pre-wrap break-all"
            data-testid="page-markup-diff-before"
            >{{ html }}</pre
          >
        </div>
        <div>
          <p class="text-xs font-medium uppercase mb-1">After</p>
          <pre
            class="h-64 overflow-auto rounded border border-outline-variant bg-surface p-2 text-xs whitespace-pre-wrap break-all"
            data-testid="page-markup-diff-after"
            >{{ htmlAfterSimplifying }}</pre
          >
        </div>
      </div>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { TriangleAlertIcon } from "lucide-vue-next";
import Toggle from "@/components/Toggle/Toggle.vue";
import Tooltip from "@/components/Tooltip/Tooltip.vue";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import { toQuillSimplifiedHtml } from "./toQuillSimplifiedHtml";
import { toMarkupList } from "./markupLostByQuill";
import type { BodyMarkupStyleName } from "./usePageBodyEditor";

const props = defineProps<{
  isCustomHtml: boolean;
  html: string;
  markupLostBySimplifying: string[];
}>();

const emit = defineEmits<{
  (event: "chooseMarkupStyle", name: BodyMarkupStyleName): void;
}>();

const isConfirmingSimpleFormatting = ref(false);
const htmlAfterSimplifying = ref("");

function handleToggle(isCustomHtmlWanted: boolean): void {
  if (isCustomHtmlWanted) {
    emit("chooseMarkupStyle", "customHtml");
    return;
  }

  if (!props.markupLostBySimplifying.length) {
    emit("chooseMarkupStyle", "simpleFormatting");
    return;
  }

  // the dialog shows the rewrite rather than describing it, so run it
  // here on the body as it stands and again for real on confirm
  htmlAfterSimplifying.value = toQuillSimplifiedHtml(props.html);
  isConfirmingSimpleFormatting.value = true;
}
</script>
