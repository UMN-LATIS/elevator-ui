<template>
  <section
    :id="widgetInstanceId"
    class="edit-widget-layout lg:grid lg:grid-cols-[auto,1fr] lg:gap-4 items-start border-b border-neutral-300 pt-3 pb-1"
    :class="{
      'max-h-10 overflow-hidden': !isOpen,
      'cursor-pointer': !isOpen,
    }"
    @click="handleSectionClick">
    <div class="mb-3 lg:mb-0">
      <h2 class="sr-only">
        {{ widgetDef.label }}
      </h2>
      <div
        class="edit-widget-layout__accordion-button-wrapper flex gap-2 justify-between lg:w-48 xl:w-xs items-center bg-white/10 backdrop-blur-md"
        :class="{
          'sticky top-[4rem] z-10': isOpen,
        }">
        <button
          type="button"
          class="flex justify-start gap-2 text-base font-bold leading-none text-left"
          :class="{
            'text-red-700':
              (widgetDef.required && !hasContents) ||
              (hasContents && !isWidgetValid),
          }"
          :aria-expanded="isOpen"
          :aria-controls="`${widgetInstanceId}-content`"
          @click.stop="toggleExpand">
          <ChevronDownIcon v-if="isOpen" class="!size-4" />
          <ChevronRightIcon v-else class="!size-4" />
          {{ widgetDef.label }}
          <span v-if="widgetDef.required" class="text-error">*</span>
        </button>
        <div class="flex items-center gap-2">
          <slot name="moreWidgetActions"></slot>
          <Tooltip v-if="hasContents && isWidgetValid" tip="Content added">
            <CircleFilledCheckIcon class="w-4 h-4 text-success" />
          </Tooltip>
          <Tooltip
            v-else-if="widgetDef.required && !hasContents"
            tip="Required content missing">
            <TriangleAlertIcon class="w-4 h-4 text-error" />
          </Tooltip>
          <Tooltip
            v-else-if="hasContents && !isWidgetValid"
            tip="Invalid content">
            <TriangleAlertIcon class="w-4 h-4 text-error" />
          </Tooltip>
        </div>
      </div>
      <small
        v-show="isOpen"
        class="widget-tooltip block ml-6 my-1"
        :class="[
          (widgetDef.required && !hasContents) ||
          (hasContents && !isWidgetValid)
            ? 'text-error/75'
            : 'text-neutral-500',
        ]">
        {{ widgetDef.tooltip }}
      </small>
    </div>
    <div
      ref="editLayoutContents"
      :aria-labelledby="`${widgetInstanceId}-heading`"
      :class="{
        'opacity-50': !isOpen,
      }">
      <ErrorBoundary>
        <template #fallback>
          <div class="p-4 bg-error-container border border-error rounded-md">
            <h3 class="text-sm text-error font-bold mb-2">Widget Error</h3>
            <p class="text-sm text-error/90">
              An error occurred while rendering this widget. It's possible that
              the
              <Link
                :href="`${config.instance.base.url}/templates/edit/${parentAssetEditor.template?.templateId}`"
                target="_blank"
                class="inline-flex items-center gap-1">
                {{ parentAssetEditor.template?.templateName }}
                template
                <ExternalLinkIcon class="inline-block !size-4" />
              </Link>
              used in this asset is misconfigured.
              <Link
                :href="`${instanceStore.instance.contact}`"
                target="_blank"
                rel="noopener noreferrer">
                Contact your administrator
              </Link>
              for assistance.
            </p>
            <details>
              <summary
                class="mt-2 text-sm text-error underline cursor-pointer">
                View Widget Definition
              </summary>
              <code
                class="bg-error-container rounded border-white p-2 mt-2 block w-full overflow-x-auto">
                <pre>{{ JSON.stringify(widgetDef, null, 2) }}</pre>
              </code>
            </details>
          </div>
        </template>
        <slot name="widgetContents">
          <DragDropContainer :groupId="widgetInstanceId">
            <DragDropList
              :modelValue="widgetContents"
              :listId="widgetDef.widgetId"
              :showEmptyList="false"
              :handleClass="['flex flex-col items-start px-1']"
              listItemClass="bg-black/5 rounded-md mb-1 pr-1"
              @update:modelValue="
                (widgetContents) => {
                  $emit('update:widgetContents', widgetContents);
                }
              ">
              <template #item="{ item }: { item: T }">
                <div
                  class="grid grid-cols-[auto,1fr,auto] gap-2 py-2 items-start">
                  <div>
                    <Tooltip tip="Set as Primary">
                      <button
                        type="button"
                        class="flex items-center justify-center p-1 rounded-sm hover:bg-neutral-100"
                        :class="{
                          // hide the button if there is only one item
                          // using invisible instead of hidden to keep the layout
                          // consistent with other widgets
                          invisible: !isOpen || widgetContents.length < 2,
                        }"
                        @click="$emit('setPrimary', item.id)">
                        <StarIcon
                          class="w-4 h-4"
                          :class="[
                            item.isPrimary
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-neutral-400',
                          ]" />
                        <span class="sr-only">Set as Primary</span>
                      </button>
                    </Tooltip>
                  </div>
                  <div class="py-1">
                    <slot name="fieldContents" :item="item" />
                  </div>
                  <div>
                    <button
                      v-if="
                        // primarily we want to prevent users from deleting
                        // an item if there's no way to add it back
                        // if `allowMultiple` is false, they won't have a button
                        // to add a new item
                        widgetDef.allowMultiple ||
                        // but it's possible that the widget previously
                        // had multiple items, so we should let them delete
                        // if there's more than one item
                        widgetContents.length > 1 ||
                        // for upload widget, the user will have access to
                        // the upload input if they remove items
                        // so it's fine to let them delete
                        widgetDef.type === Types.WIDGET_TYPES.UPLOAD
                      "
                      :class="[
                        'text-neutral-400 hover:text-red-600 p-2 rounded-sm -mt-2 -mr-1',
                        {
                          'sr-only': !isOpen,
                        },
                      ]"
                      type="button"
                      @click="$emit('delete', item.id)">
                      <XIcon class="!size-4" />
                      <span class="sr-only">Delete</span>
                    </button>
                  </div>
                </div>
              </template>
              <template #footer>
                <slot name="footer">
                  <div
                    v-if="widgetDef.allowMultiple"
                    class="flex justify-center">
                    <Button variant="tertiary" @click="$emit('add')">
                      <PlusIcon class="w-4 h-4" />
                      {{ widgetDef.label }}
                    </Button>
                  </div>
                </slot>
              </template>
            </DragDropList>
          </DragDropContainer>
        </slot>
      </ErrorBoundary>
    </div>
  </section>
