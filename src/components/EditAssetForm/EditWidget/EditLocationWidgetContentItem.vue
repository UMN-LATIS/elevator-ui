<template>
  <div class="">
    {{ props.modelValue }}
  </div>
</template>
<script setup lang="ts">
import * as Type from "@/types";

const props = defineProps<{
  modelValue: Type.WithId<Type.LocationWidgetContent>;
}>();

const emit = defineEmits<{
  (
    e: "update:modelValue",
    contentItem: Type.WithId<Type.LocationWidgetContent>
  ): void;
}>();
</script>
<style scoped></style>
