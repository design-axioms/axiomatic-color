<script setup lang="ts">
import { onMounted, ref } from "vue";

const active = ref(false);

onMounted(() => {
  // Preserve state on navigation
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
    title="Simulate high contrast (prefers-contrast: more)"
    @click="toggle"
  >
    <span aria-hidden="true">HC</span>
    <span class="sr-only">{{ active ? "Disable" : "Enable" }} high-contrast simulation</span>
  </button>
</template>

<style scoped>
.hc-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 0.5rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.hc-toggle:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.hc-toggle.is-active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
