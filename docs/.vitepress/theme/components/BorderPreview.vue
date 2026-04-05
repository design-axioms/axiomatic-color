<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
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

const tiers = [
  { cls: "border-decorative", label: "Decorative", target: 10, desc: "Subtle container outlines" },
  { cls: "border-interactive", label: "Interactive", target: 30, desc: "Buttons, inputs, clickable" },
  { cls: "border-critical", label: "Critical", target: 80, desc: "Error states, required fields" },
];

const surfaces = [
  { cls: "surface-page", label: "Page" },
  { cls: "surface-spotlight", label: "Spotlight" },
];
</script>

<template>
  <div v-if="ready" ref="rootEl" class="border-preview-root" :style="{ colorScheme: isDark ? 'dark' : 'light' }">
    <component :is="'style'" v-text="css" />

    <div class="bp-toolbar">
      <button class="bp-toggle" @click="isDark = !isDark">
        {{ isDark ? "☀ Light" : "● Dark" }}
      </button>
    </div>

    <div class="bp-grid">
      <div v-for="surface in surfaces" :key="surface.cls" class="bp-surface" :class="surface.cls">
        <span class="bp-surface-name text-high">{{ surface.label }}</span>
        <div class="bp-specimens">
          <div
            v-for="tier in tiers" :key="tier.cls"
            class="bp-specimen"
            :class="tier.cls"
          >
            <div class="bp-specimen-header">
              <span class="bp-tier-name text-high">{{ tier.label }}</span>
              <ApcaBadge :value="tier.target" :target="tier.target" />
            </div>
            <span class="bp-tier-desc text-subtle">{{ tier.desc }}</span>
            <Token :name="'.' + tier.cls" />
          </div>
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

.bp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.bp-surface {
  padding: 1rem;
}

.bp-surface-name {
  font-size: 0.8rem;
  font-weight: 600;
  display: block;
  margin-bottom: 0.75rem;
}

.bp-specimens {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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

.bp-tier-name {
  font-size: 0.8rem;
  font-weight: 500;
}

.bp-tier-desc {
  font-size: 0.65rem;
  display: block;
  margin-bottom: 0.5rem;
}

@media (max-width: 640px) {
  .bp-grid {
    grid-template-columns: 1fr;
  }
}
</style>
