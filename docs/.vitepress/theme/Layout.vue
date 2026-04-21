<script setup>
import DefaultTheme from "vitepress/theme";
import AtmosphereDropdown from "./components/AtmosphereDropdown.vue";
import HcToggle from "./components/HcToggle.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <AtmosphereDropdown />
      <HcToggle />
    </template>
  </Layout>
</template>
