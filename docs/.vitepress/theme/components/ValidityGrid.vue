<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useThemeBuilder } from "../composables/useThemeBuilder";
import { useDarkMode } from "../composables/useDarkMode";
import { useReactiveTheme } from "../composables/useReactiveTheme";
import DarkToggle from "./DarkToggle.vue";
import Token from "./Token.vue";

interface CellData {
  surface: string;
  token: string;
  type: "text" | "border";
  achieved: number;
  target: number;
  status: "met" | "close" | "unmet";
  className: string;
  surfaceClass: string;
}

interface SurfaceRow {
  slug: string;
  label: string;
  polarity: string;
  cells: CellData[];
}

const TEXT_TOKENS = [
  { key: "high", label: ".text-high", cls: "text-high" },
  { key: "strong", label: ".text-strong", cls: "text-strong" },
  { key: "subtle", label: ".text-subtle", cls: "text-subtle" },
  { key: "subtlest", label: ".text-subtlest", cls: "text-subtlest" },
] as const;

const BORDER_TOKENS = [
  { key: "decorative", label: ".border-decorative", cls: "border-decorative" },
  { key: "interactive", label: ".border-interactive", cls: "border-interactive" },
  { key: "critical", label: ".border-critical", cls: "border-critical" },
] as const;

const ALL_COLUMNS = [
  ...TEXT_TOKENS.map((t) => ({ ...t, type: "text" as const })),
  ...BORDER_TOKENS.map((t) => ({ ...t, type: "border" as const })),
];

const rootEl = ref<HTMLElement | null>(null);
const rows = ref<SurfaceRow[]>([]);
const css = ref("");
const ready = ref(false);
const { isDark } = useDarkMode();
const { theme, ready: themeReady } = useReactiveTheme();

const selectedSurface = ref<string | null>(null);
const selectedToken = ref<string | null>(null);
const selectedCell = ref<string | null>(null); // "slug:key"
const atmosphere = ref<"none" | "brand" | "accent">("none");

let solveFn: typeof import("@design-axioms/color").solve | null = null;
let generateCSSFn: typeof import("@design-axioms/color").generateCSS | null = null;
let contrastFn: typeof import("@design-axioms/color").contrastForPair | null = null;
let textGrades: typeof import("@design-axioms/color").TEXT_GRADES | null = null;
let defaultConfig: typeof import("@design-axioms/color").DEFAULT_CONFIG | null = null;

const mode = computed<"light" | "dark">(() => (isDark.value ? "dark" : "light"));

const hueClass = computed(() => {
  if (atmosphere.value === "brand") return "hue-brand";
  if (atmosphere.value === "accent") return "hue-accent";
  return "";
});

function cellStatus(achieved: number, target: number): "met" | "close" | "unmet" {
  if (achieved >= target) return "met";
  if (achieved >= target - 5) return "close";
  return "unmet";
}

function rebuildCSS() {
  if (!theme.value || !solveFn || !generateCSSFn || !contrastFn || !textGrades || !defaultConfig) return;
  const config = theme.value.getConfig();
  const output = solveFn(config);
  css.value = generateCSSFn(output, {
    ...config.options,
    selector: ".validity-grid-root",
    keyColors: config.anchors.keyColors,
  });

  const borderTargets = config.borderTargets ?? defaultConfig.borderTargets!;
  const m = mode.value;

  const modeOutput = m === "light" ? output.light : output.dark;
  const surfaceConfigs: { slug: string; label: string; polarity: string }[] = [];
  for (const group of config.groups) {
    for (const s of group.surfaces) {
      surfaceConfigs.push({ slug: s.slug, label: s.label, polarity: s.polarity });
    }
  }

  const result: SurfaceRow[] = [];
  for (const sc of surfaceConfigs) {
    const solved = modeOutput.surfaces.find((s) => s.slug === sc.slug);
    if (!solved) continue;

    const cells: CellData[] = [];
    const surfaceClass = `surface-${sc.slug}`;

    // Text cells
    for (const tok of TEXT_TOKENS) {
      const fgL = solved.textValues[tok.key];
      const achieved = Math.round(contrastFn(fgL, solved.lightness));
      const target = textGrades[tok.key];
      cells.push({
        surface: sc.slug,
        token: tok.key,
        type: "text",
        achieved,
        target,
        status: cellStatus(achieved, target),
        className: tok.cls,
        surfaceClass,
      });
    }

    // Border cells
    if (solved.borderValues) {
      for (const tok of BORDER_TOKENS) {
        const fgL = solved.borderValues[tok.key];
        const achieved = Math.round(contrastFn(fgL, solved.lightness));
        const target = borderTargets[tok.key];
        cells.push({
          surface: sc.slug,
          token: tok.key,
          type: "border",
          achieved,
          target,
          status: cellStatus(achieved, target),
          className: tok.cls,
          surfaceClass,
        });
      }
    }

    result.push({
      slug: sc.slug,
      label: sc.label,
      polarity: sc.polarity,
      cells,
    });
  }

  rows.value = result;
  ready.value = true;
}

