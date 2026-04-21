<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useDarkMode } from "../composables/useDarkMode";
import Token from "./Token.vue";
import ApcaBadge from "./ApcaBadge.vue";

const { isDark } = useDarkMode();

interface PaletteStep {
  l: number;
  c: number;
  h: number;
  css: string;
}

// Palette lightness, lazily loaded from the solver package so the grid
// tracks the real scale rather than a hand-tuned parallel copy.
//
// Layout: page scale first (position 0 → N), then inverted scale in its
// natural order (position 0 = most-extreme-inverted). At the polarity
// boundary the scale turns around (light mode: bright → dark → back-up
// slightly) but at those low lightness values the turn-around is
// imperceptible; what matters is that un-dotted swatches end up at the
// row edge rather than mid-run.
const paletteLightness = ref<{ light: number[]; dark: number[] } | null>(null);

function generateScale(hue: number, chroma: number, mode: "light" | "dark"): PaletteStep[] {
  const positions = paletteLightness.value?.[mode] ?? [];
  return positions.map((l) => {
    const taper = 1 - Math.abs(2 * l - 1);
    const c = chroma * taper;
    return {
      l,
      c,
      h: hue,
      css: `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue})`,
    };
  });
}

interface ScaleRow {
  name: string;
  /** Key color this row maps to (e.g. "brand"), or null for neutral gray. */
  keyColor: string | null;
  steps: { l: number; c: number; h: number; css: string }[];
}

const mode = computed<"light" | "dark">(() => (isDark.value ? "dark" : "light"));

const scales = computed<ScaleRow[]>(() => {
  const m = mode.value;
  return [
    { name: "Gray", keyColor: null, steps: generateScale(0, 0, m) },
    { name: "Purple", keyColor: "brand", steps: generateScale(288, 0.18, m) },
    { name: "Teal", keyColor: "accent", steps: generateScale(195, 0.12, m) },
    { name: "Green", keyColor: "success", steps: generateScale(145, 0.15, m) },
    { name: "Amber", keyColor: "warning", steps: generateScale(85, 0.16, m) },
    { name: "Red", keyColor: "error", steps: generateScale(25, 0.18, m) },
  ];
});

const selectedBg = ref<{ scale: number; step: number } | null>(null);
const selectedFg = ref<{ scale: number; step: number } | null>(null);
const hasEverCompleted = ref(false);

const ready = ref(false);
let contrastFn: ((a: number, b: number) => number) | null = null;

interface SolvedRef {
  slug: string;
  label: string;
  lightness: { light: number; dark: number };
}
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
  const config = mod.DEFAULT_CONFIG;
  const output = mod.solve(config);

  paletteLightness.value = {
    light: [...config.scale.page.light, ...config.scale.inverted.light],
    dark: [...config.scale.page.dark, ...config.scale.inverted.dark],
  };

  const refs: SolvedRef[] = [];
  for (const polarity of ["page", "inverted"] as const) {
    const bucket = config.surfaces[polarity];
    if (!bucket) continue;
    for (const [slug, spec] of Object.entries(bucket)) {
      const label = typeof spec === "number" ? slug : (spec.label ?? slug);
      const light = output.light.surfaces.find((x) => x.slug === slug);
      const dark = output.dark.surfaces.find((x) => x.slug === slug);
      if (light && dark)
        refs.push({
          slug,
          label,
          lightness: { light: light.lightness, dark: dark.lightness },
        });
    }
  }
  solvedSurfaces.value = refs;
  ready.value = true;
});

// Which solved surface (if any) does this swatch map to? (within L threshold)
const SURFACE_THRESHOLD = 0.06;

function swatchSurface(si: number, ti: number): SolvedRef | null {
  if (solvedSurfaces.value.length === 0) return null;
  const step = scales.value[si].steps[ti];
  const m = mode.value;
  let best: SolvedRef | null = null;
  let bestDist = Infinity;
  for (const s of solvedSurfaces.value) {
    const dist = Math.abs(s.lightness[m] - step.l);
    if (dist < bestDist) {
      bestDist = dist;
      best = s;
    }
  }
  return bestDist <= SURFACE_THRESHOLD ? best : null;
}

function isValidSurface(si: number, ti: number): boolean {
  return swatchSurface(si, ti) !== null;
}

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

