<template>
  <a class="skipnav shadow-md" href="#main"> Skip to content </a>
</template>
<script setup lang="ts"></script>
<style scoped>
/* from https://www.a11yproject.com/ */
.skipnav {
  border: 0;
  clip: rect(0 0 0 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
  background-color: #fff;
  border: 2px solid blue;
  color: blue;
  font-family: anaheim, sans-serif;
  letter-spacing: 0.15ch;
  padding: 1rem 2rem;
  text-decoration: none;
  transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
  text-transform: uppercase;
  border-radius: 0.25rem;
}

.skipnav:focus {
  clip: auto;
  height: auto;
  margin: 0;
  overflow: visible;
  position: static;
  width: auto;
  outline: none;
  position: absolute;
  top: 2rem;
  left: 2rem;
  z-index: 100;
}

.skipnav:focus:hover {
  background-color: blue;
  color: #fff;
}

@media screen and (prefers-reduced-motion: reduce) {
  .c-skipnav {
    transition: none;
  }
}
</style>
