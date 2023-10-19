<template>
  <DynamicScroller
    :items="items"
    :minItemSize="54"
    :keyField="keyField"
    class="scroller"
    :pageMode="true"
  >
    <template #default="{ item, index, active }">
      <DynamicScrollerItem :item="item" :active="active" :data-index="index">
        <slot :item="item" :index="index" :active="active">
          {{ item }}
        </slot>
      </DynamicScrollerItem>
    </template>
  </DynamicScroller>
</template>
<script setup lang="ts" generic="T">
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";

defineProps<{
  items: T[];
  keyField: string;
}>();
</script>
<style scoped>
.scroller {
  height: 100%;
}
</style>
