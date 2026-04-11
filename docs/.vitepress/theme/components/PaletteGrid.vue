<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useDarkMode } from "../composables/useDarkMode";
import DarkToggle from "./DarkToggle.vue";

const { isDark } = useDarkMode();

// Generate a Geist-style 10-step scale for a given hue
function generateScale(
  hue: number,
  chroma: number,
  mode: "light" | "dark",
): { l: number; c: number; h: number; css: string }[] {
  const steps = 10;
  const result = [];
  for (let i = 0; i < steps; i++) {
    // Lightness ranges from very light to very dark
    const t = i / (steps - 1);
    const l = mode === "light" ? 0.97 - t * 0.87 : 0.13 + t * 0.82;
    // Taper chroma near extremes (safe bicone)
    const taper = 1 - Math.abs(2 * l - 1);
    const c = chroma * taper;
    result.push({
      l,
      c,
      h: hue,
      css: `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue})`,
    });
  }
  return result;
}

interface ScaleRow {
  name: string;
  steps: { l: number; c: number; h: number; css: string }[];
}

const mode = computed<"light" | "dark">(() =>
  isDark.value ? "dark" : "light",
);

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

// Selection state for the "try to compose" interaction
const selectedBg = ref<{ scale: number; step: number } | null>(null);
const selectedFg = ref<{ scale: number; step: number } | null>(null);
const phase = ref<"browse" | "pick-bg" | "pick-fg" | "result">("browse");

function startCompose() {
  phase.value = "pick-bg";
  selectedBg.value = null;
  selectedFg.value = null;
}

function pickSwatch(scaleIdx: number, stepIdx: number) {
  if (phase.value === "pick-bg") {
    selectedBg.value = { scale: scaleIdx, step: stepIdx };
    phase.value = "pick-fg";
  } else if (phase.value === "pick-fg") {
    selectedFg.value = { scale: scaleIdx, step: stepIdx };
    phase.value = "result";
  }
}

function reset() {
  phase.value = "browse";
  selectedBg.value = null;
  selectedFg.value = null;
}

const bgColor = computed(() => {
  if (!selectedBg.value) return null;
  return scales.value[selectedBg.value.scale].steps[selectedBg.value.step];
});

const fgColor = computed(() => {
  if (!selectedFg.value) return null;
  return scales.value[selectedFg.value.scale].steps[selectedFg.value.step];
});

// We'll compute APCA once the user picks both — showing them the answer
// they had to manually figure out
const ready = ref(false);
let contrastFn: ((a: number, b: number) => number) | null = null;

onMounted(async () => {
  const mod = await import("@design-axioms/color");
  contrastFn = mod.contrastForPair;
  ready.value = true;
});

const achievedApca = computed(() => {
  if (!bgColor.value || !fgColor.value || !contrastFn) return null;
  return Math.round(contrastFn(fgColor.value.l, bgColor.value.l));
});

function isSelected(scaleIdx: number, stepIdx: number): boolean {
  if (
    selectedBg.value?.scale === scaleIdx &&
    selectedBg.value?.step === stepIdx
  )
    return true;
  if (
    selectedFg.value?.scale === scaleIdx &&
    selectedFg.value?.step === stepIdx
  )
    return true;
  return false;
}
</script>

<template>
  <div class="palette-grid">
    <!-- Toolbar -->
    <div class="pg-toolbar">
      <div class="pg-left">
        <template v-if="phase === 'browse'">
          <button class="pg-compose-btn" @click="startCompose">
            Try to compose
          </button>
          <span class="pg-hint">Pick a background, then text.</span>
        </template>
        <template v-else-if="phase === 'pick-bg'">
          <span class="pg-prompt">Pick a background color.</span>
          <button class="pg-reset" @click="reset">Cancel</button>
        </template>
        <template v-else-if="phase === 'pick-fg'">
          <span class="pg-prompt">Now pick a text color.</span>
          <button class="pg-reset" @click="reset">Cancel</button>
        </template>
        <template v-else-if="phase === 'result'">
          <span class="pg-prompt">Does it work?</span>
          <button class="pg-reset" @click="reset">Try again</button>
        </template>
      </div>
      <DarkToggle v-model="isDark" />
    </div>

    <!-- The palette -->
    <div class="pg-scales">
      <div v-for="(scale, si) in scales" :key="scale.name" class="pg-row">
        <span class="pg-label">{{ scale.name }}</span>
        <div class="pg-swatches">
          <button
            v-for="(step, ti) in scale.steps"
            :key="ti"
            class="pg-swatch"
            :class="{
              clickable: phase === 'pick-bg' || phase === 'pick-fg',
              selected: isSelected(si, ti),
            }"
            :style="{ background: step.css }"
            @click="pickSwatch(si, ti)"
          />
        </div>
      </div>
    </div>

    <!-- Result panel -->
    <div v-if="phase === 'result' && bgColor && fgColor" class="pg-result">
      <div
        class="pg-specimen"
        :style="{ background: bgColor.css, color: fgColor.css }"
      >
        <span class="pg-specimen-text">Aa</span>
        <span class="pg-specimen-body"
          >Is this readable?</span
        >
      </div>
      <div class="pg-verdict">
        <span class="pg-apca" :class="{ pass: (achievedApca ?? 0) >= 75, fail: (achievedApca ?? 0) < 75 }">
          Lc {{ achievedApca }}
        </span>
        <span class="pg-apca-label" v-if="(achievedApca ?? 0) >= 90">
          Body text: pass
        </span>
        <span class="pg-apca-label" v-else-if="(achievedApca ?? 0) >= 75">
          Large text only
        </span>
        <span class="pg-apca-label" v-else>
          Fails APCA minimum
        </span>
        <p class="pg-moral">
          You just did manual contrast checking. For every combination. In both modes.
        </p>
      </div>
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

.pg-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  gap: 0.5rem;
}

.pg-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pg-compose-btn {
  padding: 0.25rem 0.75rem;
  border-radius: 5px;
  border: 1px solid var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
  color: white;
  cursor: pointer;
  font-size: 0.75rem;
  font-family: var(--vp-font-family-base);
  font-weight: 500;
}

.pg-compose-btn:hover {
  opacity: 0.9;
}

.pg-hint {
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
}

.pg-prompt {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.pg-reset {
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 0.7rem;
  font-family: var(--vp-font-family-base);
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
  cursor: default;
  transition: transform 0.1s, box-shadow 0.1s;
  padding: 0;
  min-height: 32px;
}

.pg-swatch.clickable {
  cursor: pointer;
}

.pg-swatch.clickable:hover {
  transform: scale(1.15);
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.pg-swatch.selected {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 1px;
  transform: scale(1.1);
  z-index: 2;
}

.pg-result {
  border-top: 1px solid var(--vp-c-divider);
  padding: 1rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--vp-c-bg-soft);
}

.pg-specimen {
  width: 120px;
  height: 80px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.pg-specimen-text {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}

.pg-specimen-body {
  font-size: 0.7rem;
}

.pg-verdict {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pg-apca {
  font-family: var(--vp-font-family-mono);
  font-size: 1rem;
  font-weight: 600;
}

.pg-apca.pass {
  color: var(--vp-c-green-2);
}

.pg-apca.fail {
  color: var(--vp-c-red-2);
}

.pg-apca-label {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}

.pg-moral {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin: 0.5rem 0 0;
  font-style: italic;
}
</style>
