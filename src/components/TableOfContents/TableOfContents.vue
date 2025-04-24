<template>
  <div class="toc-container">
    <h2 class="text-xl font-bold mb-4">{{ title }}</h2>
    <ul class="space-y-2">
      <li v-for="item in items" :key="item.id">
        <a
          :href="`#${item.id}`"
          class="block py-1 px-2 transition-colors duration-200 rounded hover:bg-gray-100"
          :class="{
            'bg-blue-100 text-blue-700 font-medium border-l-4 border-blue-500 pl-3':
              activeId === item.id,
            'text-gray-700': activeId !== item.id,
          }"
          @click.prevent="scrollToSection(item.id)">
          {{ item.label }}
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

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
    title: "Table of Contents",
    offset: 100,
  }
);

const activeId = ref<string>("");
let observer: IntersectionObserver | null = null;

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    window.scrollTo({
      top: element.offsetTop - props.offset,
      behavior: "smooth",
    });
  }
};

onMounted(() => {
  // Set up Intersection Observer
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // When a section enters the viewport and is intersecting
        if (entry.isIntersecting) {
          activeId.value = entry.target.id;
        }
      });
    },
    {
      rootMargin: `-${props.offset}px 0px -70% 0px`,
      threshold: 0,
    }
  );

  // Observe all sections
  props.items.forEach((item) => {
    const element = document.getElementById(item.id);
    if (element && observer) {
      observer.observe(element);
    }
  });

  // Set initial active section
  updateActiveSection();
});

onUnmounted(() => {
  // Clean up observer
  if (observer) {
    observer.disconnect();
  }
});

// Fallback method using scroll position
const updateActiveSection = () => {
  const scrollPosition = window.scrollY;

  for (const item of props.items) {
    const element = document.getElementById(item.id);
    if (element) {
      const sectionTop = element.offsetTop;
      const sectionHeight = element.offsetHeight;

      if (
        scrollPosition >= sectionTop - props.offset - 50 &&
        scrollPosition < sectionTop + sectionHeight - props.offset
      ) {
        activeId.value = item.id;
        break;
      }
    }
  }
};
</script>
