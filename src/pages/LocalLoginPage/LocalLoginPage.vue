<template>
  <DefaultLayout>
    <div class="px-4">
      <section
        class="max-w-md border border-neutral-900 rounded-lg mx-auto my-12 p-8"
        :class="{
          'has-form-error': shakeForm,
        }"
      >
        <header
          class="font-bold text-center mb-8 pb-4 border-b border-neutral-900"
        >
          <h2 class="text-2xl capitalize">Login</h2>
        </header>
        <form @submit.prevent="login">
          <p
            v-if="errors.form"
            class="text-red-500 text-sm italic mb-6 capitalize bg-red-50 p-2 rounded-md border border-red-200 text-center"
          >
            {{ errors.form }}
          </p>
          <div class="flex flex-col gap-6 mb-12">
            <div>
              <InputGroup
                id="username"
                v-model="username"
                label="Username"
                :inputClass="{
                  '!border-red-500 !bg-red-50': !!errors.username,
                }"
                type="string"
                aria-required="true"
              />
              <p
                v-if="errors.username"
                class="text-red-500 text-sm italic mt-2"
              >
                {{ errors.username }}
              </p>
            </div>
            <div>
              <InputGroup
                id="password"
                v-model="password"
                label="Password"
                :inputClass="{
                  '!border-red-500 !bg-red-50': !!errors.password,
                }"
                :type="showPassword ? 'text' : 'password'"
                aria-required="true"
              >
                <template #append>
                  <button class="border-none" type="button">
                    <EyeOffIcon
                      v-if="!showPassword"
                      @click="showPassword = true"
                    />
                    <EyeIcon v-else @click="showPassword = false" />
                  </button>
                </template>
              </InputGroup>
              <p
                v-if="errors.password"
                class="text-red-600 text-sm italic mt-2"
              >
                {{ errors.password }}
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            type="submit"
            class="w-full"
            :class="{
              'cursor-not-allowed opacity-50 !border-neutral-300':
                !username || !password,
            }"
            :disabled="!username || !password"
          >
            Login
            <SpinnerIcon v-if="isLoggingIn" class="animate-spin ml-2 h-4 w-4" />
          </Button>
          <div
            v-if="
              instanceStore.instance.useCentralAuth &&
              instanceStore.instance.centralAuthLabel
            "
            class="text-center mt-4 text-sm"
          >
            <a
              :href="`${config.instance.base.url}/loginManager/remoteLogin/?redirect=${encodedCallbackUrl}`"
            >
              Sign In with {{ instanceStore.instance.centralAuthLabel }} Login
            </a>
          </div>
        </form>
      </section>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import Button from "@/components/Button/Button.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { ref, reactive, computed, onMounted } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";
import { useRouter } from "vue-router";
import { EyeIcon, EyeOffIcon, SpinnerIcon } from "@/icons";
import config from "@/config";
import api from "@/api";

const props = withDefaults(
  defineProps<{
    redirectURL?: string;
  }>(),
  {
    redirectURL: config.instance.base.path,
  }
);

const username = ref("");
const password = ref("");
const showPassword = ref(false);
const isLoggingIn = ref(false);
const errors = reactive<{
  username: string;
  password: string;
  form: string;
}>({
  username: "",
  password: "",
  form: "",
});
const shakeForm = ref(false);

const instanceStore = useInstanceStore();
const router = useRouter();

const login = async () => {
  // clear username and password errors
  // but leave form error to avoid layout shifting on submit
  errors.username = "";
  errors.password = "";
  shakeForm.value = false;

  if (!username.value) {
    errors.username = "Username required";
  }
  if (!password.value) {
    errors.password = "Password required";
  }

  if (!username.value || !password.value) {
    return;
  }

  isLoggingIn.value = true;
  const { status, message } = await api.loginAsGuest({
    username: username.value,
    password: password.value,
  });

  // clear password
  password.value = "";
  isLoggingIn.value = false;

  if (status === "error") {
    errors.form = message;
    shakeForm.value = true;
    return;
  }

  if (status === "success") {
    errors.form = "";

    // do a full reload to reinit stores and
    // clear any cached api responses
    window.location.href = props.redirectURL;
  }
};

const encodedCallbackUrl = computed(() =>
  encodeURIComponent(props.redirectURL)
);

onMounted(() => {
  // if user is logged in, redirect
  if (instanceStore.isLoggedIn) {
    router.push(props.redirectURL);
  }
});
</script>
<style scoped>
.has-form-error {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  perspective: 1000px;
}
</style>
