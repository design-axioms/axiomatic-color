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

  // The pill is a citation in prose — VitePress chrome, not a system
  // surface. The actual demonstration of the named token lives inside,
  // in a `.context` wrapper whose only job is to provide the system's
  // CSS variables to its child via a `.surface-*` (and optionally
  // `.hue-*`) class. The wrapper is `display: contents` so it has no
  // box and inherits no decoration; the inner swatch/glyph reads the
  // variables but never carries a surface class itself, so nothing
  // surface-derived (background, border, distinction shadow) leaks
  // onto the pill.
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
      /* Border uses the system's decorative tier (oklch L=0.5), not
         VitePress's much-fainter divider. The pill is documenting the
         system; using a system-derived color is correct. We pin the
         literal value rather than reading --axm-border-decorative
         because that variable's resolution depends on the ancestor's
         surface context — which the pill explicitly opts out of. The
         decorative tier is achromatic and mode-invariant by design,
         so a single L=0.5 oklch works for both light and dark. */
      border: 1px solid oklch(0.5 0 0);
      background: var(--vp-c-bg-alt, #f6f6f7);
      color-scheme: inherit;
    }
    .context {
      display: contents;
    }
    code {
      font-family: var(--vp-font-family-mono);
      font-size: 0.78em;
      font-weight: 500;
      /* Pill text is chrome, not a system text grade. Pin it to
         VitePress's secondary text color so it reads consistently
         regardless of the surrounding surface context (e.g. a token
         cited inside a .surface-spotlight block must not inherit the
         inverted text color). */
      color: var(--vp-c-text-2);
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
      background: var(--axm-surface);
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
      background: var(--axm-surface);
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

/**
 * Build the pill's inner markup. The pill itself is generic chrome;
 * the demonstrative element (swatch / glyph) lives inside a `.context`
 * wrapper that carries the surface/hue class purely to provide CSS
 * variables. The wrapper is `display: contents` so it adds no box and
 * inherits no surface decoration onto the pill.
 *
 * - text: `.context.surface-workspace` so .text-* utilities resolve
 *   to a real card-context value.
 * - surface: `.context.surface-{slug}` so the swatch reads the named
 *   surface's --axm-surface and border tokens.
 * - border: `.context.surface-card` so the named .border-* token has
 *   a sensible context to source from.
 * - hue: `.context.surface-card.hue-{name}` so the swatch shows the
 *   tinted surface for that hue.
 */
function buildMarkup(): string {
  const cat = category.value;
  // Wildcards: category-colored dot instead of a concrete swatch
  if (isWildcard.value) {
    return `<span class="dot"></span><code>${props.name}</code>`;
  }
  if (cat === "text") {
    const cls = textClass.value ?? "";
    return `<span class="context surface-workspace"><span class="glyph ${cls}">A</span></span><code>${props.name}</code>`;
  } else if (cat === "surface") {
    const surfCls = bareClass.value ?? "";
    return `<span class="context ${surfCls}"><span class="swatch"></span></span><code>${props.name}</code>`;
  } else if (cat === "border") {
    const borderCls = bareClass.value ?? "";
    return `<span class="context surface-card"><span class="swatch ${borderCls}"></span></span><code>${props.name}</code>`;
  } else if (cat === "hue") {
    const hueCls = bareClass.value ?? "";
    return `<span class="context surface-card ${hueCls}"><span class="swatch"></span></span><code>${props.name}</code>`;
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
