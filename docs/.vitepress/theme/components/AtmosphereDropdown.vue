<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useBrandColor, useAccentColor } from "../composables/useKeyColor";
import { useDarkMode } from "../composables/useDarkMode";
import { useReactiveTheme } from "../composables/useReactiveTheme";
import { useKeyColors } from "../composables/useKeyColors";
import DarkToggle from "./DarkToggle.vue";

const brand = useBrandColor();
const accent = useAccentColor();
const { isDark } = useDarkMode();
const { theme } = useReactiveTheme();
const keyColors = useKeyColors();
const expandedRow = ref<"brand" | "accent">("brand");

// Async-loaded core functions
const formatFn = ref<((l: number, c: number, h: number) => string) | null>(
  null,
);
const parseFn = ref<
  ((color: string) => { hue: number; chroma: number } | null) | null
>(null);

onMounted(async () => {
  const { formatOklchHex, parseKeyColor, registerColorSlider } =
    await import("@design-axioms/color");
  formatFn.value = formatOklchHex;
  parseFn.value = parseKeyColor;
  registerColorSlider();
});

// Per-row display hex
const brandHex = computed(() =>
  formatFn.value?.(0.6, brand.chroma.value, brand.hue.value) ?? "#000000",
);
const accentHex = computed(() =>
  formatFn.value?.(0.6, accent.chroma.value, accent.hue.value) ?? "#000000",
);

// Per-row editing state
const brandEdit = reactive({ editing: false, text: "", invalid: false });
const accentEdit = reactive({ editing: false, text: "", invalid: false });

watch(brandHex, (hex) => {
  if (!brandEdit.editing) brandEdit.text = hex;
});
watch(accentHex, (hex) => {
  if (!accentEdit.editing) accentEdit.text = hex;
});

function tryParseRow(row: "brand" | "accent", text: string) {
  const edit = row === "brand" ? brandEdit : accentEdit;
  if (!parseFn.value) return;
  const result = parseFn.value(text);
  if (result) {
    edit.invalid = false;
    theme.value?.setKeyColor(row, text);
  } else {
    edit.invalid = true;
  }
}

function commitRow(row: "brand" | "accent") {
  const edit = row === "brand" ? brandEdit : accentEdit;
  const hex = row === "brand" ? brandHex.value : accentHex.value;
  edit.editing = false;
  edit.invalid = false;
  edit.text = hex;
}

// Per-row presets: all key colors except the row's own name
const brandPresets = computed(() =>
  Object.entries(keyColors.value).filter(([name]) => name !== "brand"),
);
const accentPresets = computed(() =>
  Object.entries(keyColors.value).filter(([name]) => name !== "accent"),
);

function isPresetActive(
  row: "brand" | "accent",
  kc: { hue: number; chroma: number },
) {
  const h = row === "brand" ? brand.hue.value : accent.hue.value;
  const c = row === "brand" ? brand.chroma.value : accent.chroma.value;
  return Math.abs(h - kc.hue) < 0.5 && Math.abs(c - kc.chroma) < 0.005;
}

function selectPreset(
  row: "brand" | "accent",
  kc: { hue: number; chroma: number },
) {
  if (!formatFn.value) return;
  theme.value?.setKeyColor(row, formatFn.value(0.6, kc.chroma, kc.hue));
}

function applyNone(row: "brand" | "accent") {
  theme.value?.setKeyColor(row, "#808080");
}

// Per-row hue landmarks: other key colors (not self)
const brandLandmarks = computed(() => {
  const entries = Object.entries(keyColors.value).filter(
    ([n]) => n !== "brand",
  );
  return JSON.stringify(
    entries.map(([name, kc]) => ({
      value: kc.hue,
      color: `oklch(0.6 ${kc.chroma} ${kc.hue})`,
      name,
    })),
  );
});
const accentLandmarks = computed(() => {
  const entries = Object.entries(keyColors.value).filter(
    ([n]) => n !== "accent",
  );
  return JSON.stringify(
    entries.map(([name, kc]) => ({
      value: kc.hue,
      color: `oklch(0.6 ${kc.chroma} ${kc.hue})`,
      name,
    })),
  );
});

// Slider event handlers
function onHueInput(row: "brand" | "accent", e: Event) {
  const detail = (e as CustomEvent).detail;
  if (!detail) return;
  if (row === "brand") brand.hue.value = detail.value;
  else accent.hue.value = detail.value;
}

function onChromaInput(row: "brand" | "accent", e: Event) {
  const detail = (e as CustomEvent).detail;
  if (!detail) return;
  if (row === "brand") brand.chroma.value = detail.value;
  else accent.chroma.value = detail.value;
}

