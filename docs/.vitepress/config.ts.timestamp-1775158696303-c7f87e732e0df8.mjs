// docs/.vitepress/config.ts
import { defineConfig } from "file:///Users/wycats/Code/axiomatic-color/node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.50.0_lightningcss@1.32.0_markdown-it-mathjax3@_29b75cd72eb28e0d986e44fd41c3d46b/node_modules/vitepress/dist/node/index.js";
import { resolve } from "node:path";
var __vite_injected_original_dirname = "/Users/wycats/Code/axiomatic-color/docs/.vitepress";
var config_default = defineConfig({
  title: "Axiomatic Color",
  description: "A physics engine for design \u2014 guarantees contrast correctness using APCA",
  markdown: {
    math: true
  },
  vite: {
    resolve: {
      alias: {
        "@design-axioms/color": resolve(__vite_injected_original_dirname, "../../packages/core/src/index.ts")
      }
    }
  },
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Why?", link: "/guide/" },
      { text: "Demo", link: "/demo" }
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Why Axiomatic?", link: "/guide/" },
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "Concepts", link: "/guide/concepts" }
        ]
      },
      {
        text: "Reference",
        items: [
          { text: "Architecture", link: "/architecture" },
          { text: "Pedagogy", link: "/pedagogy" },
          { text: "CLI", link: "/reference/cli" }
        ]
      }
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/design-axioms/color" }
    ]
  }
});
export {
  config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZG9jcy8udml0ZXByZXNzL2NvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy93eWNhdHMvQ29kZS9heGlvbWF0aWMtY29sb3IvZG9jcy8udml0ZXByZXNzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvd3ljYXRzL0NvZGUvYXhpb21hdGljLWNvbG9yL2RvY3MvLnZpdGVwcmVzcy9jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3d5Y2F0cy9Db2RlL2F4aW9tYXRpYy1jb2xvci9kb2NzLy52aXRlcHJlc3MvY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVwcmVzc1wiO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCJub2RlOnBhdGhcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgdGl0bGU6IFwiQXhpb21hdGljIENvbG9yXCIsXG4gIGRlc2NyaXB0aW9uOlxuICAgIFwiQSBwaHlzaWNzIGVuZ2luZSBmb3IgZGVzaWduIFx1MjAxNCBndWFyYW50ZWVzIGNvbnRyYXN0IGNvcnJlY3RuZXNzIHVzaW5nIEFQQ0FcIixcbiAgbWFya2Rvd246IHtcbiAgICBtYXRoOiB0cnVlLFxuICB9LFxuICB2aXRlOiB7XG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgXCJAZGVzaWduLWF4aW9tcy9jb2xvclwiOiByZXNvbHZlKF9fZGlybmFtZSwgXCIuLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9pbmRleC50c1wiKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgdGhlbWVDb25maWc6IHtcbiAgICBuYXY6IFtcbiAgICAgIHsgdGV4dDogXCJHdWlkZVwiLCBsaW5rOiBcIi9ndWlkZS9nZXR0aW5nLXN0YXJ0ZWRcIiB9LFxuICAgICAgeyB0ZXh0OiBcIldoeT9cIiwgbGluazogXCIvZ3VpZGUvXCIgfSxcbiAgICAgIHsgdGV4dDogXCJEZW1vXCIsIGxpbms6IFwiL2RlbW9cIiB9LFxuICAgIF0sXG4gICAgc2lkZWJhcjogW1xuICAgICAge1xuICAgICAgICB0ZXh0OiBcIkd1aWRlXCIsXG4gICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgeyB0ZXh0OiBcIldoeSBBeGlvbWF0aWM/XCIsIGxpbms6IFwiL2d1aWRlL1wiIH0sXG4gICAgICAgICAgeyB0ZXh0OiBcIkdldHRpbmcgU3RhcnRlZFwiLCBsaW5rOiBcIi9ndWlkZS9nZXR0aW5nLXN0YXJ0ZWRcIiB9LFxuICAgICAgICAgIHsgdGV4dDogXCJDb25jZXB0c1wiLCBsaW5rOiBcIi9ndWlkZS9jb25jZXB0c1wiIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0ZXh0OiBcIlJlZmVyZW5jZVwiLFxuICAgICAgICBpdGVtczogW1xuICAgICAgICAgIHsgdGV4dDogXCJBcmNoaXRlY3R1cmVcIiwgbGluazogXCIvYXJjaGl0ZWN0dXJlXCIgfSxcbiAgICAgICAgICB7IHRleHQ6IFwiUGVkYWdvZ3lcIiwgbGluazogXCIvcGVkYWdvZ3lcIiB9LFxuICAgICAgICAgIHsgdGV4dDogXCJDTElcIiwgbGluazogXCIvcmVmZXJlbmNlL2NsaVwiIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgIF0sXG4gICAgc29jaWFsTGlua3M6IFtcbiAgICAgIHsgaWNvbjogXCJnaXRodWJcIiwgbGluazogXCJodHRwczovL2dpdGh1Yi5jb20vZGVzaWduLWF4aW9tcy9jb2xvclwiIH0sXG4gICAgXSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4VCxTQUFTLG9CQUFvQjtBQUMzVixTQUFTLGVBQWU7QUFEeEIsSUFBTSxtQ0FBbUM7QUFHekMsSUFBTyxpQkFBUSxhQUFhO0FBQUEsRUFDMUIsT0FBTztBQUFBLEVBQ1AsYUFDRTtBQUFBLEVBQ0YsVUFBVTtBQUFBLElBQ1IsTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNKLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLHdCQUF3QixRQUFRLGtDQUFXLGtDQUFrQztBQUFBLE1BQy9FO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGFBQWE7QUFBQSxJQUNYLEtBQUs7QUFBQSxNQUNILEVBQUUsTUFBTSxTQUFTLE1BQU0seUJBQXlCO0FBQUEsTUFDaEQsRUFBRSxNQUFNLFFBQVEsTUFBTSxVQUFVO0FBQUEsTUFDaEMsRUFBRSxNQUFNLFFBQVEsTUFBTSxRQUFRO0FBQUEsSUFDaEM7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixPQUFPO0FBQUEsVUFDTCxFQUFFLE1BQU0sa0JBQWtCLE1BQU0sVUFBVTtBQUFBLFVBQzFDLEVBQUUsTUFBTSxtQkFBbUIsTUFBTSx5QkFBeUI7QUFBQSxVQUMxRCxFQUFFLE1BQU0sWUFBWSxNQUFNLGtCQUFrQjtBQUFBLFFBQzlDO0FBQUEsTUFDRjtBQUFBLE1BQ0E7QUFBQSxRQUNFLE1BQU07QUFBQSxRQUNOLE9BQU87QUFBQSxVQUNMLEVBQUUsTUFBTSxnQkFBZ0IsTUFBTSxnQkFBZ0I7QUFBQSxVQUM5QyxFQUFFLE1BQU0sWUFBWSxNQUFNLFlBQVk7QUFBQSxVQUN0QyxFQUFFLE1BQU0sT0FBTyxNQUFNLGlCQUFpQjtBQUFBLFFBQ3hDO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLGFBQWE7QUFBQSxNQUNYLEVBQUUsTUFBTSxVQUFVLE1BQU0seUNBQXlDO0FBQUEsSUFDbkU7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
