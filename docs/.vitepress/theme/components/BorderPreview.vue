<script setup lang="ts">
import { ref, onMounted } from "vue";
import Token from "./Token.vue";
import ApcaBadge from "./ApcaBadge.vue";
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
      <div class="bp-panel surface-page">
        <div class="bp-specimen border-decorative">
          <div class="bp-specimen-header">
            <span class="text-high bp-specimen-title">Decorative</span>
            <Token name=".border-decorative" />
          </div>
          <span class="text-subtle bp-specimen-desc">Subtle container outlines</span>
        </div>

        <div class="bp-specimen border-interactive">
          <div class="bp-specimen-header">
            <span class="text-high bp-specimen-title">Interactive</span>
            <Token name=".border-interactive" />
          </div>
          <span class="text-subtle bp-specimen-desc">Buttons, inputs, clickable elements</span>
        </div>

        <div class="bp-specimen border-critical">
          <div class="bp-specimen-header">
            <span class="text-high bp-specimen-title">Critical</span>
            <Token name=".border-critical" />
          </div>
          <span class="text-subtle bp-specimen-desc">Error states, required fields</span>
        </div>
      </div>

      <div class="bp-panel surface-spotlight">
        <div class="bp-specimen border-decorative">
          <div class="bp-specimen-header">
            <span class="text-high bp-specimen-title">Decorative</span>
            <Token name=".border-decorative" />
          </div>
          <span class="text-subtle bp-specimen-desc">Same class, inverted surface</span>
        </div>

        <div class="bp-specimen border-interactive">
          <div class="bp-specimen-header">
            <span class="text-high bp-specimen-title">Interactive</span>
            <Token name=".border-interactive" />
          </div>
          <span class="text-subtle bp-specimen-desc">Resolves per surface</span>
        </div>

        <div class="bp-specimen border-critical">
          <div class="bp-specimen-header">
            <span class="text-high bp-specimen-title">Critical</span>
            <Token name=".border-critical" />
          </div>
          <span class="text-subtle bp-specimen-desc">Contrast target met on both</span>
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
  gap: 0.5rem;
  transition: background 0.3s ease;
}

.bp-specimen {
  border-width: 2px;
  border-style: solid;
  border-radius: 6px;
  padding: 0.75rem;
}

.bp-specimen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.bp-specimen-title {
  font-size: 0.8rem;
  font-weight: 600;
}

.bp-specimen-desc {
  font-size: 0.65rem;
  display: block;
}

@media (max-width: 640px) {
  .bp-panels { grid-template-columns: 1fr; }
}
</style>