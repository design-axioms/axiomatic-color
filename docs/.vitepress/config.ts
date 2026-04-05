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
      { text: "Docs", link: "/" },
      { text: "Demo", link: "/demo" },
    ],
    sidebar: [
      {
        text: "System",
        items: [
          { text: "Introduction", link: "/" },
          { text: "Surfaces", link: "/surfaces" },
          { text: "Text", link: "/text" },
          { text: "Borders", link: "/borders" },
          { text: "Atmosphere", link: "/atmosphere" },
          { text: "Composition", link: "/composition" },
        ],
      },
      {
        text: "More",
        items: [
          { text: "Why Axiomatic?", link: "/why" },
          { text: "Getting Started", link: "/getting-started" },
          { text: "Architecture", link: "/architecture" },
          { text: "CLI", link: "/reference/cli" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/design-axioms/color" },
    ],
  },
});