function onLandmarkClick(row: "brand" | "accent", e: Event) {
  const detail = (e as CustomEvent).detail;
  if (!detail) return;
  const kc = keyColors.value[detail.name];
  if (!kc) return;
  if (row === "brand") {
    brand.hue.value = kc.hue;
    brand.chroma.value = kc.chroma;
  } else {
    accent.hue.value = kc.hue;
    accent.chroma.value = kc.chroma;
  }
}

// Split circle indicator
const indicatorStyle = computed(() => {
  const bh = brand.hue.value;
  const bc = brand.chroma.value;
  const ah = accent.hue.value;
  const ac = accent.chroma.value;
  const brandBg =
    bc > 0 ? `oklch(0.6 ${bc} ${bh})` : "var(--vp-c-text-3)";
  const accentBg =
    ac > 0 ? `oklch(0.6 ${ac} ${ah})` : "var(--vp-c-text-3)";
  return {
    background: `conic-gradient(from 270deg, ${brandBg} 0deg 180deg, ${accentBg} 180deg 360deg)`,
  };
});
</script>

<template>
  <div class="atmosphere-dropdown">
    <button
      class="atmosphere-btn"
      popovertarget="atmosphere-popover"
      aria-label="Color controls"
      title="Colors"
    >
      <span class="atmosphere-indicator" :style="indicatorStyle" />
    </button>
    <div id="atmosphere-popover" popover class="atmosphere-popover">
      <!-- Brand panel -->
      <div class="panel" :class="{ expanded: expandedRow === 'brand' }">
        <div class="panel-header" @click="expandedRow = 'brand'">
          <span class="panel-arrow">{{
            expandedRow === "brand" ? "▼" : "▶"
          }}</span>
          <span class="panel-label">Brand</span>
          <span
            class="panel-dot"
            :style="{
              background:
                brand.chroma.value > 0
                  ? `oklch(0.6 ${brand.chroma.value} ${brand.hue.value})`
                  : 'var(--vp-c-text-3)',
            }"
          />
          <input
            class="color-input"
            :class="{ invalid: brandEdit.invalid }"
            :value="brandEdit.editing ? brandEdit.text : brandHex"
            @focus="
              brandEdit.editing = true;
              expandedRow = 'brand';
            "
            @blur="commitRow('brand')"
            @input="
              brandEdit.text = ($event.target as HTMLInputElement).value;
              tryParseRow('brand', ($event.target as HTMLInputElement).value);
            "
            @keydown.enter="($event.target as HTMLInputElement).blur()"
            spellcheck="false"
            @click.stop
          />
        </div>
        <div class="panel-body-wrap">
          <div class="panel-body">
            <div class="slider-row">
              <color-slider
                type="hue"
                aria-label="Brand hue"
                :value="String(brand.hue.value)"
                :hue="String(brand.hue.value)"
                :chroma="String(brand.chroma.value)"
                :landmarks="brandLandmarks"
                @input="onHueInput('brand', $event)"
                @landmark-click="onLandmarkClick('brand', $event)"
              />
              <span class="slider-value"
                >{{ Math.round(brand.hue.value) }}°</span
              >
            </div>
            <div class="slider-row">
              <color-slider
                type="chroma"
                aria-label="Brand chroma"
                :value="String(brand.chroma.value)"
                :hue="String(brand.hue.value)"
                :chroma="String(brand.chroma.value)"
                @input="onChromaInput('brand', $event)"
              />
              <span class="slider-value">{{
                brand.chroma.value.toFixed(2)
              }}</span>
            </div>
            <div class="panel-presets">
              <button
                class="preset-btn"
                :class="{ active: brand.chroma.value === 0 }"
                @click="applyNone('brand')"
              >
                <span
                  class="preset-dot"
                  style="background: var(--vp-c-text-3)"
                />
                <span class="preset-name">none</span>
              </button>
              <button
                v-for="[name, kc] in brandPresets"
                :key="name"
                class="preset-btn"
                :class="{ active: isPresetActive('brand', kc) }"
                @click="selectPreset('brand', kc)"
              >
                <span
                  class="preset-dot"
                  :style="{
                    background: `oklch(0.6 ${kc.chroma} ${kc.hue})`,
                  }"
                />
                <span class="preset-name">{{ name }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- Accent panel -->
      <div class="panel" :class="{ expanded: expandedRow === 'accent' }">
        <div class="panel-header" @click="expandedRow = 'accent'">
          <span class="panel-arrow">{{
            expandedRow === "accent" ? "▼" : "▶"
          }}</span>
          <span class="panel-label">Accent</span>
          <span
            class="panel-dot"
            :style="{
              background:
                accent.chroma.value > 0
                  ? `oklch(0.6 ${accent.chroma.value} ${accent.hue.value})`
                  : 'var(--vp-c-text-3)',
            }"
          />
          <input
            class="color-input"
            :class="{ invalid: accentEdit.invalid }"
            :value="accentEdit.editing ? accentEdit.text : accentHex"
            @focus="
              accentEdit.editing = true;
              expandedRow = 'accent';
            "
            @blur="commitRow('accent')"
            @input="
              accentEdit.text = ($event.target as HTMLInputElement).value;
              tryParseRow('accent', ($event.target as HTMLInputElement).value);
            "
            @keydown.enter="($event.target as HTMLInputElement).blur()"
            spellcheck="false"
            @click.stop
          />
        </div>
        <div class="panel-body-wrap">
          <div class="panel-body">
            <div class="slider-row">
              <color-slider
                type="hue"
                aria-label="Accent hue"
                :value="String(accent.hue.value)"
                :hue="String(accent.hue.value)"
                :chroma="String(accent.chroma.value)"
                :landmarks="accentLandmarks"
                @input="onHueInput('accent', $event)"
                @landmark-click="onLandmarkClick('accent', $event)"
              />
              <span class="slider-value"
                >{{ Math.round(accent.hue.value) }}°</span
              >
            </div>
            <div class="slider-row">
              <color-slider
                type="chroma"
                aria-label="Accent chroma"
                :value="String(accent.chroma.value)"
                :hue="String(accent.hue.value)"
                :chroma="String(accent.chroma.value)"
                @input="onChromaInput('accent', $event)"
              />
              <span class="slider-value">{{
                accent.chroma.value.toFixed(2)
              }}</span>
            </div>
            <div class="panel-presets">
              <button
                class="preset-btn"
                :class="{ active: accent.chroma.value === 0 }"
                @click="applyNone('accent')"
              >
                <span
                  class="preset-dot"
                  style="background: var(--vp-c-text-3)"
                />
                <span class="preset-name">none</span>
              </button>
              <button
                v-for="[name, kc] in accentPresets"
                :key="name"
                class="preset-btn"
                :class="{ active: isPresetActive('accent', kc) }"
                @click="selectPreset('accent', kc)"
              >
                <span
                  class="preset-dot"
                  :style="{
                    background: `oklch(0.6 ${kc.chroma} ${kc.hue})`,
                  }"
                />
                <span class="preset-name">{{ name }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- Dark toggle at bottom -->
      <div class="dark-toggle-row">
        <DarkToggle :model-value="isDark" @update:model-value="isDark = $event" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.atmosphere-dropdown {
  display: flex;
  align-items: center;
}

.atmosphere-btn {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 4px;
}

.atmosphere-indicator {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid var(--vp-c-divider);
}

.atmosphere-popover {
  margin: 0;
  position: fixed;
  inset: var(--vp-nav-height) 1rem auto auto;
  width: 480px;
  padding: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--vp-shadow-3);
  background: var(--vp-c-bg);
}

