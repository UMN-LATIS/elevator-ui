<template>
  <nav class="toc-container">
    <h2
      class="text-xs tracking-wide font-medium text-neutral-700 uppercase mb-2">
      {{ title }}
    </h2>
    <ol class="text-sm">
      <li v-for="item in tocItems" :key="item.id">
        <a
          :href="`#${item.id}`"
          class="flex items-center justify-between transition-colors duration-200 no-underline hover:no-underline py-1 pl-3"
          :class="{
            'text-blue-700 font-medium border-blue-700 bg-white/50 hover:bg-white/75 rounded-sm':
              activeId === item.id,
            'text-black/50 hover:bg-transparent': activeId !== item.id,
          }"
          @click.prevent="scrollToSection(item.id)">
          <div
            :class="{
              'text-red-700':
                (item.isRequired && !item.hasContent) ||
                (item.hasContent && !item.isValid),
            }">
            {{ item.label }}
            <span v-if="item.isRequired" class="text-red-500">*</span>
          </div>
          <div>
            <Tooltip v-if="item.hasContent && item.isValid" tip="has content">
              <CircleFilledCheckIcon class="w-4 h-4 text-green-600" />
            </Tooltip>
            <Tooltip
              v-else-if="!item.hasContent && item.isRequired"
              tip="Required content missing">
              <TriangleAlertIcon class="w-4 h-4 text-red-500" />
            </Tooltip>
            <Tooltip
              v-else-if="item.hasContent && !item.isRequired && !item.isValid"
              tip="content invalid">
              <TriangleAlertIcon class="w-4 h-4 text-red-500" />
            </Tooltip>
            <Tooltip v-else tip="empty">
              <CircleIcon class="size-4 text-neutral-300" />
            </Tooltip>
          </div>
        </a>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { CircleFilledCheckIcon } from "@/icons";
import { CircleIcon, TriangleAlertIcon } from "lucide-vue-next";
import { onMounted, onUnmounted, reactive, computed } from "vue";
import Tooltip from "@/components/Tooltip/Tooltip.vue";
import { useAssetValidation } from "../useAssetEditor/useAssetValidation";

const props = withDefaults(
  defineProps<{
    title?: string;
    offset?: number;
  }>(),
  {
    title: "Contents",
    offset: 100,
  }
);

// Generate tocItems from validation data
const { widgetValidations } = useAssetValidation();
const tocItems = computed(() => {
  return widgetValidations.value.map((validation) => ({
    id: validation.id,
    label: validation.label,
    isRequired: validation.isRequired,
    hasContent: !validation.isEmpty,
    isValid: validation.isValid,
  }));
});

let observer: IntersectionObserver | null = null;

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    window.scrollTo({
      top: element.offsetTop,
      behavior: "smooth",
    });
  }
};

const visibleItems = reactive<Set<string>>(new Set());
const activeId = computed(() => {
  for (const item of tocItems.value) {
    if (visibleItems.has(item.id)) {
      return item.id;
    }
  }
  return null;
});

onMounted(() => {
  // watch for item visibility to update the activeId
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // add or remove from the visibleItems set
        entry.isIntersecting
          ? visibleItems.add(entry.target.id)
          : visibleItems.delete(entry.target.id);
      });
    },
    {
      rootMargin: `-${props.offset}px 0px 0px 0px`,
      threshold: 0.2,
    }
  );

  // Observe all items
  tocItems.value.forEach((item) => {
    const element = document.getElementById(item.id);
    if (!element || !observer) {
      return;
    }

    observer.observe(element);
  });
});

onUnmounted(() => {
  // Clean up observer
  if (observer) {
    observer.disconnect();
  }
});
</script>
