import { defineConfig } from "vitepress";
import { resolve } from "node:path";

export default defineConfig({
  title: "Axiomatic Color",
  description:
    "A physics engine for design — guarantees contrast correctness using APCA",
  markdown: {
    math: true,
  },
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag === "color-slider",
      },
    },
  },
  vite: {
    resolve: {
      alias: {
        "@design-axioms/color": resolve(
          __dirname,
          "../../packages/core/src/index.ts",
        ),
      },
    },
  },
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Why?", link: "/guide/" },
      { text: "Demo", link: "/demo" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Why Axiomatic?", link: "/guide/" },
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "Concepts", link: "/guide/concepts" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "Architecture", link: "/architecture" },
          { text: "APCA Contrast", link: "/reference/apca" },
          { text: "Pedagogy", link: "/pedagogy" },
          { text: "CLI", link: "/reference/cli" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/design-axioms/color" },
    ],
  },
});
