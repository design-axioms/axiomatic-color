# Demo

Generate a self-contained HTML demo page to explore the color system interactively:

```bash
npx axiomatic demo
open demo.html
```

The demo includes:

- **Surface swatches** — every surface with all four text grades, APCA tables for both modes, and ⚠ markers for unmet targets
- **Composition layout** — workspace → card → action nesting showing how surfaces stack
- **Border showcase** — decorative, interactive, and critical tiers side by side
- **Mode toggle** — flips `color-scheme` on `:root`, `light-dark()` handles the rest
- **Key color picker** — paste a hex color or use the oklch hue/chroma sliders to explore atmosphere
- **CSS source viewer** — collapsible view of the complete generated CSS
