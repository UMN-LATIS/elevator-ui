<template>
  <button
    type="button"
    class="flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm text-on-surface hover:bg-surface-container-highest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-40 data-[selected]:bg-primary data-[selected]:text-on-primary">
    <slot />
  </button>
</template>
