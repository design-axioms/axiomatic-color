<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useBrandColor, useAccentColor } from "../composables/useKeyColor";
import { useDarkMode } from "../composables/useDarkMode";
import { useReactiveTheme } from "../composables/useReactiveTheme";
import { useKeyColors } from "../composables/useKeyColors";
import PreviewControls from "./PreviewControls.vue";

const brand = useBrandColor();
const accent = useAccentColor();
const { isDark } = useDarkMode();
const { theme } = useReactiveTheme();
const keyColors = useKeyColors();
const activeRow = ref<"brand" | "accent">("brand");

// Async-loaded core functions
const formatFn = ref<((l: number, c: number, h: number) => string) | null>(
  null,
);
const parseFn = ref<
  ((color: string) => { hue: number; chroma: number } | null) | null
>(null);

onMounted(async () => {
  const { formatOklchHex, parseKeyColor } =
    await import("@design-axioms/color");
  formatFn.value = formatOklchHex;
  parseFn.value = parseKeyColor;
});

// Active row computed proxies for PreviewControls v-model
const activeHue = computed({
  get: () =>
    activeRow.value === "brand" ? brand.hue.value : accent.hue.value,
  set: (v) => {
    if (activeRow.value === "brand") {
      brand.hue.value = v;
    } else {
      accent.hue.value = v;
    }
  },
});

const activeChroma = computed({
  get: () =>
    activeRow.value === "brand" ? brand.chroma.value : accent.chroma.value,
  set: (v) => {
    if (activeRow.value === "brand") {
      brand.chroma.value = v;
    } else {
      accent.chroma.value = v;
    }
  },
});

// Per-row display hex
const brandDisplayHex = computed(() =>
  formatFn.value?.(0.6, brand.chroma.value, brand.hue.value) ?? "#000000",
);
const accentDisplayHex = computed(() =>
  formatFn.value?.(0.6, accent.chroma.value, accent.hue.value) ?? "#000000",
);

// Per-row editing state
const brandEdit = reactive({ editing: false, text: "", invalid: false });
const accentEdit = reactive({ editing: false, text: "", invalid: false });

// Sync edit text when not editing
watch(brandDisplayHex, (hex) => {
  if (!brandEdit.editing) brandEdit.text = hex;
});
watch(accentDisplayHex, (hex) => {
  if (!accentEdit.editing) accentEdit.text = hex;
});

function applyColor(hex: string) {
  theme.value?.setKeyColor(activeRow.value, hex);
}

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
  const hex = row === "brand" ? brandDisplayHex.value : accentDisplayHex.value;
  edit.editing = false;
  edit.invalid = false;
  edit.text = hex;
}

function isActivePreset(name: string): boolean {
  const kc = keyColors.value[name];
  if (!kc) return false;
  const h = activeHue.value;
  const c = activeChroma.value;
  return Math.abs(h - kc.hue) < 0.5 && Math.abs(c - kc.chroma) < 0.005;
}

function selectPreset(name: string, kc: { hue: number; chroma: number }) {
  if (!formatFn.value) return;
  const hex = formatFn.value(0.6, kc.chroma, kc.hue);
  theme.value?.setKeyColor(activeRow.value, hex);
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
      aria-label="Atmosphere controls"
      title="Atmosphere"
    >
      <span class="atmosphere-indicator" :style="indicatorStyle" />
    </button>
    <div id="atmosphere-popover" popover class="atmosphere-popover">
      <!-- Brand row -->
      <div
        class="color-row"
        :class="{ active: activeRow === 'brand' }"
        @click="activeRow = 'brand'"
      >
        <span class="row-label">Brand</span>
        <span class="row-dot" :style="{ background: brandDisplayHex }" />
        <input
          class="color-input"
          :class="{ invalid: brandEdit.invalid }"
          :value="brandEdit.editing ? brandEdit.text : brandDisplayHex"
          @focus="
            brandEdit.editing = true;
            activeRow = 'brand';
          "
          @blur="commitRow('brand')"
          @input="
            brandEdit.text = ($event.target as HTMLInputElement).value;
            tryParseRow('brand', ($event.target as HTMLInputElement).value);
          "
          @keydown.enter="($event.target as HTMLInputElement).blur()"
          spellcheck="false"
        />
      </div>
      <!-- Accent row -->
      <div
        class="color-row"
        :class="{ active: activeRow === 'accent' }"
        @click="activeRow = 'accent'"
      >
        <span class="row-label">Accent</span>
        <span class="row-dot" :style="{ background: accentDisplayHex }" />
        <input
          class="color-input"
          :class="{ invalid: accentEdit.invalid }"
          :value="accentEdit.editing ? accentEdit.text : accentDisplayHex"
          @focus="
            accentEdit.editing = true;
            activeRow = 'accent';
          "
          @blur="commitRow('accent')"
          @input="
            accentEdit.text = ($event.target as HTMLInputElement).value;
            tryParseRow('accent', ($event.target as HTMLInputElement).value);
          "
          @keydown.enter="($event.target as HTMLInputElement).blur()"
          spellcheck="false"
        />
      </div>
      <!-- Shared presets -->
      <div class="preset-row">
        <button
          class="preset-btn"
          :class="{ active: activeChroma === 0 }"
          :style="{ '--preset-color': 'var(--vp-c-text-3)' }"
          @click="applyColor('#808080')"
        >
          <span class="preset-dot" />
          <span class="preset-name">none</span>
        </button>
        <button
          v-for="(kc, name) in keyColors"
          :key="name"
          class="preset-btn"
          :class="{ active: isActivePreset(String(name)) }"
          :style="{ '--preset-color': `oklch(0.6 ${kc.chroma} ${kc.hue})` }"
          @click="selectPreset(String(name), kc)"
        >
          <span class="preset-dot" />
          <span class="preset-name">{{ name }}</span>
        </button>
      </div>
      <!-- Sliders for active row -->
      <PreviewControls
        v-model:hue="activeHue"
        v-model:chroma="activeChroma"
        v-model:is-dark="isDark"
        :key-colors="keyColors"
      />
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

.atmosphere-popover :deep(.preview-controls) {
  border-bottom: none;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 1rem;
  cursor: pointer;
  border-left: 2px solid transparent;
}

.color-row.active {
  border-left-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
}

.row-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-2);
  width: 3.5em;
}

.row-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid var(--vp-c-divider);
}

.color-input {
  width: 7em;
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

.preset-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 1rem;
  border-top: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
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
  background: var(--preset-color);
}

.preset-name {
  text-transform: capitalize;
}
</style>