// Which text grade (if any) the fg-on-selected-bg pair achieves.
// Mirrors TEXT_GRADES from the core package: high=100, strong=95,
// subtle=90, subtlest=75. subtlest is the 'large only' floor.
type SwatchGrade = "high" | "strong" | "subtle" | "subtlest" | "fail";
function swatchGrade(si: number, ti: number): SwatchGrade {
  const apca = swatchApca(si, ti);
  if (apca === null || apca < 75) return "fail";
  if (apca >= 100) return "high";
  if (apca >= 95) return "strong";
  if (apca >= 90) return "subtle";
  return "subtlest";
}

function isBg(si: number, ti: number) {
  return selectedBg.value?.scale === si && selectedBg.value?.step === ti;
}
function isFg(si: number, ti: number) {
  return selectedFg.value?.scale === si && selectedFg.value?.step === ti;
}

function isSameHueRow(si: number): boolean {
  return selectedBg.value !== null && selectedBg.value.scale === si;
}

// Three swatch states when bg is selected:
// 'same-hue-valid' — expressible, full brightness + Aa
// 'cross-hue-valid' — contrast works but not expressible — softer
// 'invalid' — fails contrast — dimmed
function swatchState(
  si: number,
  ti: number,
): "none" | "same-hue-valid" | "cross-hue-valid" | "invalid" {
  if (!selectedBg.value) return "none";
  if (isBg(si, ti)) return "none";
  if (isFg(si, ti)) return "none";
  if (!swatchValid(si, ti)) return "invalid";
  if (isSameHueRow(si)) return "same-hue-valid";
  return "cross-hue-valid";
}

// Which marker variant (if any) to show on a non-bg swatch. Unlike
// swatchState, this also applies to the selected fg — its marker stays
// visible so the chosen text tier is legible at a glance.
type MarkerTier = "same" | "cross" | "fail" | "none";
function markerTier(si: number, ti: number): MarkerTier {
  if (!selectedBg.value) return "none";
  if (isBg(si, ti)) return "none";
  if (!swatchValid(si, ti)) return "fail";
  if (isSameHueRow(si)) return "same";
  return "cross";
}

// Message shown when clicking a non-surface swatch with no bg selected
const notSurfaceMsg = ref<string | null>(null);

function clickSwatch(si: number, ti: number) {
  notSurfaceMsg.value = null;

  if (isBg(si, ti)) {
    selectedBg.value = null;
    selectedFg.value = null;
    return;
  }
  if (isFg(si, ti)) {
    selectedFg.value = null;
    return;
  }

  // No bg selected — trying to pick a surface
  if (!selectedBg.value) {
    const surface = swatchSurface(si, ti);
    if (surface) {
      selectedBg.value = { scale: si, step: ti };
      selectedFg.value = null;
    } else {
      // Not near any surface — show why
      const step = scales.value[si].steps[ti];
      let nearest: SolvedRef | null = null;
      let nearestDist = Infinity;
      for (const s of solvedSurfaces.value) {
        const dist = Math.abs(s.lightness[mode.value] - step.l);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = s;
        }
      }
      notSurfaceMsg.value = nearest
        ? `L=${step.l.toFixed(2)} isn't a surface. Nearest: .surface-${nearest.slug} (L=${nearest.lightness[mode.value].toFixed(2)})`
        : "No surfaces defined.";
    }
    return;
  }

  // Bg is selected — picking foreground. Any swatch can be selected to show the result.
  selectedFg.value = { scale: si, step: ti };
  if (!hasEverCompleted.value) hasEverCompleted.value = true;
}

function reset() {
  selectedBg.value = null;
  selectedFg.value = null;
  notSurfaceMsg.value = null;
}

watch(mode, reset);

// Is the foreground from a different hue row than the background?
const isCrossHue = computed(() => {
  if (!selectedBg.value || !selectedFg.value) return false;
  return selectedBg.value.scale !== selectedFg.value.scale;
});

// Badge status for the composition equation. Mirrors the verdict text:
//   Fails      -> unmet  (Lc < 75)
//   Wrong hue  -> close  (cross-hue, any Lc)
//   Large only -> close  (same-hue, Lc 75-89)
//   Pass       -> met    (same-hue, Lc 90+)
// Keeps the badge color honest: green only when the verdict is 'Pass'.
const verdictStatus = computed<"met" | "close" | "unmet">(() => {
  const apca = achievedApca.value ?? 0;
  if (apca < 75) return "unmet";
  if (isCrossHue.value) return "close";
  if (apca >= 90) return "met";
  return "close";
});

