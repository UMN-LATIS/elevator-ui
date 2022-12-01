<template>
  <DropDownMenu :label="menuLabel">
    <template v-if="currentUser">
      <DropDownItem
        v-if="currentUser.id"
        :href="`${config.instance.base.url}/editUser/${currentUser.id}`"
      >
        Preferences
      </DropDownItem>
      <DropDownItem :href="`${config.instance.base.url}/loginManager/logout`">
        Logout
      </DropDownItem>
    </template>
    <template v-else>
      <DropDownItem
        v-if="instance.useCentralAuth"
        :href="`${config.instance.base.url}/loginManager/remoteLogin/?redirect=${encodedCallbackUrl}`"
      >
        {{ instance.centralAuthLabel }} Login
      </DropDownItem>
      <DropDownItem
        :href="`${config.instance.base.url}/loginManager/localLogin/?redirect=${encodedCallbackUrl}`"
      >
        {{ instance.useCentralAuth && "Guest" }} Login
      </DropDownItem>
    </template>
  </DropDownMenu>
</template>
<script setup lang="ts">
import { ElevatorInstance, User } from "@/types";
import { computed } from "vue";
import DropDownMenu from "@/components/DropDownMenu/DropDown.vue";
import DropDownItem from "../DropDownMenu/DropDownItem.vue";
import config from "@/config";
import { useBrowserLocation } from "@vueuse/core";

const props = defineProps<{
  currentUser: User | null;
  instance: ElevatorInstance;
}>();

const browserLocation = useBrowserLocation();
const encodedCallbackUrl = computed(() => {
  const callbackUrl = browserLocation.value?.href ?? config.instance.base.url;
  return encodeURIComponent(callbackUrl);
});

const menuLabel = computed(() =>
  props.currentUser ? props.currentUser.displayName : "Login"
);
</script>
<style scoped></style>
