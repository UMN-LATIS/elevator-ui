<template>
  <TextArea :label="label" :value="value" :placeholder="placeholder">
    <template #corner>
      <Button
        :icon="copied ? 'check' : 'content_copy'"
        variant="tertiary"
        @click="copy()"
      >
        <!-- eslint-disable-next-line vue/no-textarea-mustache-->
        {{ copied ? "Copied" : "Copy" }}
      </Button>
    </template>
  </TextArea>
</template>
<script setup lang="ts">
import { toRef } from "vue";
import { useClipboard } from "@vueuse/core";
import TextArea from "../TextArea/TextArea.vue";
import Button from "../Button/Button.vue";

const props = withDefaults(
  defineProps<{
    label: string;
    value: string;
    placeholder?: string;
  }>(),
  {
    placeholder: "",
  }
);

const valueRef = toRef(props, "value");

const { copy, copied } = useClipboard({
  source: valueRef,
  copiedDuring: 3000,
});
</script>
<style scoped></style>
