# Demo

Explore the color system interactively. Pick a key color, adjust hue and chroma, toggle light/dark mode, and see how every surface, text grade, and border tier responds.

<iframe src="/demo-app.html" style="width: 100%; height: 800px; border: 1px solid var(--vp-c-divider); border-radius: 8px;" loading="lazy"></iframe>

::: tip Open in new tab
<a href="/demo-app.html" target="_blank">Open the full demo →</a>
:::

## What the demo shows

- **Surface swatches** — every surface with all four text grades, APCA tables for both modes, and ⚠ markers for unmet targets
- **Composition layout** — workspace → card → action nesting showing how surfaces stack
- **Border showcase** — decorative, interactive, and critical tiers side by side
- **Mode toggle** — flips `color-scheme` on `:root`, `light-dark()` handles the rest
- **Key color picker** — paste a hex color or use the oklch hue/chroma sliders to explore atmosphere
- **CSS source viewer** — collapsible view of the complete generated CSS

## Generate locally

You can also generate the demo as a standalone HTML file:

```bash
npx axiomatic demo
open demo.html
```
