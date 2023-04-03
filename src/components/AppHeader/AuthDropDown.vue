<template>
  <DropDown :label="menuLabel">
    <template #label>
      <Avatar v-if="currentUser" :name="currentUser.displayName" />
      <span v-else>Login</span>
    </template>
    <template v-if="currentUser">
      <DropDownItem
        v-if="currentUser.id"
        :href="`${config.instance.base.url}/permissions/editUser/${currentUser.id}`"
      >
        Preferences
      </DropDownItem>
      <DropDownItem
        :href="`${
          config.instance.base.url
        }/loginManager/logout?redirect=${encodeURIComponent(
          config.instance.base.url
        )}`"
      >
        Logout
      </DropDownItem>
    </template>
    <template v-else>
      <DropDownItem
        v-if="instance.useCentralAuth && instance.centralAuthLabel"
        :href="`${config.instance.base.url}/loginManager/remoteLogin/?redirect=${encodedCallbackUrl}`"
      >
        {{ instance.centralAuthLabel }} Login
      </DropDownItem>
      <DropDownItem
        :href="`${config.instance.base.url}/loginManager/localLogin/?redirect=${encodedCallbackUrl}`"
      >
        {{ instance.useCentralAuth ? "Guest" : "" }} Login
      </DropDownItem>
    </template>
  </DropDown>
</template>
<script setup lang="ts">
import { ElevatorInstance, User } from "@/types";
import { computed } from "vue";
import DropDown from "@/components/DropDown/DropDown.vue";
import DropDownItem from "@/components/DropDown/DropDownItem.vue";
import Avatar from "@/components/Avatar/Avatar.vue";
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
