# Getting Started

::: info Pre-release
Axiomatic Color v2 (`@design-axioms/color`) is in active development and not yet published to npm. Run it from a local checkout below, or explore it live in the browser via the [interactive demo](/demo).
:::

## Setup from Source

Use Node 24+ and pnpm 10:

```bash
git clone https://github.com/design-axioms/axiomatic-color.git
cd axiomatic-color
pnpm install
pnpm build
```

## Quick Start

Generate CSS from the default configuration:

```typescript
import { DEFAULT_CONFIG, generateCSS, solve } from "@design-axioms/color";

const output = solve(DEFAULT_CONFIG);
const css = generateCSS(output, {
  ...DEFAULT_CONFIG.options,
  keyColors: DEFAULT_CONFIG.keyColors,
});

// css is a complete stylesheet with:
// - light-dark() mode switching
// - .surface-* classes (lightness context + automatic surface distinction)
// - .hue-* utilities (atmosphere from key colors)
// - .text-* and .border-* utilities (contrast intent)
// - prefers-contrast and forced-colors accessibility blocks
```

## CLI

From the repository root, use `pnpm cli` to run the `axiomatic` CLI commands:

```bash
# Generate CSS to stdout
pnpm cli build
```

::: details Output (truncated)

```css
/* Root — color-scheme drives light-dark() */
:root {
  color-scheme: light;
  --axm-hue: 0;
  --axm-chroma: 0;
  --axm-key-brand-hue: 288.0332;
  --axm-key-brand-chroma: 0.179;
  --axm-key-accent-hue: 221.7231;
  --axm-key-accent-chroma: 0.1109;
  --axm-key-success-hue: 149.5793;
  --axm-key-success-chroma: 0.192;
  --axm-key-warning-hue: 86.0468;
  --axm-key-warning-chroma: 0.1617;
  --axm-key-error-hue: 25.3313;
  --axm-key-error-chroma: 0.2078;
}

/* Hue/chroma properties — inheriting */
@property --axm-hue {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

/* Surface classes */

.surface-page {
  --axm-surface: light-dark(oklch(0.975...), oklch(0.1...));
  --axm-text-high: light-dark(oklch(0.2024...), oklch(0.9657...));
  --axm-text-strong: light-dark(oklch(0.3072...), oklch(0.9416...));
  --axm-text-subtle: light-dark(oklch(0.3658...), oklch(0.9174...));
  /* ... borders, more surfaces, prefers-contrast, forced-colors ... */
}

/* Text utilities */
.text-high {
  color: var(--axm-text-high);
}
.text-strong {
  color: var(--axm-text-strong);
}
/* ... 322 lines total ... */
```

:::

```bash
# Validate configuration and show diagnostics
pnpm cli validate
```

::: details Output (truncated)

```
=== LIGHT MODE ===
  page: L=0.9750, polarity=page
    HC: L=0.9900
  workspace: L=0.9550, polarity=page
    ⚠ unmet text grades: high
    ◻ distinction required (base)
    HC: L=0.9820
      ◻ distinction required (HC)
  card: L=0.9000, polarity=page
    ⚠ unmet text grades: high, strong, subtle
    ◻ distinction required (base)
    HC: L=0.9600
      ◻ distinction required (HC)
      ⚠ HC unmet text grades: high, strong
  action: L=0.9000, polarity=page
    ⚠ unmet text grades: high, strong, subtle
    ◻ distinction required (base)
    HC: L=0.9600
      ◻ distinction required (HC)
      ⚠ HC unmet text grades: high, strong, subtle
  spotlight: L=0.1000, polarity=inverted
  spotlight-card: L=0.1200, polarity=inverted
    ◻ distinction required (base)
  spotlight-action: L=0.1200, polarity=inverted
    ◻ distinction required (base)

  Composition:
    page ↔ card: 14.2 APCA [enhancement]
    page ↔ spotlight: 102.6 APCA [guarantee]
    card ↔ spotlight: 86.6 APCA [guarantee]

=== DARK MODE ===
  page: L=0.1000, polarity=page
    HC: L=0.0400
  workspace: L=0.1800, polarity=page
    ◻ distinction required (base)
  card: L=0.2500, polarity=page
    ◻ distinction required (base)
  action: L=0.2500, polarity=page
    ◻ distinction required (base)
  spotlight: L=0.9000, polarity=inverted
    ⚠ unmet text grades: high, strong, subtle
  spotlight-card: L=0.8800, polarity=inverted
    ⚠ unmet text grades: high, strong, subtle
    ◻ distinction required (base)
  spotlight-action: L=0.8800, polarity=inverted
    ⚠ unmet text grades: high, strong, subtle
    ⚠ unmet border tiers: critical
    ◻ distinction required (base)

  Composition:
    page ↔ spotlight: 86.7 APCA [guarantee]
    card ↔ spotlight: 83.5 APCA [guarantee]
    card ↔ spotlight-card: 79.5 APCA [guarantee]
```

