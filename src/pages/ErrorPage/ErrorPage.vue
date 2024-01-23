<template>
  <DefaultLayout class="error-page">
    <div class="p-8">
      <h1 class="text-8xl font-bold text-neutral-200">{{ errorCode }}</h1>
      <h2 class="text-4xl mb-8">{{ getMessage(errorCode) }}</h2>
      <p class="my-4">{{ getDetailedMessage(errorCode) }}</p>
      <Button :href="config.instance.base.url" icon="home" iconPosition="start">
        Go Home
      </Button>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import Button from "@/components/Button/Button.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import config from "@/config";
import { usePageTitle } from "@/helpers/usePageTitle";

const statusMessages = {
  400: {
    message: "Bad Request",
    detailedMessage: "We couldn't understand your request.",
  },
  404: {
    message: "Page not found",
    detailedMessage: "We couldn't find this page.",
  },
  500: {
    message: "Internal Server Error",
    detailedMessage: "Something went wrong on our end.",
  },
};

function getMessage(code: number) {
  return statusMessages[code]?.message || "Unknown Error";
}

function getDetailedMessage(code: number) {
  return statusMessages[code]?.detailedMessage || "Something went wrong.";
}
const props = withDefaults(
  defineProps<{
    errorCode: number;
  }>(),
  {
    errorCode: 404,
  }
);

usePageTitle(getMessage(props.errorCode));
</script>
<style scoped></style>
