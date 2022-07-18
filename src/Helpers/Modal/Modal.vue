<template>
    <div class="modal" v-if="show">
        <slot />
        <button type="button" @click="$emit('close')">Close</button>
    </div>
</template>

<script setup lang="ts">

interface Props {
    show: boolean;
}

const props = defineProps<Props>();

</script>
