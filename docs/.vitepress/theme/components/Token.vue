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

  // The pill IS a surface + token composite. Its visual is literally
  // what the named token looks like when applied: a text token is
  // rendered as card-surface text in that grade; a surface token is
  // rendered as that surface; a hue token is a card tinted by that
  // hue. No VitePress chrome, no pinned color-scheme — the pill
  // shows the real composite in the current mode.
  const hostStyles = `
    :host {
      display: inline-flex;
      vertical-align: middle;
      line-height: 1.4;
    }
    .pill {
      display: inline-flex;
      align-items: baseline;
      gap: 0.3rem;
      padding: 0.1rem 0.5rem;
      border-radius: 10rem;
      line-height: 1.4;
      white-space: nowrap;
      /* surface-* class (from theme sheet) paints background,
         text-tier variables, and distinction shadow. */
    }
    .pill .glyph {
      font-family: var(--vp-font-family-base);
      font-weight: 800;
      font-size: 0.95em;
      line-height: 1;
      align-self: center;
    }
    .pill code {
      font-family: var(--vp-font-family-mono);
      font-size: 0.78em;
      font-weight: 500;
      color: var(--axm-text-subtle);
    }
    .pill .dot {
      width: 0.5em; height: 0.5em; border-radius: 50%;
      align-self: center; flex-shrink: 0;
    }
    /* Border swatch: a small outlined square that WEARS the
       .border-* utility. Parallels the text glyph — the demo is
       a distinct element inside the pill, not the pill itself. */
    .pill .swatch {
      width: 0.75em; height: 0.75em;
      border-width: 1.5px; border-style: solid;
      border-radius: 2px;
      align-self: center; flex-shrink: 0;
    }
  `;

  // Category-specific styles go on the demo element (glyph / swatch /
  // dot), not the pill. The pill is always just a card.
  let extra = "";
  if (wild) {
    const color = WILDCARD_COLORS[cat] ?? "#929295";
    extra = `.pill .dot { background: ${color}; }`;
  }
  // text/surface/hue/border: demo element handles its own appearance.

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

/**
 * Every pill follows one shape: a real surface (the pill) + a demo
 * element inside it that wears the token, + the code label. What you
 * see is literally the composite the token produces.
 *
 * - text:    .pill.surface-card   > <span.glyph.text-X>A</span>
 * - border:  .pill.surface-card   > <span.swatch.border-X></span>
 * - hue:     .pill.surface-card.hue-X  (the tint IS the demo)
 * - surface: .pill.surface-X            (the surface IS the demo)
 * - wildcard: .pill.surface-card  > <span.dot></span>
 */
function buildMarkup(): string {
  const cat = category.value;
  if (isWildcard.value) {
    return `<span class="pill surface-card"><span class="dot"></span><code>${props.name}</code></span>`;
  }
  if (cat === "text") {
    const cls = textClass.value ?? "";
    return `<span class="pill surface-card"><span class="glyph ${cls}">A</span><code>${props.name}</code></span>`;
  } else if (cat === "border") {
    const cls = bareClass.value ?? "";
    return `<span class="pill surface-card"><span class="swatch ${cls}"></span><code>${props.name}</code></span>`;
  } else if (cat === "surface") {
    const cls = bareClass.value ?? "";
    return `<span class="pill ${cls}"><code>${props.name}</code></span>`;
  } else if (cat === "hue") {
    const cls = bareClass.value ?? "";
    return `<span class="pill surface-card ${cls}"><code>${props.name}</code></span>`;
  }
  return "";
}

watch([shadow, () => theme.value, () => props.name], () => {
  if (shadow.value && theme.value) shadow.value.innerHTML = buildMarkup();
});
</script>

<template>
  <!-- The pill is generic chrome. The system-surface context lives
       inside the shadow root via a `display: contents` wrapper, so
       no surface decoration leaks onto the host. -->
  <span v-if="category === 'text'" ref="shadowHost" class="token-badge token-text" />

  <span v-else-if="category === 'surface'" ref="shadowHost" class="token-badge token-surface" />

  <span v-else-if="category === 'border'" ref="shadowHost" class="token-badge token-border" />

  <span v-else-if="category === 'hue'" ref="shadowHost" class="token-badge token-hue" />

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
