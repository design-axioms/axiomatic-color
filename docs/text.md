# Text

Four contrast grades, solved per surface per mode to meet APCA targets.

## Preview

<GradePreview />

## How It Works

The preview shows all four grades on both page and spotlight surfaces. The system solves each grade for each surface and mode. <Token name=".text-high" /> on Page and <Token name=".text-high" /> on Spotlight both meet their APCA target with different solved lightness values.

If a target can't be fully met, the solver reports the shortfall.

## Usage

```html
<div class="surface-card">
  <h1 class="text-high">Title</h1>
  <p class="text-strong">Body text for comfortable reading.</p>
  <p class="text-subtle">Secondary details.</p>
  <span class="text-subtlest">Hint text.</span>
</div>
```

The same classes work on every surface. No surface-specific overrides needed.