useThemeBuilder(rootEl);

onMounted(async () => {
  const mod = await import("@design-axioms/color");
  solveFn = mod.solve;
  generateCSSFn = mod.generateCSS;
  contrastFn = mod.contrastForPair;
  textGrades = mod.TEXT_GRADES;
  defaultConfig = mod.DEFAULT_CONFIG;

  const t = await themeReady;
  rebuildCSS();
  t.subscribe(() => rebuildCSS());
});

// Re-compute when mode changes
import { watch } from "vue";
watch(mode, () => {
  if (ready.value) rebuildCSS();
});

function toggleSurface(slug: string) {
  selectedCell.value = null;
  selectedToken.value = null;
  selectedSurface.value = selectedSurface.value === slug ? null : slug;
}

function toggleToken(key: string) {
  selectedCell.value = null;
  selectedSurface.value = null;
  selectedToken.value = selectedToken.value === key ? null : key;
}

function toggleCell(slug: string, key: string) {
  selectedSurface.value = null;
  selectedToken.value = null;
  const id = `${slug}:${key}`;
  selectedCell.value = selectedCell.value === id ? null : id;
}

function isCellSelected(slug: string, key: string): boolean {
  return selectedCell.value === `${slug}:${key}`;
}

function isCellDimmed(slug: string, key: string): boolean {
  if (selectedSurface.value && selectedSurface.value !== slug) return true;
  if (selectedToken.value && selectedToken.value !== key) return true;
  if (selectedCell.value && selectedCell.value !== `${slug}:${key}`) return true;
  return false;
}
</script>

