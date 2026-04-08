<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ShadowSurface from "./ShadowSurface.vue";

const props = defineProps<{
  /** HTML to render inside the shadow DOM specimen */
  html: string;
  /** Clean HTML to show in the code panel (defaults to html) */
  code?: string;
  /** Surface class for the specimen root */
  surface?: string;
  /** Extra CSS for the shadow surface */
  extraCss?: string;
}>();

const displayCode = computed(() => props.code ?? props.html);
const codeOpen = ref(false);
const codeEl = ref<HTMLElement | null>(null);
const highlightedHtml = ref<string | null>(null);

// Shiki transformer: wrap system class names in string tokens with pill elements.
// Works at the HAST level so it composes with other Shiki transformers.
const TOKEN_RE = /\b(surface|text|hue|border)-([\w-]+)/g;
const TOKEN_TEST_RE = /".*\b(?:surface|text|hue|border)-/;

function classifyToken(name: string): string {
  if (name.startsWith("surface-")) return "surface";
  if (name.startsWith("text-")) return "text";
  if (name.startsWith("hue-")) return "hue";
  return "border";
}

const tokenPillTransformer = {
  span(node: any) {
    const child = node.children?.[0];
    if (!child || child.type !== "text") return;
    if (!TOKEN_TEST_RE.test(child.value)) return;

    const parts = child.value.split(/(\b(?:surface|text|hue|border)-[\w-]+)/g);
    node.children = parts.map((part: string) => {
      if (TOKEN_RE.test(part)) {
        TOKEN_RE.lastIndex = 0;
        return {
          type: "element",
          tagName: "span",
          properties: { class: `token-pill token-${classifyToken(part)}` },
          children: [{ type: "text", value: part }],
        };
      }
      return { type: "text", value: part };
    });
  },
};

// Lazy-load Shiki and highlight on first open or code change
let highlighterPromise: ReturnType<
  (typeof import("shiki"))["createHighlighter"]
> | null = null;

async function ensureHighlighted() {
  if (!highlighterPromise) {
    const { createHighlighter } = await import("shiki");
    highlighterPromise = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: ["html"],
    });
  }
  const highlighter = await highlighterPromise;
  highlightedHtml.value = highlighter.codeToHtml(displayCode.value, {
    lang: "html",
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
    transformers: [tokenPillTransformer],
  });
}

watch(codeOpen, (open) => {
  if (open && highlightedHtml.value === null) ensureHighlighted();
});

watch(displayCode, () => {
  if (highlightedHtml.value !== null) ensureHighlighted();
});
</script>

<template>
  <div class="live-example">
    <ShadowSurface
      :html="html"
      :surface="surface ?? 'surface-page'"
      :extra-css="extraCss"
      class="live-example-specimen"
    />
    <button
      class="live-example-toggle"
      :aria-expanded="codeOpen"
      @click="codeOpen = !codeOpen"
    >
      <svg
        class="live-example-chevron"
        :class="{ open: codeOpen }"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M6 4l4 4-4 4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span>{{ codeOpen ? "Hide code" : "Show code" }}</span>
    </button>
    <div ref="codeEl" class="live-example-code" :class="{ open: codeOpen }">
      <div class="live-example-code-inner">
        <div
          v-if="highlightedHtml"
          class="shiki-wrapper"
          v-html="highlightedHtml"
        />
        <pre v-else><code>{{ displayCode }}</code></pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.live-example {
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
}

.live-example :deep(.shadow-surface-host) {
  border: none;
  border-radius: 0;
}

.live-example-toggle {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  width: 100%;
  padding: 0.4rem 0.75rem;
  border: none;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-code-block-bg);
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-base);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s;
}

.live-example-toggle:hover {
  color: var(--vp-c-text-2);
}

.live-example-chevron {
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.live-example-chevron.open {
  transform: rotate(90deg);
}

.live-example-code {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.2s ease;
  background: var(--vp-code-block-bg);
}

.live-example-code.open {
  grid-template-rows: 1fr;
}

.live-example-code-inner {
  overflow: hidden;
}

.live-example-code.open .live-example-code-inner {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--vp-c-divider);
}

.live-example-code-inner pre {
  margin: 0;
  padding: 0;
  background: none;
}

.live-example-code-inner code {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-code-block-color);
  white-space: pre;
}

/* Shiki dual-theme: light uses --shiki-light, dark uses --shiki-dark */
.shiki-wrapper :deep(.shiki) {
  margin: 0;
  padding: 0;
  background: none !important;
}

.shiki-wrapper :deep(.shiki code) {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre;
}

.shiki-wrapper :deep(.shiki span) {
  color: var(--shiki-light);
}

html.dark .shiki-wrapper :deep(.shiki span) {
  color: var(--shiki-dark);
}

/* Token pills inside highlighted code */
.shiki-wrapper :deep(.token-pill) {
  padding: 0.05em 0.35em;
  border-radius: 4px;
  font-size: 0.92em;
}

.shiki-wrapper :deep(.token-surface) {
  background: rgba(110, 86, 207, 0.1);
  color: #6e56cf;
}

.shiki-wrapper :deep(.token-text) {
  background: rgba(34, 134, 58, 0.1);
  color: #22863a;
}

.shiki-wrapper :deep(.token-hue) {
  background: rgba(227, 98, 9, 0.1);
  color: #e36209;
}

.shiki-wrapper :deep(.token-border) {
  background: rgba(111, 66, 193, 0.1);
  color: #6f42c1;
}

html.dark .shiki-wrapper :deep(.token-surface) {
  background: rgba(110, 86, 207, 0.15);
  color: #a78bfa;
}

html.dark .shiki-wrapper :deep(.token-text) {
  background: rgba(63, 185, 80, 0.15);
  color: #56d364;
}

html.dark .shiki-wrapper :deep(.token-hue) {
  background: rgba(219, 171, 9, 0.15);
  color: #e3b341;
}

html.dark .shiki-wrapper :deep(.token-border) {
  background: rgba(163, 113, 247, 0.15);
  color: #bc8cff;
}
</style>