// Should this swatch show an 'Aa' label?
function showAa(si: number, ti: number): boolean {
  const state = swatchState(si, ti);
  return state === "same-hue-valid";
}

// Should this swatch show a dimmed 'Aa' (cross-hue valid)?
function showCrossAa(si: number, ti: number): boolean {
  return swatchState(si, ti) === "cross-hue-valid";
}

// Pick black or white for maximum contrast against this swatch
function markerColor(si: number, ti: number): string {
  if (!contrastFn) return "#000";
  const step = scales.value[si].steps[ti];
  const blackContrast = Math.abs(contrastFn(0, step.l));
  const whiteContrast = Math.abs(contrastFn(1, step.l));
  return blackContrast > whiteContrast ? "#000" : "#fff";
}

// Same logic but slightly softer for secondary markers
function softMarkerColor(si: number, ti: number): string {
  if (!contrastFn) return "rgba(0,0,0,0.65)";
  const step = scales.value[si].steps[ti];
  const blackContrast = Math.abs(contrastFn(0, step.l));
  const whiteContrast = Math.abs(contrastFn(1, step.l));
  return blackContrast > whiteContrast ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.65)";
}

const nearestSurface = computed(() => {
  if (!bgColor.value || solvedSurfaces.value.length === 0) return null;
  let best: SolvedRef | null = null;
  let bestDist = Infinity;
  for (const s of solvedSurfaces.value) {
    const dist = Math.abs(s.lightness[mode.value] - bgColor.value.l);
    if (dist < bestDist) {
      bestDist = dist;
      best = s;
    }
  }
  return best;
});

const surfaceDistance = computed(() => {
  if (!bgColor.value || !nearestSurface.value) return null;
  return (
    Math.round(Math.abs(bgColor.value.l - nearestSurface.value.lightness[mode.value]) * 1000) / 1000
  );
});

const nearestGrade = computed(() => {
  if (achievedApca.value === null) return null;
  let best: (typeof TEXT_GRADE_TARGETS)[number] | null = null;
  let bestDist = Infinity;
  for (const g of TEXT_GRADE_TARGETS) {
    const dist = Math.abs(achievedApca.value - g.target);
    if (dist < bestDist) {
      bestDist = dist;
      best = g;
    }
  }
  return best;
});

// Atmosphere token for the selected surface's row (null for gray).
const selectedBgHueToken = computed<string | null>(() => {
  if (!selectedBg.value) return null;
  const kc = scales.value[selectedBg.value.scale]?.keyColor;
  return kc ? `.hue-${kc}` : null;
});
</script>