<template>
  <div v-if="ready" ref="rootEl" class="validity-grid-root" :class="hueClass" :style="{ colorScheme: isDark ? 'dark' : 'light' }">
    <component :is="'style'" v-text="css" />

    <!-- Toolbar -->
    <div class="grid-toolbar">
      <div class="atm-buttons">
        <button
          v-for="opt in (['none', 'brand', 'accent'] as const)"
          :key="opt"
          class="atm-btn"
          :class="{ active: atmosphere === opt }"
          @click="atmosphere = opt"
        >
          {{ opt === 'none' ? 'None' : opt.charAt(0).toUpperCase() + opt.slice(1) }}
        </button>
      </div>
      <DarkToggle v-model="isDark" />
    </div>

    <!-- Grid -->
    <div class="grid-scroll">
      <table class="grid-table">
        <thead>
          <tr>
            <th class="corner-cell"></th>
            <th class="section-header" :colspan="TEXT_TOKENS.length">Text</th>
            <th class="section-header" :colspan="BORDER_TOKENS.length">Borders</th>
          </tr>
          <tr>
            <th class="corner-cell">Surface</th>
            <th
              v-for="col in ALL_COLUMNS"
              :key="col.key"
              class="col-header"
              :class="{ selected: selectedToken === col.key }"
              @click="toggleToken(col.key)"
            >
              <Token :name="col.label" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.slug">
            <td
              class="row-label"
              :class="{ selected: selectedSurface === row.slug }"
              @click="toggleSurface(row.slug)"
            >
              <span class="row-name">{{ row.label }}</span>
              <span class="row-polarity">{{ row.polarity }}</span>
            </td>
            <td
              v-for="cell in row.cells"
              :key="cell.token"
              class="grid-cell"
              :class="{
                dimmed: isCellDimmed(row.slug, cell.token),
                focused: isCellSelected(row.slug, cell.token),
                [cell.status]: true,
              }"
              @click="toggleCell(row.slug, cell.token)"
            >
              <div class="cell-swatch" :class="[cell.surfaceClass, atmosphere === 'accent' && row.slug === 'action' ? 'hue-accent' : '']">
                <template v-if="cell.type === 'text'">
                  <span :class="cell.className" class="cell-text">Aa</span>
                </template>
                <template v-else>
                  <span class="cell-border-sample" :class="cell.className"></span>
                </template>
              </div>
              <span class="cell-apca" :class="cell.status">
                {{ cell.achieved }}
              </span>
              <!-- Expanded info when cell selected -->
              <div v-if="isCellSelected(row.slug, cell.token)" class="cell-detail">
                <code>class="{{ cell.surfaceClass }} {{ cell.className }}"</code>
                <span class="cell-target">target: {{ cell.target }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.validity-grid-root {
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  font-family: var(--vp-font-family-base);
}

.grid-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.atm-buttons {
  display: flex;
  gap: 0.25rem;
}

.atm-btn {
  padding: 0.2rem 0.6rem;
  border-radius: 5px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 0.75rem;
  font-family: var(--vp-font-family-base);
}

.atm-btn.active {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  border-color: var(--vp-c-brand-1);
}

.atm-btn:hover:not(.active) {
  background: var(--vp-c-bg-soft);
}

.grid-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.grid-table {
  width: 100%;
  min-width: 700px;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.grid-table th,
.grid-table td {
  border: 1px solid var(--vp-c-divider);
  text-align: center;
  vertical-align: middle;
}

.corner-cell {
  background: var(--vp-c-bg-soft);
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  padding: 0.35rem 0.5rem;
  min-width: 80px;
}

.section-header {
  background: var(--vp-c-bg-soft);
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-2);
  padding: 0.25rem 0.5rem;
}

.col-header {
  background: var(--vp-c-bg-soft);
  padding: 0.35rem 0.25rem;
  cursor: pointer;
  transition: background 0.15s;
}

.col-header:hover {
  background: var(--vp-c-bg-alt);
}

.col-header.selected {
  background: var(--vp-c-brand-soft);
}

.row-label {
  background: var(--vp-c-bg-soft);
  padding: 0.35rem 0.5rem;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.row-label:hover {
  background: var(--vp-c-bg-alt);
}

.row-label.selected {
  background: var(--vp-c-brand-soft);
}

.row-name {
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--vp-c-text-1);
  display: block;
}

.row-polarity {
  font-size: 0.6rem;
  color: var(--vp-c-text-3);
}

.grid-cell {
  padding: 0.25rem;
  cursor: pointer;
  transition: opacity 0.15s;
  position: relative;
  min-width: 60px;
}

.grid-cell.dimmed {
  opacity: 0.3;
}

.grid-cell.focused {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: -2px;
  z-index: 1;
}

.cell-swatch {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  border-radius: 4px;
  overflow: hidden;
}

.cell-text {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1;
}

.cell-border-sample {
  width: 32px;
  height: 0;
  border-bottom-width: 3px;
  border-bottom-style: solid;
}

.cell-apca {
  display: block;
  font-size: 0.65rem;
  font-family: var(--vp-font-family-mono);
  margin-top: 2px;
  line-height: 1;
}

.cell-apca.met {
  color: var(--vp-c-green-2);
}

.cell-apca.close {
  color: var(--vp-c-yellow-2);
}

.cell-apca.unmet {
  color: var(--vp-c-red-2);
}

.cell-detail {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: -2.2rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 0.15rem 0.4rem;
  font-size: 0.6rem;
  white-space: nowrap;
  z-index: 10;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.cell-detail code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.6rem;
  color: var(--vp-c-text-1);
}

.cell-target {
  color: var(--vp-c-text-3);
}
</style>
