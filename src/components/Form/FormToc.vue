<template>
  <nav>
    <h2 class="text-xs tracking-wide font-medium uppercase mb-2 opacity-70">
      {{ title }}
    </h2>
    <ol class="text-sm space-y-1">
      <li v-for="section in sections" :key="section.id">
        <a
          :href="`#${section.id}`"
          class="block py-1 text-current opacity-70 hover:opacity-100 transition-opacity no-underline hover:no-underline"
          @click.prevent="scrollToSection(section.id)">
          {{ section.label }}
        </a>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import type { TocItem } from "@/types";

const props = withDefaults(
  defineProps<{
    sections: TocItem[];
    title?: string;
    offset?: number;
  }>(),
  {
    title: "Contents",
    offset: 80,
  }
);

function scrollToSection(id: string) {
  const element = document.getElementById(id);
  if (element) {
    window.scrollTo({
      top: element.offsetTop - props.offset,
      behavior: "smooth",
    });
  }
}
</script>
