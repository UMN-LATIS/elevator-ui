<template>
  <nav class="toc-container">
    <h2
      class="text-xs tracking-wide font-medium text-neutral-700 uppercase mb-2">
      {{ title }}
    </h2>
    <ol class="text-sm">
      <li v-for="item in items" :key="item.id">
        <a
          :href="`#${item.id}`"
          class="block transition-colors duration-200 no-underline hover:no-underline hover:bg-transparent py-1 px-2"
          :class="{
            'text-blue-700 font-medium border-blue-700 bg-white/50 rounded-sm':
              activeId === item.id,
            'text-black/50': activeId !== item.id,
          }"
          @click.prevent="scrollToSection(item.id)">
          {{ item.label }}
        </a>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, computed } from "vue";

export interface TocItem {
  id: string;
  label: string;
}

const props = withDefaults(
  defineProps<{
    items: TocItem[];
    title?: string;
    offset?: number;
  }>(),
  {
    title: "Contents",
    offset: 100,
  }
);

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
  for (const item of props.items) {
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
  props.items.forEach((item) => {
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
