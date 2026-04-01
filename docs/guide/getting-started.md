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
const css = generateCSS(output, DEFAULT_CONFIG.options);

// css is a complete stylesheet with light-dark() mode switching
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
:root { color-scheme: light; }

/* Dark mode */
:root { color-scheme: dark; }
```

Apply surfaces and text grades using the generated classes:

```html
<body class="surface-page">
  <div class="surface-card border-decorative">
    <h2 class="text-high">Card Title</h2>
    <p class="text-strong">Body text at the strong grade.</p>
    <p class="text-subtle">Secondary information.</p>
  </div>
</body>
```

Every surface class sets local custom properties for its background, text grades, and border tiers. Text and border utility classes consume the nearest ancestor surface's context.
