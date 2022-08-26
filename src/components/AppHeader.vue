<template>
  <div class="app-header bg-neutral-100 border-y border-neutral-200">
    <div class="flex justify-between max-w-[90rem] mx-auto p-4 items-center">
      <h2 class="text-xl">
        <router-link to="/" class="text-neutral-800 uppercase font-bold"
          >Digital Content Library</router-link
        >
      </h2>
      <nav>
        <ul class="flex gap-2">
          <li>
            <RouterLink to="/viewer" class="p-4">Viewer Page</RouterLink>
          </li>
          <li>
            <RouterLink to="/meta-data-only" class="p-4"
              >Meta Data Only</RouterLink
            >
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
