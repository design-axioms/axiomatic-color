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
    selector: ".grade-preview-root",
  });
  ready.value = true;
});
</script>

<template>
  <div v-if="ready" ref="rootEl" class="grade-preview-root" :style="{ colorScheme: isDark ? 'dark' : 'light' }">
    <component :is="'style'" v-text="css" />

    <div class="gp-toolbar">
      <button class="gp-toggle" @click="isDark = !isDark">
        {{ isDark ? "☀ Light" : "● Dark" }}
      </button>
    </div>

    <div class="gp-panels">
      <!-- Page polarity: realistic content block -->
      <div class="gp-panel surface-card">
        <div class="gp-article">
          <h3 class="text-high gp-heading">Dashboard Overview</h3>
          <p class="text-strong gp-body">Your project has 12 deployments this week with 99.8% uptime across all regions.</p>
          <p class="text-subtle gp-secondary">3 deployments are pending review. Check the activity log for details.</p>
          <span class="text-subtlest gp-meta">Updated 2 minutes ago</span>
        </div>
        <div class="gp-legend">
          <div class="gp-legend-row">
            <span class="gp-legend-grade text-high">High</span>
            <code class="gp-legend-class text-subtlest">.text-high</code>
          </div>
          <div class="gp-legend-row">
            <span class="gp-legend-grade text-strong">Strong</span>
            <code class="gp-legend-class text-subtlest">.text-strong</code>
          </div>
          <div class="gp-legend-row">
            <span class="gp-legend-grade text-subtle">Subtle</span>
            <code class="gp-legend-class text-subtlest">.text-subtle</code>
          </div>
          <div class="gp-legend-row">
            <span class="gp-legend-grade text-subtlest">Subtlest</span>
            <code class="gp-legend-class text-subtlest">.text-subtlest</code>
          </div>
        </div>
      </div>

      <!-- Spotlight polarity: same structure, inverted -->
      <div class="gp-panel surface-spotlight">
        <div class="gp-article">
          <h3 class="text-high gp-heading">New Feature Available</h3>
          <p class="text-strong gp-body">Edge Functions now support streaming responses with automatic compression.</p>
          <p class="text-subtle gp-secondary">Available on Pro and Enterprise plans.</p>
          <span class="text-subtlest gp-meta">Announced today</span>
        </div>
        <div class="gp-legend">
          <div class="gp-legend-row">
            <span class="gp-legend-grade text-high">High</span>
            <code class="gp-legend-class text-subtlest">.text-high</code>
          </div>
          <div class="gp-legend-row">
            <span class="gp-legend-grade text-strong">Strong</span>
            <code class="gp-legend-class text-subtlest">.text-strong</code>
          </div>
          <div class="gp-legend-row">
            <span class="gp-legend-grade text-subtle">Subtle</span>
            <code class="gp-legend-class text-subtlest">.text-subtle</code>
          </div>
          <div class="gp-legend-row">
            <span class="gp-legend-grade text-subtlest">Subtlest</span>
            <code class="gp-legend-class text-subtlest">.text-subtlest</code>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grade-preview-root {
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
}

.gp-toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.gp-toggle {
  padding: 0.2rem 0.6rem;
  border-radius: 5px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 0.7rem;
  font-family: var(--vp-font-family-base);
}

.gp-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.gp-panel {
  padding: 1.25rem;
  transition: background 0.3s ease;
}

.gp-article {
  margin-bottom: 1rem;
}

.gp-heading {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.gp-body {
  font-size: 0.8rem;
  line-height: 1.5;
  margin-bottom: 0.375rem;
}

.gp-secondary {
  font-size: 0.75rem;
  line-height: 1.5;
  margin-bottom: 0.375rem;
}

.gp-meta {
  font-size: 0.7rem;
  display: block;
}

.gp-legend {
  border-top: 1px solid var(--axm-border-decorative);
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.gp-legend-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.gp-legend-grade {
  font-size: 0.7rem;
  font-weight: 500;
}

.gp-legend-class {
  font-size: 0.65rem;
  font-family: var(--vp-font-family-mono);
}
</style>