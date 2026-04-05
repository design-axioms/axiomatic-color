# Text

Four contrast grades, solved per surface per mode to meet APCA targets.

## Preview

<GradePreview />

## Grades

| Grade | Class | APCA Target | Use |
|-------|-------|-------------|-----|
| High | `.text-high` | Lc 100 | Headings, primary labels |
| Strong | `.text-strong` | Lc 95 | Body text for reading |
| Subtle | `.text-subtle` | Lc 90 | Secondary information |
| Subtlest | `.text-subtlest` | Lc 75 | Hints and metadata |

## How It Works

The system solves each grade for each surface and mode. <Token name=".text-high" /> on Page and <Token name=".text-high" /> on Spotlight both meet their APCA target with different solved lightness values.

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
