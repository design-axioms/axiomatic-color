<script setup lang="ts">
import { computed } from "vue";
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
</script>

<template>
  <div class="live-example">
    <ShadowSurface
      :html="html"
      :surface="surface ?? 'surface-page'"
      :extra-css="extraCss"
      class="live-example-specimen"
    />
    <div class="live-example-code">
      <pre><code>{{ displayCode }}</code></pre>
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

.live-example-code {
  background: var(--vp-code-block-bg);
  padding: 1rem 1.25rem;
  overflow-x: auto;
  border-top: 1px solid var(--vp-c-divider);
}

.live-example-code pre {
  margin: 0;
  padding: 0;
  background: none;
}

.live-example-code code {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-code-block-color);
  white-space: pre;
}
</style>