</template>
<script setup lang="ts" generic="T extends Types.WithId<Types.WidgetContent>">
import { DragDropContainer, DragDropList } from "@/components/DragDropList";
import Button from "@/components/Button/Button.vue";
import {
  ExternalLinkIcon,
  PlusIcon,
  StarIcon,
  TriangleAlertIcon,
} from "lucide-vue-next";
import * as Types from "@/types";
import Tooltip from "@/components/Tooltip/Tooltip.vue";
import { ChevronDownIcon, ChevronRightIcon, XIcon } from "@/icons";
import { computed, useTemplateRef, watch } from "vue";
import { hasWidgetContent } from "@/helpers/hasWidgetContent";
import CircleFilledCheckIcon from "@/icons/CircleFilledCheckIcon.vue";
import { useFocusWithin } from "@vueuse/core";
import { useAssetEditor } from "../useAssetEditor/useAssetEditor";
import invariant from "tiny-invariant";
import { useAssetValidation } from "../useAssetEditor/useAssetValidation";
import config from "@/config";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary.vue";
import Link from "@/components/Link/Link.vue";
import { useInstanceStore } from "@/stores/instanceStore";

const props = defineProps<{
  widgetContents: T[];
  widgetDef: Types.WidgetDef;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "add"): void;
  (e: "setPrimary", id: string): void;
  (e: "delete", id: string): void;
  (
    e: "update:widgetContents",
    widgetContents: Types.WithId<Types.WidgetContent>[]
  ): void;
  (e: "update:isOpen", isOpen: boolean): void;
}>();

const editLayoutContentsRef = useTemplateRef<HTMLElement>("editLayoutContents");

const { focused: isFocusedWithin } = useFocusWithin(
  editLayoutContentsRef.value
);

const parentAssetEditor = useAssetEditor();
const instanceStore = useInstanceStore();

const assetValidation = useAssetValidation();

const widgetInstanceId = computed(() => {
  invariant(
    parentAssetEditor,
    "Asset editor not found. Make sure this component is used within an AssetEditor context."
  );
  return parentAssetEditor.getWidgetInstanceId(props.widgetDef.widgetId);
});

const validation = computed(() => {
  return assetValidation.widgetValidations.value.find(
    (v) => v.id === widgetInstanceId.value
  );
});

const isWidgetValid = computed(() => {
  return validation.value?.isValid;
});

watch(isFocusedWithin, (isFocused) => {
  if (isFocused) {
    emit("update:isOpen", true);
  }
});

// Only expand the component if it's not already expanded
const handleSectionClick = () => {
  if (!props.isOpen) {
    emit("update:isOpen", true);
  }
};

const toggleExpand = (event: Event) => {
  // prevent the click of the collapse button from bubbling up
  // and triggering the handleSectionClick function
  // which would expand the component again
  event.stopPropagation();
  emit("update:isOpen", !props.isOpen);
};

const hasContents = computed(() =>
  hasWidgetContent(props.widgetContents, props.widgetDef.type)
);
</script>
<style>
.edit-widget-layout .drag-drop-list {
  --dnd-dragHandle-bg: transparent;
  --dnd-listItem-border: 1px solid transparent;

  & .drop-indicator.drop-indicator--top {
    top: -4px;
  }
  & .drop-indicator.drop-indicator--bottom {
    bottom: -3px;
  }

  & .drag-handle {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
}
</style>
