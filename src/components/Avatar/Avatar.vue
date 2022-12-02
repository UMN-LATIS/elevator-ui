<template>
  <div
    class="avatar inline-flex justify-center items-center rounded-md px-2 py-1 border"
    :class="avatarColorClasses"
  >
    {{ initials }}
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{
  name: string;
}>();

const initials = computed(() => {
  if (!props.name.length) {
    return "X";
  }

  const allInitials = props.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return allInitials.length <= 2
    ? allInitials
    : // first and last initials
      allInitials[0] + allInitials[allInitials.length - 1];
});

// possible avatar color sets
const colorOptions = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-green-100 text-green-700 border-green-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-yellow-100 text-yellow-700 border-yellow-200",
  "bg-red-100 text-red-700 border-red-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-teal-100 text-teal-700 border-teal-200",
];

const avatarColorClasses = computed(() => {
  // sum up the char codes for the name and use that to pick a color
  const colorIndex = props.name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colorOptions[colorIndex % colorOptions.length];
});
</script>
<style scoped></style>