:::

```bash
# Print solver output as JSON
pnpm cli inspect

# Generate a self-contained HTML demo page
pnpm cli demo
```

## Hello World

Save the build output and open it in a browser:

```bash
pnpm cli build -o axiomatic.css
```

<LiveExample
surface="surface-page"
:html='`<div class="surface-card" style="padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">

  <h1 class="text-high" style="font-size: 1.25rem; font-weight: 700; margin: 0 0 0.5rem;">Neutral Card</h1>
  <p class="text-strong" style="font-size: 0.875rem; margin: 0;">No atmosphere. Pure lightness.</p>
</div>
<div class="surface-card hue-brand" style="padding: 1.5rem; border-radius: 8px;">
  <h1 class="text-high" style="font-size: 1.25rem; font-weight: 700; margin: 0 0 0.5rem;">Brand Card</h1>
  <p class="text-strong" style="font-size: 0.875rem; margin: 0;">Same contrast, brand tint.</p>
</div>`'
  :code='`<div class="surface-card">
  <h1 class="text-high">Neutral Card</h1>
  <p class="text-strong">No atmosphere. Pure lightness.</p>
</div>
<div class="surface-card hue-brand">
  <h1 class="text-high">Brand Card</h1>
  <p class="text-strong">Same contrast, brand tint.</p>
</div>`'
/>

::: details Full HTML document

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="axiomatic.css" />
  </head>
  <body class="surface-page">
    <div
      class="surface-card"
      style="padding: 1.5rem; border-radius: 8px; max-width: 400px; margin: 2rem auto;"
    >
      <h1 class="text-high">Neutral Card</h1>
      <p class="text-strong">No atmosphere. Pure lightness.</p>
    </div>
    <div
      class="surface-card hue-brand"
      style="padding: 1.5rem; border-radius: 8px; max-width: 400px; margin: 2rem auto;"
    >
      <h1 class="text-high">Brand Card</h1>
      <p class="text-strong">Same contrast, brand tint.</p>
    </div>
  </body>
</html>
```

:::

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

<LiveExample
surface="surface-page"
:html='`<div class="surface-card" style="padding: 1.25rem; border-radius: 6px; margin-bottom: 1rem;">

  <h2 class="text-high" style="font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem;">Card Title</h2>
  <p class="text-strong" style="font-size: 0.875rem; margin: 0 0 0.25rem;">Body text at the strong grade.</p>
  <p class="text-subtle" style="font-size: 0.8125rem; margin: 0;">Secondary information.</p>
</div>
<div class="surface-card hue-brand" style="padding: 1.25rem; border-radius: 6px;">
  <h2 class="text-high" style="font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem;">Brand Card</h2>
  <p class="text-strong" style="font-size: 0.875rem; margin: 0;">Same contrast, brand purple tint.</p>
</div>`'
  :code='`<div class="surface-card">
  <h2 class="text-high">Card Title</h2>
  <p class="text-strong">Body text at the strong grade.</p>
  <p class="text-subtle">Secondary information.</p>
</div>

<div class="surface-card hue-brand">
  <h2 class="text-high">Brand Card</h2>
  <p class="text-strong">Same contrast, brand purple tint.</p>
</div>`'
/>

Three kinds of classes compose orthogonally:

- <Token name=".surface-*" /> — sets lightness context (background, text values, borders)
- <Token name=".hue-*" /> — overrides atmosphere (hue and chroma) without changing lightness
- <Token name=".text-*" /> / <Token name=".border-*" /> — selects contrast grade from the current surface context
