<template>
  <DefaultLayout class="local-login-page">
    <template #custom-header>
      <CustomAppHeader
        v-if="customHeaderMode === ShowCustomHeaderMode.ALWAYS" />
    </template>
    <div class="px-4">
      <section
        class="max-w-md border border-on-surface rounded-lg mx-auto my-12 p-8"
        :class="{ 'has-form-error': shakeForm }">
        <header
          class="font-bold text-center mb-8 pb-4 border-b border-on-surface">
          <h2 class="text-2xl capitalize">Login</h2>
        </header>
        <form @submit.prevent="submitLogin">
          <p
            v-if="loginError"
            role="alert"
            class="text-error text-sm italic mb-6 capitalize bg-error-container p-2 rounded-md border border-error text-center">
            {{ loginError.message }}
          </p>
          <div class="flex flex-col gap-6 mb-12">
            <div>
              <InputGroup
                id="username"
                v-model="username"
                label="Username"
                :inputClass="{
                  '!border-error !bg-error-container': !!fieldErrors.username,
                }"
                type="string"
                aria-required="true" />
              <p
                v-if="fieldErrors.username"
                class="text-error text-sm italic mt-2">
                {{ fieldErrors.username }}
              </p>
            </div>
            <div>
              <InputGroup
                id="password"
                v-model="password"
                label="Password"
                :inputClass="{
                  '!border-error !bg-error-container': !!fieldErrors.password,
                }"
                :type="showPassword ? 'text' : 'password'"
                aria-required="true">
                <template #append>
                  <button class="border-none" type="button">
                    <EyeOffIcon
                      v-if="!showPassword"
                      @click="showPassword = true" />
                    <EyeIcon v-else @click="showPassword = false" />
                  </button>
                </template>
              </InputGroup>
              <p
                v-if="fieldErrors.password"
                class="text-error text-sm italic mt-2">
                {{ fieldErrors.password }}
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            type="submit"
            class="w-full"
            :disabled="!canSubmit">
            Login
            <SpinnerIcon v-if="isLoggingIn" class="animate-spin ml-2 h-4 w-4" />
          </Button>
          <div
            v-if="instance?.useCentralAuth && instance.centralAuthLabel"
            class="text-center mt-4 text-sm">
            <a :href="centralAuthUrl">
              Sign In with {{ instance.centralAuthLabel }} Login
            </a>
          </div>
        </form>
      </section>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { useRouter } from "vue-router";
import Button from "@/components/Button/Button.vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import CustomAppHeader from "@/components/CustomAppHeader/CustomAppHeader.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { EyeIcon, EyeOffIcon, SpinnerIcon } from "@/icons";
import config from "@/config";
import { ShowCustomHeaderMode } from "@/types";
import { useElevatorInstance } from "@/composables/useElevatorInstance";
import { useCurrentUser } from "@/composables/useCurrentUser";
import { useCustomHeaderFooter } from "@/composables/useCustomHeaderFooter";
import { useLoginAsGuestMutation } from "@/queries/useLoginAsGuestMutation";
import { resetAllStores } from "@/stores/resetAllStores";
import { useDrawerStore } from "@/stores/drawerStore";

const props = withDefaults(
  defineProps<{
    redirectURL?: string;
  }>(),
  {
    redirectURL: config.instance.base.path,
  }
);

const router = useRouter();
const drawerStore = useDrawerStore();

const { instance } = useElevatorInstance();
const { customHeaderMode } = useCustomHeaderFooter();
const { isLoggedIn, isSuccess: isSessionAnswered } = useCurrentUser();
const {
  mutate: loginAsGuest,
  isPending: isLoggingIn,
  error: loginError,
} = useLoginAsGuestMutation();

const username = ref("");
const password = ref("");
const showPassword = ref(false);
const shakeForm = ref(false);
const fieldErrors = reactive({
  username: "",
  password: "",
});

const centralAuthUrl = computed(
  () =>
    `${
      config.instance.base.url
    }/loginManager/remoteLogin/?redirect=${encodeURIComponent(
      props.redirectURL
    )}`
);

const canSubmit = computed(
  () => !!username.value && !!password.value && !isLoggingIn.value
);

// Bounce a visitor who already has a valid session, but only once the shared
// instanceNav query has answered, so that a still-loading query is never read
// as "logged out".
watch(
  [isSessionAnswered, isLoggedIn],
  ([hasAnswer, hasSession]) => {
    if (hasAnswer && hasSession) {
      router.push(props.redirectURL);
    }
  },
  { immediate: true }
);

function submitLogin(): void {
  fieldErrors.username = username.value ? "" : "Username required";
  fieldErrors.password = password.value ? "" : "Password required";
  shakeForm.value = false;

  if (fieldErrors.username || fieldErrors.password) {
    return;
  }

  loginAsGuest(
    { username: username.value, password: password.value },
    {
      onSuccess: async () => {
        // drawerStore keeps its own cache outside TanStack Query, so the
        // mutation's teardown does not reach it
        resetAllStores();
        await drawerStore.init();
        router.push(props.redirectURL);
      },
      onError: () => {
        shakeForm.value = true;
      },
      onSettled: () => {
        password.value = "";
      },
    }
  );
}
</script>

<style scoped>
.has-form-error {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  perspective: 1000px;
}
</style>