<template>
  <div class="palette-grid">
    <div class="pg-scales">
      <div v-for="(scale, si) in scales" :key="scale.name" class="pg-row">
        <span class="pg-label">{{ scale.name }}</span>
        <div class="pg-swatches">
          <button
            v-for="(step, ti) in scale.steps"
            :key="ti"
            class="pg-swatch"
            :class="{
              'is-bg': isBg(si, ti),
              'is-fg': isFg(si, ti),
            }"
            :style="{ background: step.css }"
            @click="clickSwatch(si, ti)"
          >
            <!-- Browse mode: dot on surface-capable swatches -->
            <span
              v-if="!selectedBg && isValidSurface(si, ti)"
              class="pg-dot"
              :style="{ background: markerColor(si, ti) }"
            />
            <!-- Surface selected: markers on all non-bg swatches, tiered by
                 achieved text grade (high/strong/subtle/subtlest/fail).
                 The selected fg keeps its Aa because that's the whole
                 point — it's the text sample. The bg stays empty (it's
                 the surface/context, not a text choice). -->
            <template v-else-if="selectedBg && !isBg(si, ti)">
              <span
                v-if="markerTier(si, ti) === 'same'"
                class="pg-marker"
                :class="`pg-marker-${swatchGrade(si, ti)}`"
                :style="{ color: markerColor(si, ti) }"
                >Aa</span
              >
              <span
                v-else-if="markerTier(si, ti) === 'cross'"
                class="pg-marker pg-marker-cross"
                :class="`pg-marker-${swatchGrade(si, ti)}`"
                :style="{ color: softMarkerColor(si, ti) }"
                >Aa</span
              >
              <span
                v-else-if="markerTier(si, ti) === 'fail'"
                class="pg-marker pg-marker-x"
                :style="{ color: softMarkerColor(si, ti) }"
                >×</span
              >
            </template>
          </button>
        </div>
      </div>
    </div>

    <!-- Composition workspace — always visible -->
    <div class="pg-workspace">
      <!-- Empty state -->
      <div v-if="!selectedBg" class="pg-ws-empty">
        <span v-if="notSurfaceMsg" class="pg-not-surface">{{ notSurfaceMsg }}</span>
        <span v-else class="pg-ws-hint"
          >Click a <strong>dotted</strong> swatch to pick a surface.</span
        >
      </div>

      <!-- Composition equation: surface + text = result -->
      <template v-else>
        <button class="pg-close" @click="reset" title="Clear selection">×</button>

        <div class="pg-equation">
          <div class="pg-eq-slab" :style="{ background: bgColor!.css }">
            <span
              class="pg-eq-label"
              :style="{ color: markerColor(selectedBg!.scale, selectedBg!.step) }"
              >Surface</span
            >
          </div>
          <span class="pg-eq-op">+</span>
          <div
            v-if="fgColor"
            class="pg-eq-slab pg-eq-slab-fg"
            :style="{ background: bgColor!.css }"
          >
            <span class="pg-eq-aa" :style="{ color: fgColor!.css }">Aa</span>
          </div>
          <div
            v-else
            class="pg-eq-slab pg-eq-slab-fg pg-eq-placeholder"
            :style="{ background: bgColor!.css }"
          >
            <span
              class="pg-eq-ghost"
              :style="{ color: bgColor!.l > 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)' }"
              >Aa</span
            >
          </div>
          <span class="pg-eq-op">=</span>
          <div class="pg-eq-result">
            <template v-if="selectedFg">
              <ApcaBadge :value="achievedApca ?? 0" :status="verdictStatus" />
              <span v-if="(achievedApca ?? 0) < 75" class="pg-verdict fail">Fails</span>
              <span v-else-if="isCrossHue" class="pg-verdict close">Wrong hue</span>
              <span v-else-if="(achievedApca ?? 0) >= 90" class="pg-verdict pass">Pass</span>
              <span v-else class="pg-verdict close">Large only</span>
            </template>
            <span v-else class="pg-eq-waiting">—</span>
          </div>
        </div>

        <!-- Tokens row: shows what the selection maps to in the system.
             Atmosphere (.hue-*) comes from the bg's row — that's the
             class you'd put on the surface in HTML. Gray rows have no
             hue token. -->
        <div v-if="nearestSurface" class="pg-eq-tokens">
          <Token :name="`.surface-${nearestSurface.slug}`" />
          <template v-if="selectedBgHueToken">
            <span class="pg-eq-tokens-op">+</span>
            <Token :name="selectedBgHueToken" />
          </template>
          <span class="pg-eq-tokens-op">+</span>
          <Token
            v-if="selectedFg && nearestGrade && !isCrossHue && (achievedApca ?? 0) >= 75"
            :name="nearestGrade.label"
          />
          <span v-else-if="!selectedFg" class="pg-eq-pick">pick text above</span>
          <span v-else class="pg-eq-pick">—</span>
        </div>

        <!-- Detail messages — only for failure/cross-hue cases; success shown by token row above -->
        <div v-if="selectedFg && ((achievedApca ?? 0) < 75 || isCrossHue)" class="pg-detail">
          <template v-if="(achievedApca ?? 0) < 75">
            <span class="pg-fail-detail">Needs Lc 75+, got {{ achievedApca }}.</span>
          </template>
          <template v-else-if="isCrossHue">
            <span class="pg-cross-hue"
              >Text inherits the surface hue — this pair isn't expressible.</span
            >
          </template>
        </div>

        <p v-if="hasEverCompleted && hasPair" class="pg-annotation">
          You just did manual contrast checking. The system does this for every combination, in both
          modes, automatically.
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.palette-grid {
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
}
.pg-scales {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.pg-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.pg-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  min-width: 50px;
  text-align: right;
}
.pg-swatches {
  display: flex;
  gap: 2px;
  flex: 1;
}

