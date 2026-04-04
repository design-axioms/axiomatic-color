<script setup lang="ts">
import { ref, onMounted } from "vue";
import Token from "./Token.vue";
import { useThemeBuilder } from "../composables/useThemeBuilder";

const css = ref("");
const ready = ref(false);
const rootEl = ref<HTMLElement | null>(null);

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
  <div v-if="ready" ref="rootEl" class="grade-preview-root" style="color-scheme: light">
    <component :is="'style'" v-text="css" />

    <div class="gp-row">
      <div class="gp-surface surface-page">
        <div class="gp-header">
          <span class="gp-surface-name text-high">Page</span>
        </div>
        <div class="gp-grades">
          <p class="text-high"><Token name=".text-high" /> High contrast text</p>
          <p class="text-strong"><Token name=".text-strong" /> Body text for reading</p>
          <p class="text-subtle"><Token name=".text-subtle" /> Secondary information</p>
          <p class="text-subtlest"><Token name=".text-subtlest" /> Hints and metadata</p>
        </div>
        <div class="gp-borders">
          <div class="gp-border-sample text-subtlest border-decorative">decorative</div>
          <div class="gp-border-sample text-subtlest border-interactive">interactive</div>
          <div class="gp-border-sample text-subtlest border-critical">critical</div>
        </div>
      </div>

      <div class="gp-surface surface-spotlight">
        <div class="gp-header">
          <span class="gp-surface-name text-high">Spotlight</span>
        </div>
        <div class="gp-grades">
          <p class="text-high"><Token name=".text-high" /> High contrast text</p>
          <p class="text-strong"><Token name=".text-strong" /> Body text for reading</p>
          <p class="text-subtle"><Token name=".text-subtle" /> Secondary information</p>
          <p class="text-subtlest"><Token name=".text-subtlest" /> Hints and metadata</p>
        </div>
        <div class="gp-borders">
          <div class="gp-border-sample text-subtlest border-decorative">decorative</div>
          <div class="gp-border-sample text-subtlest border-interactive">interactive</div>
          <div class="gp-border-sample text-subtlest border-critical">critical</div>
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

.gp-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.gp-surface {
  padding: 0.85rem 1rem;
  transition: background 0.3s ease;
}

.gp-header {
  margin-bottom: 0.5rem;
}

.gp-surface-name {
  font-weight: 600;
  font-size: 0.75rem;
}

.gp-grades {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.gp-grades p {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.5;
}



.gp-borders {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.6rem;
}

.gp-border-sample {
  flex: 1;
  padding: 0.25rem 0.4rem;
  border: 1px solid;
  border-radius: 4px;
  font-size: 0.6rem;
  font-family: var(--vp-font-family-mono);
  text-align: center;
}
</style>
