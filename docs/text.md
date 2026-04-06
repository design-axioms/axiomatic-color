# Text

Four contrast grades, solved per surface per mode to meet APCA targets.

## Preview

<GradePreview />

## How It Works

<Token name=".text-high" /> on Page and <Token name=".text-high" /> on Spotlight both meet their APCA target, but with different solved lightness values. The class is the same; the solver adapts per surface and mode.

If a target can't be fully met, the solver reports the shortfall.

## Usage

```html
<div class="surface-card">
  <h1 class="text-high">Title</h1>
  <p class="text-strong">Body text.</p>
  <p class="text-subtle">Secondary details.</p>
  <span class="text-subtlest">Hint text.</span>
</div>
```

The same classes work on every surface.
