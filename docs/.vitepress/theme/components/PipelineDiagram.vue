<script setup lang="ts">
import { ref, onMounted } from "vue";
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
    selector: ".pipeline-root",
  });
  ready.value = true;
});

const stages = [
  {
    name: "Config",
    items: ["Surfaces", "Anchors", "Targets", "Key Colors"],
  },
  {
    name: "Solver",
    items: ["Place surfaces", "Solve text", "Solve borders", "Classify"],
  },
  {
    name: "CSS",
    items: ["light-dark()", "oklch()", "@property", "Taper calc()"],
  },
  {
    name: "Runtime",
    items: ["ThemeBuilder", "color-scheme", "Constructible sheets", "Custom elements"],
  },
];
</script>

<template>
  <div v-if="ready" ref="rootEl" class="pipeline-root surface-workspace">
    <component :is="'style'" v-text="css" />

    <div class="pl-flow">
      <div v-for="(stage, i) in stages" :key="stage.name" class="pl-stage surface-card border-decorative">
        <span class="text-high pl-stage-name">{{ stage.name }}</span>
        <ul class="pl-items">
          <li v-for="item in stage.items" :key="item" class="text-subtle pl-item">{{ item }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pipeline-root {
  margin: 1.5rem 0;
  border-radius: 8px;
  padding: 1.25rem;
}

.pl-flow {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.pl-stage {
  border-width: 1px;
  border-style: solid;
  border-radius: 6px;
  padding: 0.75rem;
  position: relative;
}

.pl-stage-name {
  font-size: 0.8rem;
  font-weight: 600;
  display: block;
  margin-bottom: 0.5rem;
}

.pl-items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.pl-item {
  font-size: 0.65rem;
  line-height: 1.6;
}

/* Arrows between stages */
.pl-stage:not(:last-child)::after {
  content: "→";
  position: absolute;
  right: -0.55rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: var(--axm-text-subtlest);
  z-index: 1;
}

@media (max-width: 640px) {
  .pl-flow {
    grid-template-columns: 1fr 1fr;
  }
  .pl-stage:nth-child(2)::after {
    display: none;
  }
}
</style>
