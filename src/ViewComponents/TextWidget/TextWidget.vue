<template>
    <p><strong>{{ template.label }}:</strong></p>
    <ul>
        <li v-for="(content, key) in contents" :key="key">{{ clickToSearch(template, content.fieldContents) }}</li>
    </ul>
</template>

<script setup>
import { computed } from "vue";
import { clickToSearch } from "../DisplayUtils.js"

const props = defineProps({
  template: Object().isRequired,
  contents:Object().isRequired
});


</script>

<style scoped>
p {
    display: inline-block;
    padding-right: 0.3em;
}
ul {
  display: inline;
  list-style: none;
  margin: 0;
  padding: 0;
}

ul li {
  display: inline;
}

ul li + li:before {
    content: ", ";
}

</style>