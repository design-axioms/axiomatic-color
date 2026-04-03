<script setup lang="ts">
defineProps<{
  name: string;
}>();
</script>

<template>
  <span class="token-badge">
    <svg class="token-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />
    </svg>
    <code class="token-name">{{ name }}</code>
  </span>
</template>

<style scoped>
.token-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.05rem 0.4rem 0.05rem 0.25rem;
  border-radius: 4px;
  background: var(--vp-c-default-soft);
  vertical-align: baseline;
  line-height: 1.4;
}

.token-icon {
  width: 0.8em;
  height: 0.8em;
  flex-shrink: 0;
  color: var(--vp-c-brand-1);
  opacity: 0.6;
}

.token-name {
  font-family: var(--vp-font-family-mono);
  font-size: 0.8em;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  background: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
}
</style>
