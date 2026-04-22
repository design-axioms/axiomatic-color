<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useShadowRoot } from "../composables/useShadowRoot";
import { useReactiveTheme } from "../composables/useReactiveTheme";

const props = defineProps<{
  name: string;
}>();

const category = computed(() => {
  const n = props.name;
  if (n.startsWith(".surface-") || n === ".surface-*") return "surface";
  if (n.startsWith(".text-") || n === ".text-*") return "text";
  if (n.startsWith(".hue-") || n === ".hue-*") return "hue";
  if (n.startsWith(".border-") || n === ".border-*") return "border";
  return "generic";
});

const textClass = computed(() => {
  if (category.value !== "text") return null;
  const cls = props.name.startsWith(".") ? props.name.slice(1) : props.name;
  return cls.endsWith("*") ? null : cls;
});

const usesShadow = computed(() => ["text", "surface", "border", "hue"].includes(category.value));

const bareClass = computed(() => {
  if (!props.name.startsWith(".")) return null;
  const cls = props.name.slice(1);
  return cls.endsWith("*") ? null : cls;
});

// Shared stylesheets
const shadowHost = ref<HTMLElement | null>(null);
const { theme } = useReactiveTheme();

const localSheetCache = new Map<string, CSSStyleSheet>();

const WILDCARD_COLORS: Record<string, string> = {
  surface: "#6e56cf",
  text: "#299764",
  hue: "#946300",
  border: "#6f42c1",
};

function getLocalSheet(cat: string, wild: boolean): CSSStyleSheet {
  const key = wild ? `${cat}:wild` : cat;
  let sheet = localSheetCache.get(key);
  if (sheet) return sheet;

  const hostStyles = `
    :host {
      display: inline-flex;
      align-items: baseline;
      gap: 0.25rem;
      padding: 0.1rem 0.45rem 0.1rem 0.3rem;
      border-radius: 10rem;
      vertical-align: middle;
      line-height: 1.4;
      white-space: nowrap;
      border: 1px solid var(--axm-border-decorative, var(--vp-c-divider, #e2e2e3));
      background: var(--axm-surface, var(--vp-c-bg-alt, #f6f6f7));
      color-scheme: inherit;
    }
    code {
      font-family: var(--vp-font-family-mono);
      font-size: 0.78em;
      font-weight: 500;
    }
  `;

  let extra = "";
  if (wild) {
    const color = WILDCARD_COLORS[cat] ?? "#929295";
    extra = `.dot {
      width: 0.5em; height: 0.5em; border-radius: 50%;
      background: ${color};
      align-self: center; flex-shrink: 0;
    }`;
  } else if (cat === "text") {
    extra = `.glyph { font-weight: 700; font-size: 0.7em; line-height: 1; align-self: center; }`;
  } else if (cat === "surface") {
    extra = `.swatch {
      width: 0.75em; height: 0.75em; border-radius: 3px;
      align-self: center; flex-shrink: 0;
      border: 1px solid var(--axm-border-decorative);
    }`;
  } else if (cat === "border") {
    extra = `.swatch {
      width: 0.75em; height: 0.75em; border-radius: 2px;
      align-self: center; flex-shrink: 0;
      border-width: 1.5px; border-style: solid;
    }`;
  } else if (cat === "hue") {
    extra = `.swatch {
      width: 0.75em; height: 0.75em; border-radius: 50%;
      align-self: center; flex-shrink: 0;
      border: 1px solid var(--axm-border-decorative);
    }`;
  }

  sheet = new CSSStyleSheet();
  sheet.replaceSync(hostStyles + extra);
  localSheetCache.set(key, sheet);
  return sheet;
}

const isWildcard = computed(() => props.name.endsWith("*"));

const sheets = computed(() =>
  theme.value ? [theme.value.sheet, getLocalSheet(category.value, isWildcard.value)] : [],
);

const shadow = useShadowRoot(shadowHost, sheets);

function buildMarkup(): string {
  const cat = category.value;
  // Wildcards: category-colored dot instead of a concrete swatch
  if (isWildcard.value) {
    return `<span class="dot"></span><code class="text-subtle">${props.name}</code>`;
  }
  if (cat === "text") {
    const cls = textClass.value ?? "";
    return `<span class="glyph ${cls}">A</span><code class="text-subtle">${props.name}</code>`;
  } else if (cat === "surface") {
    const surfCls = bareClass.value ?? "";
    return `<span class="swatch ${surfCls}"></span><code class="text-subtle">${props.name}</code>`;
  } else if (cat === "border") {
    const borderCls = bareClass.value ?? "";
    return `<span class="swatch ${borderCls}"></span><code class="text-subtle">${props.name}</code>`;
  } else if (cat === "hue") {
    const hueCls = bareClass.value ?? "";
    return `<span class="swatch surface-card ${hueCls}"></span><code class="text-subtle">${props.name}</code>`;
  }
  return "";
}

watch([shadow, () => theme.value, () => props.name], () => {
  if (shadow.value && theme.value) shadow.value.innerHTML = buildMarkup();
});
</script>

<template>
  <!-- Text tokens: shadow DOM host on a card surface -->
  <span
    v-if="category === 'text'"
    ref="shadowHost"
    class="token-badge token-text surface-workspace"
  />

  <!-- Surface tokens: shadow DOM host on a card surface (swatch shows the named surface) -->
  <span
    v-else-if="category === 'surface'"
    ref="shadowHost"
    class="token-badge token-surface surface-workspace"
  />

  <!-- Border tokens: shadow DOM host on a card surface (swatch shows the border tier) -->
  <span
    v-else-if="category === 'border'"
    ref="shadowHost"
    class="token-badge token-border surface-workspace"
  />

  <!-- Hue tokens: shadow DOM host on a card surface -->
  <span
    v-else-if="category === 'hue'"
    ref="shadowHost"
    class="token-badge token-hue surface-workspace"
  />

  <!-- Generic: light DOM -->
  <span v-else class="token-badge token-generic">
    <svg class="token-icon" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="4" fill="currentColor" opacity="0.3" />
    </svg>
    <code class="token-name">{{ name }}</code>
  </span>
</template>

<style scoped>
.token-badge {
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
  padding: 0.1rem 0.45rem 0.1rem 0.3rem;
  border-radius: 10rem;
  vertical-align: middle;
  line-height: 1.4;
  white-space: nowrap;
}

.token-icon {
  width: 0.75em;
  height: 0.75em;
  flex-shrink: 0;
  align-self: center;
}

.token-name {
  font-family: var(--vp-font-family-mono);
  font-size: 0.78em;
  font-weight: 500;
  background: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
}

.token-generic {
  background: var(--vp-c-default-soft);
}
.token-generic .token-name {
  color: var(--vp-c-text-2);
}
</style>
