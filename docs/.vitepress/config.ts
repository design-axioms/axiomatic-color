import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Axiomatic Color",
  description: "A physics engine for design — guarantees contrast correctness using APCA",
  markdown: {
    math: true,
  },
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "Architecture", link: "/architecture" },
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
