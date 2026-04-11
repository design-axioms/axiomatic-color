<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useDarkMode } from "../composables/useDarkMode";
import Token from "./Token.vue";
import ApcaBadge from "./ApcaBadge.vue";

const { isDark } = useDarkMode();

function generateScale(
  hue: number,
  chroma: number,
  mode: "light" | "dark",
): { l: number; c: number; h: number; css: string }[] {
  const steps = 10;
  const result = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const l = mode === "light" ? 0.97 - t * 0.87 : 0.13 + t * 0.82;
    const taper = 1 - Math.abs(2 * l - 1);
    const c = chroma * taper;
    result.push({ l, c, h: hue, css: `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue})` });
  }
  return result;
}

interface ScaleRow { name: string; steps: { l: number; c: number; h: number; css: string }[] }

const mode = computed<"light" | "dark">(() => isDark.value ? "dark" : "light");

const scales = computed<ScaleRow[]>(() => {
  const m = mode.value;
  return [
    { name: "Gray", steps: generateScale(0, 0, m) },
    { name: "Purple", steps: generateScale(288, 0.18, m) },
    { name: "Teal", steps: generateScale(195, 0.12, m) },
    { name: "Green", steps: generateScale(145, 0.15, m) },
    { name: "Amber", steps: generateScale(85, 0.16, m) },
    { name: "Red", steps: generateScale(25, 0.18, m) },
  ];
});

const selectedBg = ref<{ scale: number; step: number } | null>(null);
const selectedFg = ref<{ scale: number; step: number } | null>(null);
const hasEverCompleted = ref(false);

const ready = ref(false);
let contrastFn: ((a: number, b: number) => number) | null = null;

interface SolvedRef { slug: string; label: string; lightness: { light: number; dark: number } }
const solvedSurfaces = ref<SolvedRef[]>([]);

const TEXT_GRADE_TARGETS = [
  { key: "high", label: ".text-high", target: 100 },
  { key: "strong", label: ".text-strong", target: 95 },
  { key: "subtle", label: ".text-subtle", target: 90 },
  { key: "subtlest", label: ".text-subtlest", target: 75 },
] as const;

onMounted(async () => {
  const mod = await import("@design-axioms/color");
  contrastFn = mod.contrastForPair;
  const output = mod.solve(mod.DEFAULT_CONFIG);
  const refs: SolvedRef[] = [];
  for (const group of mod.DEFAULT_CONFIG.groups) {
    for (const s of group.surfaces) {
      const light = output.light.surfaces.find((x) => x.slug === s.slug);
      const dark = output.dark.surfaces.find((x) => x.slug === s.slug);
      if (light && dark) refs.push({ slug: s.slug, label: s.label, lightness: { light: light.lightness, dark: dark.lightness } });
    }
  }
  solvedSurfaces.value = refs;
  ready.value = true;
});

const bgColor = computed(() => {
  if (!selectedBg.value) return null;
  return scales.value[selectedBg.value.scale].steps[selectedBg.value.step];
});

const fgColor = computed(() => {
  if (!selectedFg.value) return null;
  return scales.value[selectedFg.value.scale].steps[selectedFg.value.step];
});

const achievedApca = computed(() => {
  if (!bgColor.value || !fgColor.value || !contrastFn) return null;
  return Math.round(contrastFn(fgColor.value.l, bgColor.value.l));
});

const hasPair = computed(() => bgColor.value !== null && fgColor.value !== null);

function swatchApca(si: number, ti: number): number | null {
  if (!bgColor.value || !contrastFn) return null;
  return Math.round(contrastFn(scales.value[si].steps[ti].l, bgColor.value.l));
}

function swatchValid(si: number, ti: number): boolean {
  const apca = swatchApca(si, ti);
  return apca !== null && apca >= 75;
}

function isBg(si: number, ti: number) { return selectedBg.value?.scale === si && selectedBg.value?.step === ti; }
function isFg(si: number, ti: number) { return selectedFg.value?.scale === si && selectedFg.value?.step === ti; }

function isDimmed(si: number, ti: number): boolean {
  if (!selectedBg.value) return false;
  if (isBg(si, ti) || isFg(si, ti)) return false;
  return !swatchValid(si, ti);
}

function clickSwatch(si: number, ti: number) {
  if (isBg(si, ti)) { selectedBg.value = null; selectedFg.value = null; return; }
  if (isFg(si, ti)) { selectedFg.value = null; return; }
  if (!selectedBg.value) { selectedBg.value = { scale: si, step: ti }; selectedFg.value = null; return; }
  if (swatchValid(si, ti)) {
    selectedFg.value = { scale: si, step: ti };
    if (!hasEverCompleted.value) hasEverCompleted.value = true;
  } else {
    selectedBg.value = { scale: si, step: ti };
    selectedFg.value = null;
  }
}

watch(mode, () => { selectedBg.value = null; selectedFg.value = null; });

const nearestSurface = computed(() => {
  if (!bgColor.value || solvedSurfaces.value.length === 0) return null;
  let best: SolvedRef | null = null;
  let bestDist = Infinity;
  for (const s of solvedSurfaces.value) {
    const dist = Math.abs(s.lightness[mode.value] - bgColor.value.l);
    if (dist < bestDist) { bestDist = dist; best = s; }
  }
  return best;
});

