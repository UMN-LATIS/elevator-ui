<template>
  <DefaultLayout>
    <section
      class="max-w-md border border-neutral-900 rounded-lg mx-auto my-12 p-8"
    >
      <header
        class="font-bold text-center mb-10 pb-4 border-b border-neutral-900"
      >
        <h2 class="text-2xl capitalize">Login</h2>
      </header>
      <form @submit.prevent="login">
        <div class="flex flex-col gap-4 mb-10">
          <InputGroup
            id="username"
            label="Username"
            :value="username"
            :class="{ 'border-red-500': errors.username }"
            type="string"
          >
            <p v-if="errors.username" class="text-red-500 text-xs italic mt-4">
              {{ errors.username }}
            </p>
          </InputGroup>
          <InputGroup
            id="password"
            label="Password"
            :value="password"
            :class="{ 'border-red-500': errors.password }"
            type="password"
          >
            <p v-if="errors.password" class="text-red-500 text-xs italic mt-4">
              {{ errors.password }}
            </p>
          </InputGroup>
        </div>

        <Button variant="primary" type="submit" class="w-full"> Login </Button>
      </form>
    </section>
  </DefaultLayout>
</template>
<script setup lang="ts">
import Button from "@/components/Button/Button.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppLogoMark from "@/components/AppLogoMark/AppLogoMark.vue";
import { ref } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";

const username = ref("");
const password = ref("");
const errors = ref<{
  username?: string;
  password?: string;
}>({});
const instanceStore = useInstanceStore();

const login = () => {
  errors.value = {};
  if (!username.value) {
    errors.value.username = "Email required";
  }
  if (!password.value) {
    errors.value.password = "Password required";
  }
  if (Object.keys(errors.value).length) {
    return;
  }
  console.log("login");
};
</script>
<style scoped></style>
