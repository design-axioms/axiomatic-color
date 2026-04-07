<script setup>
import DefaultTheme from "vitepress/theme";
import AtmosphereDropdown from "./components/AtmosphereDropdown.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <AtmosphereDropdown />
    </template>
  </Layout>
</template>
