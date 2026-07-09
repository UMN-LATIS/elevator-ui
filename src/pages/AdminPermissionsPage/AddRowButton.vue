<template>
  <TableRow class="hover:bg-transparent">
    <TableCell :colspan="colspan" class="p-0">
      <Button
        type="button"
        variant="tertiary"
        v-bind="$attrs"
        class="p-4 w-full"
        @click="$emit('click')">
        <PlusIcon class="size-4" />
        {{ label }}
      </Button>
    </TableCell>
  </TableRow>
</template>
<script setup lang="ts">
import { TableRow, TableCell } from "@/components/ui/table";
import { PlusIcon } from "lucide-vue-next";
import Button from "@/components/Button/Button.vue";

defineProps<{
  label: string;
  colspan: number;
}>();

defineEmits<{ click: [] }>();

// Fallthrough attributes (data hooks for focus targeting) belong on the
// button, not the row, so callers can focus and click what they select.
defineOptions({ inheritAttrs: false });
</script>
