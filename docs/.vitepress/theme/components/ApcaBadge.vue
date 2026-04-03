<script setup lang="ts">
const props = defineProps<{
  value: number;
  target?: number;
  label?: string;
}>();

const status = props.target
  ? props.value >= props.target
    ? "met"
    : props.value >= props.target * 0.9
      ? "close"
      : "unmet"
  : "info";
</script>

<template>
  <a class="apca-badge" :class="status" href="/reference/apca" :title="`APCA Lc ${value}${target ? ` (target: ${target})` : ''}`">
    <span class="apca-icon">{{ status === 'met' ? '✓' : status === 'close' ? '~' : '⚠' }}</span>
    <span class="apca-value">Lc {{ value }}</span>
    <span v-if="label" class="apca-label">{{ label }}</span>
  </a>
</template>

<style scoped>
.apca-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-family: var(--vp-font-family-mono);
  font-weight: 500;
  text-decoration: none;
  line-height: 1.4;
  vertical-align: middle;
  cursor: help;
  transition: opacity 0.15s;
}

.apca-badge:hover {
  opacity: 0.85;
}

.apca-icon {
  font-size: 0.6rem;
}

.apca-value {
  font-weight: 600;
}

.apca-label {
  font-weight: 400;
  opacity: 0.8;
}

/* Status colors */
.met {
  background: rgba(16, 185, 129, 0.12);
  color: #18794e;
}

.close {
  background: rgba(234, 179, 8, 0.14);
  color: #915930;
}

.unmet {
  background: rgba(244, 63, 94, 0.12);
  color: #b8272c;
}

.info {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}
</style>
