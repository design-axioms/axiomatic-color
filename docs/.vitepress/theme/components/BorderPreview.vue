<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useThemeBuilder } from "../composables/useThemeBuilder";

const css = ref("");
const ready = ref(false);
const rootEl = ref<HTMLElement | null>(null);
const isDark = ref(false);

useThemeBuilder(rootEl);

onMounted(async () => {
  const { solve, DEFAULT_CONFIG, generateCSS } =
    await import("@design-axioms/color");

  const output = solve(DEFAULT_CONFIG);
  css.value = generateCSS(output, {
    ...DEFAULT_CONFIG.options,
    selector: ".border-preview-root",
  });
  ready.value = true;
});
</script>

<template>
  <div v-if="ready" ref="rootEl" class="border-preview-root" :style="{ colorScheme: isDark ? 'dark' : 'light' }">
    <component :is="'style'" v-text="css" />

    <div class="bp-toolbar">
      <button class="bp-toggle" @click="isDark = !isDark">
        {{ isDark ? "☀ Light" : "● Dark" }}
      </button>
    </div>

    <div class="bp-panels">
      <!-- Page polarity -->
      <div class="bp-panel surface-page">
        <!-- Decorative: a content card -->
        <div class="bp-card surface-card border-decorative">
          <span class="text-high bp-card-title">Project Settings</span>
          <span class="text-subtle bp-card-desc">General configuration</span>
        </div>

        <!-- Interactive: a button and an input -->
        <div class="bp-controls">
          <button class="bp-button surface-action border-interactive text-high">Deploy</button>
          <div class="bp-input border-interactive">
            <span class="text-subtlest">Search...</span>
          </div>
        </div>

        <!-- Critical: an error state -->
        <div class="bp-alert border-critical">
          <span class="text-high bp-alert-title">Build Failed</span>
          <span class="text-subtle bp-alert-desc">Exit code 1 at step 3</span>
        </div>

        <div class="bp-legend">
          <span class="bp-legend-item text-subtlest"><code>.border-decorative</code> Lc 10</span>
          <span class="bp-legend-item text-subtlest"><code>.border-interactive</code> Lc 30</span>
          <span class="bp-legend-item text-subtlest"><code>.border-critical</code> Lc 80</span>
        </div>
      </div>

      <!-- Spotlight polarity -->
      <div class="bp-panel surface-spotlight">
        <div class="bp-card surface-card border-decorative">
          <span class="text-high bp-card-title">Quick Actions</span>
          <span class="text-subtle bp-card-desc">Frequently used</span>
        </div>

        <div class="bp-controls">
          <button class="bp-button surface-action border-interactive text-high">Promote</button>
          <div class="bp-input border-interactive">
            <span class="text-subtlest">Filter...</span>
          </div>
        </div>

        <div class="bp-alert border-critical">
          <span class="text-high bp-alert-title">Rate Limited</span>
          <span class="text-subtle bp-alert-desc">Try again in 30s</span>
        </div>

        <div class="bp-legend">
          <span class="bp-legend-item text-subtlest"><code>.border-decorative</code></span>
          <span class="bp-legend-item text-subtlest"><code>.border-interactive</code></span>
          <span class="bp-legend-item text-subtlest"><code>.border-critical</code></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.border-preview-root {
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
}

.bp-toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.bp-toggle {
  padding: 0.2rem 0.6rem;
  border-radius: 5px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 0.7rem;
  font-family: var(--vp-font-family-base);
}

.bp-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.bp-panel {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  transition: background 0.3s ease;
}

/* Decorative: card container */
.bp-card {
  border-width: 1px;
  border-style: solid;
  border-radius: 6px;
  padding: 0.75rem;
  transition: background 0.3s ease;
}

.bp-card-title {
  font-size: 0.8rem;
  font-weight: 600;
  display: block;
  margin-bottom: 0.125rem;
}

.bp-card-desc {
  font-size: 0.7rem;
  display: block;
}

/* Interactive: controls */
.bp-controls {
  display: flex;
  gap: 0.5rem;
}

.bp-button {
  font: inherit;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  border-width: 1px;
  border-style: solid;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.bp-input {
  flex: 1;
  border-width: 1px;
  border-style: solid;
  border-radius: 5px;
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
}

/* Critical: alert */
.bp-alert {
  border-width: 2px;
  border-style: solid;
  border-radius: 6px;
  padding: 0.625rem 0.75rem;
}

.bp-alert-title {
  font-size: 0.8rem;
  font-weight: 600;
  display: block;
  margin-bottom: 0.125rem;
}

.bp-alert-desc {
  font-size: 0.7rem;
  display: block;
}

/* Legend */
.bp-legend {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--axm-border-decorative);
}

.bp-legend-item {
  font-size: 0.6rem;
}

.bp-legend-item code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.6rem;
}

@media (max-width: 640px) {
  .bp-panels { grid-template-columns: 1fr; }
}
</style>