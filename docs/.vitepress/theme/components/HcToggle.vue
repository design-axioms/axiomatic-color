<script setup lang="ts">
import { onMounted, ref } from "vue";

const active = ref(false);

onMounted(() => {
  // Preserve state across navigation
  active.value = document.documentElement.classList.contains("hc-simulate");
});

function toggle() {
  active.value = !active.value;
  document.documentElement.classList.toggle("hc-simulate", active.value);
}
</script>

<template>
  <button
    class="hc-toggle"
    :class="{ 'is-active': active }"
    type="button"
    :aria-pressed="active"
    :aria-label="active ? 'Disable high-contrast simulation' : 'Simulate high contrast'"
    title="Simulate prefers-contrast: more on system surfaces"
    @click="toggle"
  >
    {{ active ? '◉ HC on' : '○ HC' }}
  </button>
</template>

<style scoped>
.hc-toggle {
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 0.75rem;
  font-family: var(--vp-font-family-base);
  white-space: nowrap;
}

.hc-toggle:hover {
  background: var(--vp-c-bg-soft);
}

.hc-toggle.is-active {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
</style>
