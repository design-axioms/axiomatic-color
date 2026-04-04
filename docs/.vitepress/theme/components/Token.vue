<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";

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

// Surface: lightness value for the swatch
const surfaceLightness = computed(() => {
  const map: Record<string, number> = {
    ".surface-page": 0.975,
    ".surface-workspace": 0.957,
    ".surface-card": 0.902,
    ".surface-action": 0.902,
    ".surface-spotlight": 0.1,
    ".surface-*": 0.5,
  };
  return map[props.name] ?? 0.5;
});

// Text: extract class name without the dot
const textClass = computed(() => {
  if (category.value !== "text") return null;
  const cls = props.name.startsWith(".") ? props.name.slice(1) : props.name;
  return cls.endsWith("*") ? null : cls;
});

// Border: stroke weight/opacity by tier
const borderWeight = computed(() => {
  const map: Record<string, number> = {
    ".border-decorative": 0.8,
    ".border-interactive": 1.4,
    ".border-critical": 2.2,
    ".border-*": 1.4,
  };
  return map[props.name] ?? 1.4;
});

const borderOpacity = computed(() => {
  const map: Record<string, number> = {
    ".border-decorative": 0.3,
    ".border-interactive": 0.6,
    ".border-critical": 1.0,
    ".border-*": 0.6,
  };
  return map[props.name] ?? 0.6;
});

// Hue: actual CSS color
const hueColor = computed(() => {
  const map: Record<string, string> = {
    ".hue-brand": "#6e56cf",
    ".hue-success": "#22c55e",
    ".hue-warning": "#eab308",
    ".hue-error": "#ef4444",
  };
  return map[props.name] ?? null;
});

// Shadow DOM for text tokens
const shadowHost = ref<HTMLElement | null>(null);
const systemCss = ref("");

onMounted(async () => {
  if (category.value !== "text") return;

  const { solve, DEFAULT_CONFIG, generateCSS } =
    await import("@design-axioms/color");

  const output = solve(DEFAULT_CONFIG);
  systemCss.value = generateCSS(output, {
    ...DEFAULT_CONFIG.options,
    selector: ":host",
  });

  buildShadow();
});

watch([systemCss, () => props.name], () => {
  if (category.value === "text" && systemCss.value) buildShadow();
});

function buildShadow() {
  const host = shadowHost.value;
  if (!host || !systemCss.value) return;

  let shadow = host.shadowRoot;
  if (!shadow) {
    shadow = host.attachShadow({ mode: "open" });
  }

  const cls = textClass.value ?? "";
  shadow.innerHTML = `
    <style>
      ${systemCss.value}
      :host {
        display: inline-flex;
        align-items: baseline;
        gap: 0.25rem;
        padding: 0.1rem 0.45rem 0.1rem 0.3rem;
        border-radius: 10rem;
        vertical-align: baseline;
        line-height: 1.4;
        white-space: nowrap;
      }
      .glyph {
        font-weight: 700;
        font-size: 0.7em;
        line-height: 1;
        align-self: center;
      }
      code {
        font-family: ui-monospace, "Menlo", "Monaco", "Consolas", monospace;
        font-size: 0.78em;
        font-weight: 500;
      }
    </style>
    <span class="glyph ${cls}">A</span>
    <code class="text-subtle">${props.name}</code>
  `;
}
</script>

<template>
  <!-- Text tokens: shadow DOM host, styled as a surface-card -->
  <span v-if="category === 'text'" ref="shadowHost"
    class="token-badge token-text surface-card" />

  <!-- All other tokens: regular light DOM -->
  <span v-else class="token-badge" :class="`token-${category}`">
    <svg class="token-icon" viewBox="0 0 12 12" fill="none">
      <template v-if="category === 'surface'">
        <rect x="1" y="1" width="10" height="10" rx="2"
          :fill="`oklch(${surfaceLightness} 0 0)`"
          stroke="#888" stroke-width="0.5" />
      </template>

      <template v-else-if="category === 'hue'">
        <template v-if="hueColor">
          <circle cx="6" cy="6" r="5" :fill="hueColor" />
        </template>
        <template v-else>
          <defs>
            <linearGradient id="hue-rainbow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#ef4444" />
              <stop offset="33%" stop-color="#eab308" />
              <stop offset="66%" stop-color="#22c55e" />
              <stop offset="100%" stop-color="#6e56cf" />
            </linearGradient>
          </defs>
          <circle cx="6" cy="6" r="5" fill="url(#hue-rainbow)" />
        </template>
      </template>

      <template v-else-if="category === 'border'">
        <rect x="1" y="1" width="10" height="10" rx="2" fill="#f0f0f3" />
        <rect x="1" y="1" width="10" height="10" rx="2"
          stroke="#555" :stroke-width="borderWeight" fill="none"
          :opacity="borderOpacity" />
      </template>

      <template v-else>
        <circle cx="6" cy="6" r="4" fill="currentColor" opacity="0.3" />
      </template>
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
  vertical-align: baseline;
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

/* Non-text category colors */
.token-surface {
  background: rgba(142, 150, 170, 0.12);
}
.token-surface .token-name {
  color: var(--vp-c-text-2);
}

.token-hue {
  background: rgba(159, 122, 234, 0.10);
}
.token-hue .token-name {
  color: var(--vp-c-purple-1);
}

.token-border {
  background: rgba(234, 179, 8, 0.10);
}
.token-border .token-name {
  color: var(--vp-c-yellow-1);
}

.token-generic {
  background: var(--vp-c-default-soft);
}
.token-generic .token-name {
  color: var(--vp-c-text-2);
}
</style>
