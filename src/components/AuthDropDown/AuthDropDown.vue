<template>
  <DropDown :label="menuLabel" :showChevron="false" class="auth-drop-down">
    <template #label>
      <Avatar v-if="currentUser" :name="currentUser.displayName" />
      <span v-else>Login</span>
    </template>
    <template v-if="currentUser">
      <div
        class="p-4 border-b border-neutral-300 text-xs flex items-center gap-1">
        <span class="text-neutral-400">Signed in as</span>
        <b class="font-normal">{{ currentUser.displayName }}</b>
      </div>
      <DropDownItem
        v-if="currentUser.id"
        :href="`${config.instance.base.url}/permissions/editUser/${currentUser.id}`">
        Preferences
      </DropDownItem>
      <DropDownItem to="/logout">Logout</DropDownItem>
    </template>
    <template v-else>
      <DropDownItem
        v-if="instance.useCentralAuth && instance.centralAuthLabel"
        :href="`${config.instance.base.url}/loginManager/remoteLogin/?redirect=${encodedCallbackUrl}`">
        {{ instance.centralAuthLabel }} Login
      </DropDownItem>
      <DropDownItem :to="`/loginManager/localLogin/?redirect=${route.path}`">
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
import { useRoute } from "vue-router";

const props = defineProps<{
  currentUser: User | null;
  instance: ElevatorInstance;
}>();

const route = useRoute();

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
