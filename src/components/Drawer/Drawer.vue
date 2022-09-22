<template>
  <section class="drawer h-full bg-neutral-200 flex flex-col">
    <header
      class="flex items-center sticky top-0 left-0 justify-between"
      :class="{
        'bg-neutral-900 text-white border-y border-neutral-900':
          variant === 'primary',
        'bg-neutral-50 text-neutral-900 border-y border-neutral-300':
          variant === 'secondary',
        'h-full': !isOpen,
        'md:py-4': variant === 'primary' && isOpen,
      }"
    >
      <button
        class="flex items-center p-4 leading-tight gap-4 flex-1"
        @click="$emit('toggle')"
      >
        <span class="material-symbols-outlined">
          {{ isOpen ? "expand_more" : "expand_less" }}
        </span>
        <slot name="header-label">
          <h1
            class="header-label font-bold relative text-left"
            :class="{
              'sm:text-3xl md:text-4xl': variant === 'primary' && isOpen,
              'sm:text-2xl md:text-3xl':
                label.length >= 100 && label.length < 200 && isOpen,
              'sm:text-xl md:text-xl': label.length >= 200 && isOpen,
            }"
            :title="label"
          >
            <span class="min-w-0 block">{{ label }}</span>
          </h1>
        </slot>
      </button>
      <div>
        <slot name="header-utils"></slot>
      </div>
    </header>

    <div
      v-show="isOpen"
      class="text-neutral-500 flex flex-col gap-8 px-4 py-8 md:p-8 flex-1 h-min overflow-auto"
    >
      <slot />
    </div>
  </section>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    variant?: "primary" | "secondary";
    isOpen?: boolean;
  }>(),
  {
    isOpen: true,
    variant: "primary",
  }
);

defineEmits<{
  (eventName: "toggle");
}>();
</script>
<style scoped>
/* width */
::-webkit-scrollbar {
  width: 0.5rem;
}

/* Track */
::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 33%);
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #ccc;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.ticker {
  animation: 8s ticker infinite linear;
}

@keyframes ticker {
  0% {
    transform: translate3d(0, 0, 0);
    visibility: visible;
  }

  100% {
    transform: translate3d(-100%, 0, 0);
  }
}
</style>
