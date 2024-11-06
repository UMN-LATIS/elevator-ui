<script setup lang="ts">
import { onMounted } from "vue";
import Cookies from "js-cookie";
import api from "@/api";
import { useRouter } from "vue-router";
import { resetAllStores } from "@/stores/resetAllStores";
import { useInstanceStore } from "@/stores/instanceStore";
import { useDrawerStore } from "@/stores/drawerStore";

const instanceStore = useInstanceStore();
const drawerStore = useDrawerStore();
const router = useRouter();

onMounted(async () => {
  await api.logout();

  // clear cookie indicating active session
  // see: https://github.com/UMN-LATIS/elevator-ui/issues/277
  Cookies.remove("_check_is_passive");

  // do a full reload to clear any cached state
  api.clearCache();
  resetAllStores();

  instanceStore.init();
  drawerStore.init();
  router.push("/");
});
</script>
<style scoped></style>