const nearestGrade = computed(() => {
  if (achievedApca.value === null) return null;
  let best: (typeof TEXT_GRADE_TARGETS)[number] | null = null;
  let bestDist = Infinity;
  for (const g of TEXT_GRADE_TARGETS) {
    const dist = Math.abs(achievedApca.value - g.target);
    if (dist < bestDist) { bestDist = dist; best = g; }
  }
  return best;
});
</script>

<template>
  <div class="palette-grid">
    <div class="pg-scales">
      <div v-for="(scale, si) in scales" :key="scale.name" class="pg-row">
        <span class="pg-label">{{ scale.name }}</span>
        <div class="pg-swatches">
          <button v-for="(step, ti) in scale.steps" :key="ti" class="pg-swatch"
            :class="{ 'is-bg': isBg(si, ti), 'is-fg': isFg(si, ti), dimmed: isDimmed(si, ti) }"
            :style="{ background: step.css }" @click="clickSwatch(si, ti)" />
        </div>
      </div>
    </div>

    <div class="pg-strip" :class="{ active: !!selectedBg }">
      <div v-if="!selectedBg" class="pg-strip-empty">Click any color to use it as a surface.</div>

      <template v-else-if="!selectedFg">
        <div class="pg-surface-slab" :style="{ background: bgColor!.css }">
          <span class="pg-ghost" :style="{ color: bgColor!.l > 0.5 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)' }">Aa</span>
        </div>
        <div class="pg-strip-prompt">Pick a bright swatch for text.</div>
      </template>

      <template v-else>
        <div class="pg-surface-slab" :style="{ background: bgColor!.css }">
          <span class="pg-live-text" :style="{ color: fgColor!.css }">Aa</span>
          <span class="pg-live-body" :style="{ color: fgColor!.css }">Body text</span>
        </div>
        <div class="pg-strip-info">
          <ApcaBadge :value="achievedApca ?? 0" :target="75" />
          <span v-if="(achievedApca ?? 0) >= 90" class="pg-verdict pass">Passes for body text</span>
          <span v-else-if="(achievedApca ?? 0) >= 75" class="pg-verdict close">Large text only</span>
          <span v-else class="pg-verdict fail">Below APCA minimum</span>
          <div v-if="nearestSurface && nearestGrade && (achievedApca ?? 0) >= 75" class="pg-tokens">
            <Token :name="`.surface-${nearestSurface.slug}`" />
            <span class="pg-plus">+</span>
            <Token :name="nearestGrade.label" />
          </div>
        </div>
      </template>

      <p v-if="hasEverCompleted && hasPair" class="pg-annotation">
        You just did manual contrast checking. The system does this for every combination, in both modes, automatically.
      </p>
    </div>
  </div>
</template>

<style scoped>
.palette-grid { margin: 1.5rem 0; border-radius: 8px; overflow: hidden; border: 1px solid var(--vp-c-divider); }
.pg-scales { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
.pg-row { display: flex; align-items: center; gap: 0.75rem; }
.pg-label { font-size: 0.75rem; font-weight: 500; color: var(--vp-c-text-2); min-width: 50px; text-align: right; }
.pg-swatches { display: flex; gap: 2px; flex: 1; }

.pg-swatch {
  flex: 1; aspect-ratio: 1; border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer; padding: 0; min-height: 32px;
  transition: transform 0.15s, opacity 0.15s, box-shadow 0.15s;
}
.pg-swatch:hover { transform: scale(1.12); z-index: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
.pg-swatch.is-bg { outline: 3px solid var(--vp-c-text-1); outline-offset: 1px; transform: scale(1.08); z-index: 2; border-radius: 2px; }
.pg-swatch.is-fg { outline: 3px solid var(--vp-c-brand-1); outline-offset: 1px; transform: scale(1.08); z-index: 2; }
.pg-swatch.dimmed { opacity: 0.12; transform: scale(0.88); }
.pg-swatch.dimmed:hover { opacity: 0.4; transform: scale(1.0); }

.pg-strip {
  border-top: 1px solid var(--vp-c-divider);
  padding: 0.75rem; min-height: 48px;
  display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
  background: var(--vp-c-bg-soft);
}

.pg-strip-empty { font-size: 0.8rem; color: var(--vp-c-text-3); width: 100%; text-align: center; padding: 0.25rem 0; }

.pg-surface-slab {
  width: 80px; height: 56px; border-radius: 6px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.1rem; flex-shrink: 0;
}
.pg-ghost { font-size: 1.5rem; font-weight: 700; line-height: 1; }
.pg-strip-prompt { font-size: 0.8rem; color: var(--vp-c-text-2); }
.pg-live-text { font-size: 1.4rem; font-weight: 700; line-height: 1; }
.pg-live-body { font-size: 0.6rem; }

.pg-strip-info { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.pg-verdict { font-size: 0.75rem; font-weight: 500; }
.pg-verdict.pass { color: var(--vp-c-green-2); }
.pg-verdict.close { color: var(--vp-c-yellow-2); }
.pg-verdict.fail { color: var(--vp-c-red-2); }
.pg-tokens { display: flex; align-items: center; gap: 0.25rem; }
.pg-plus { font-size: 0.75rem; color: var(--vp-c-text-3); }
.pg-annotation { width: 100%; font-size: 0.75rem; color: var(--vp-c-text-3); margin: 0.25rem 0 0; font-style: italic; }
</style>