.panel + .panel {
  border-top: 1px solid var(--vp-c-divider);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.panel-arrow {
  font-size: 10px;
  color: var(--vp-c-text-3);
  width: 1em;
}

.panel-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.panel-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid var(--vp-c-divider);
}

.color-input {
  width: 7em;
  margin-left: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  outline: none;
}

.color-input:focus {
  border-color: var(--vp-c-brand-1);
}

.color-input.invalid {
  border-color: var(--vp-c-danger-1);
}

.panel-body-wrap {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.2s ease;
}

.panel.expanded .panel-body-wrap {
  grid-template-rows: 1fr;
}

.panel-body {
  overflow: hidden;
  padding: 0 1rem;
}

.panel.expanded .panel-body {
  padding: 0.25rem 1rem 0.5rem;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.slider-row color-slider {
  display: flex;
  flex: 1;
  min-width: 0;
}

.slider-value {
  font-size: 11px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-3);
  min-width: 3em;
  text-align: right;
}

.panel-presets {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.preset-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: none;
  cursor: pointer;
  font-size: 11px;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-base);
}

.preset-btn:hover {
  color: var(--vp-c-text-1);
}

.preset-btn.active {
  border-color: var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.preset-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.preset-name {
  text-transform: capitalize;
}

.dark-toggle-row {
  display: flex;
  justify-content: flex-end;
  padding: 0.375rem 1rem;
  border-top: 1px solid var(--vp-c-divider);
}
</style>