.pg-swatch {
  flex: 1;
  aspect-ratio: 1;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  padding: 0;
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.15s,
    opacity 0.15s,
    box-shadow 0.15s;
}
.pg-swatch:hover {
  transform: scale(1.12);
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
/* bg and fg selection share a common vocabulary: heavy dark outline.
   Solid = background (surface); dashed = foreground (text). The same
   treatment is echoed on the equation chips below so the eye connects
   a chip to its source swatch. A white halo (via box-shadow) keeps the
   outline visible against any swatch lightness.

   `!important` is used because VitePress's base style sets
   `button:focus:not(:focus-visible) { outline: none !important }` to
   suppress browser-default focus rings. Our selection outline is a
   semantic state, not a focus ring, and needs to win. */
.pg-swatch.is-bg,
.pg-swatch.is-fg {
  outline-color: var(--vp-c-text-1) !important;
  outline-width: 3px !important;
  outline-offset: 1px !important;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.85);
  transform: scale(1.08);
  z-index: 2;
}
.pg-swatch.is-bg {
  outline-style: solid !important;
  border-radius: 2px;
}
.pg-swatch.is-fg {
  outline-style: dashed !important;
}
/* Surface-capable dot marker */
.pg-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  pointer-events: none;
}

/* Foreground markers — tiered by achieved text grade.
   Larger + bolder = stronger contrast tier (closer to high=100). */
.pg-marker {
  line-height: 1;
  pointer-events: none;
}

/* high = Lc 100+ — full size, bold */
.pg-marker-high {
  font-size: 0.7rem;
  font-weight: 700;
}
/* strong = Lc 95+ — slightly smaller */
.pg-marker-strong {
  font-size: 0.6rem;
  font-weight: 700;
}
/* subtle = Lc 90+ — medium weight */
.pg-marker-subtle {
  font-size: 0.55rem;
  font-weight: 600;
}
/* subtlest = Lc 75+ — 'large only' tier. Thin to signal marginal. */
.pg-marker-subtlest {
  font-size: 0.5rem;
  font-weight: 400;
  opacity: 0.8;
}

.pg-marker-cross {
  border-bottom: 1px dashed currentColor;
  padding-bottom: 1px;
}

.pg-marker-x {
  font-size: 0.7rem;
  font-weight: 400;
  pointer-events: none;
}

/* --- Composition workspace --- */
.pg-workspace {
  border-top: 1px solid var(--vp-c-divider);
  padding: 0.75rem;
  background: var(--vp-c-bg-soft);
  min-height: 56px;
  position: relative;
}

.pg-ws-empty {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  text-align: center;
  padding: 0.25rem 0;
}

.pg-ws-hint strong {
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.pg-close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-3);
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  z-index: 1;
}

.pg-close:hover {
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-border);
}

.pg-equation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-right: 2rem; /* room for close button */
}

.pg-eq-tokens {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.pg-eq-tokens-op {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}

/* Equation chips echo the swatch outlines (same solid-vs-dashed vocab,
   same white halo) so the eye links each chip to its source swatch. */
.pg-eq-slab {
  width: 56px;
  height: 44px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: 3px solid var(--vp-c-text-1);
  outline-offset: 1px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.85);
}

.pg-eq-slab-fg {
  outline-style: dashed;
}

.pg-eq-label {
  font-size: 0.55rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pg-eq-aa {
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1;
}

.pg-eq-ghost {
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1;
}

.pg-eq-placeholder {
  outline-style: dashed;
  outline-color: rgba(128, 128, 128, 0.4);
}

.pg-eq-op {
  font-size: 0.9rem;
  font-weight: 300;
  color: var(--vp-c-text-3);
  text-align: center;
}

.pg-eq-result {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.pg-eq-waiting {
  font-size: 0.9rem;
  color: var(--vp-c-text-3);
}

.pg-eq-pick {
  font-size: 0.6rem;
  color: var(--vp-c-text-3);
}

.pg-detail {
  margin-top: 0.5rem;
  font-size: 0.75rem;
}

.pg-expressible {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--vp-c-text-2);
  flex-wrap: wrap;
}
.pg-verdict {
  font-size: 0.75rem;
  font-weight: 500;
}
.pg-verdict.pass {
  color: var(--vp-c-green-2);
}
.pg-verdict.close {
  color: var(--vp-c-yellow-2);
}
.pg-verdict.fail {
  color: var(--vp-c-red-2);
}
.pg-tokens {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.pg-plus {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}
.pg-cross-hue {
  font-size: 0.75rem;
  color: var(--vp-c-yellow-2);
  font-style: italic;
}
.pg-not-surface {
  color: var(--vp-c-yellow-2);
  font-size: 0.75rem;
}
.pg-fail-detail {
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
}
.pg-snap {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
}
.pg-snap-note {
  font-size: 0.65rem;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
}
.pg-annotation {
  width: 100%;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin: 0.25rem 0 0;
  font-style: italic;
}
</style>
