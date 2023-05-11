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
        <p
          v-if="errors.form"
          class="text-red-500 text-sm italic mb-4 capitalize"
        >
          {{ errors.form }}
        </p>
        <div class="flex flex-col gap-4 mb-10">
          <div>
            <InputGroup
              id="username"
              :value="username"
              label="Username"
              :inputClass="{ '!border-red-500 !bg-red-50': !!errors.username }"
              type="string"
              aria-required="true"
              @input="username = ($event.target as HTMLInputElement).value"
            />
            <p v-if="errors.username" class="text-red-500 text-sm italic mt-2">
              {{ errors.username }}
            </p>
          </div>
          <div>
            <InputGroup
              id="password"
              label="Password"
              :value="password"
              :inputClass="{ '!border-red-500 !bg-red-50': !!errors.password }"
              type="password"
              aria-required="true"
              @input="password = ($event.target as HTMLInputElement).value"
            />
            <p v-if="errors.password" class="text-red-600 text-sm italic mt-2">
              {{ errors.password }}
            </p>
          </div>
        </div>

        <Button variant="primary" type="submit" class="w-full"> Login </Button>
        <div
          v-if="
            instanceStore.instance.useCentralAuth &&
            instanceStore.instance.centralAuthLabel
          "
          class="text-center mt-4"
        >
          <a
            :href="`${config.instance.base.url}/loginManager/remoteLogin/?redirect=${encodedCallbackUrl}`"
          >
            Sign In with {{ instanceStore.instance.centralAuthLabel }} Login
          </a>
        </div>
      </form>
    </section>
  </DefaultLayout>
</template>
<script setup lang="ts">
import Button from "@/components/Button/Button.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { ref, computed } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";
import { useRouter } from "vue-router";
import config from "@/config";
import api from "@/api";

const props = withDefaults(
  defineProps<{
    redirectURL?: string;
  }>(),
  {
    redirectURL: config.instance.base.url,
  }
);

const username = ref("");
const password = ref("");
const errors = ref<{
  username?: string;
  password?: string;
  form?: string;
}>({});
const instanceStore = useInstanceStore();
const router = useRouter();

const login = async () => {
  console.log("login", { username: username.value, password: password.value });

  errors.value = {};
  if (!username.value) {
    errors.value.username = "Username required";
  }
  if (!password.value) {
    errors.value.password = "Password required";
  }
  if (Object.keys(errors.value).length) {
    return;
  }

  const { status, message } = await api.loginAsGuest({
    username: username.value,
    password: password.value,
    redirectURL: props.redirectURL,
  });

  // clear password
  password.value = "";

  if (status === "error") {
    errors.value.form = message;
    return;
  }

  if (status === "success") {
    instanceStore.refresh();
    console.log("redirecting to", props.redirectURL);
    router.push(props.redirectURL);
  }
};

const encodedCallbackUrl = computed(() =>
  encodeURIComponent(props.redirectURL)
);
</script>
<style scoped></style>
