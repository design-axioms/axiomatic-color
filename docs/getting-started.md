# Getting Started

## Installation

```bash
pnpm add @design-axioms/color
```

## Quick Start

Generate CSS from the default configuration:

```typescript
import { DEFAULT_CONFIG, generateCSS, solve } from "@design-axioms/color";

const output = solve(DEFAULT_CONFIG);
const css = generateCSS(output, {
  ...DEFAULT_CONFIG.options,
  keyColors: DEFAULT_CONFIG.anchors.keyColors,
});

// css is a complete stylesheet with:
// - light-dark() mode switching
// - .surface-* classes (lightness context)
// - .hue-* utilities (atmosphere from key colors)
// - .text-* and .border-* utilities (contrast intent)
```

## CLI

The CLI provides commands for building, validating, and inspecting the color system:

```bash
# Generate CSS to stdout
npx axiomatic build

# Validate configuration and show diagnostics
npx axiomatic validate

# Print solver output as JSON
npx axiomatic inspect

# Generate a self-contained HTML demo page
npx axiomatic demo
```

## Using the CSS

The generated CSS uses `color-scheme` on `:root` to drive `light-dark()`. Switch modes by changing the property:

```css
/* Light mode (default) */
:root {
  color-scheme: light;
}

/* Dark mode */
:root {
  color-scheme: dark;
}
```

Apply surfaces and text grades using the generated classes:

```html
<body class="surface-page">
  <!-- Neutral card -->
  <div class="surface-card">
    <h2 class="text-high">Card Title</h2>
    <p class="text-strong">Body text at the strong grade.</p>
    <p class="text-subtle">Secondary information.</p>
  </div>

  <!-- Brand-tinted card — same surface, different atmosphere -->
  <div class="surface-card hue-brand">
    <h2 class="text-high">Brand Card</h2>
    <p class="text-strong">Same contrast, brand purple tint.</p>
  </div>
</body>
```

Three kinds of classes compose orthogonally:

- <Token name=".surface-*" /> — sets lightness context (background, text values, borders)
- <Token name=".hue-*" /> — overrides atmosphere (hue and chroma) without changing lightness
- <Token name=".text-*" /> / <Token name=".border-*" /> — selects contrast grade from the current surface context
