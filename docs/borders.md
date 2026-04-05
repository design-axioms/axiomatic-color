# Borders

Three contrast tiers for different purposes.

## Tiers

| Tier | Class | APCA Target | Use |
|------|-------|-------------|-----|
| Decorative | `.border-decorative` | Lc 10 | Subtle container outlines |
| Interactive | `.border-interactive` | Lc 30 | Buttons, inputs, clickable elements |
| Critical | `.border-critical` | Lc 80 | Error states, required fields |

## Usage

```html
<div class="surface-card border-decorative">
  <p class="text-strong">A card with a subtle outline.</p>
</div>

<button class="surface-action border-interactive text-high">
  Submit
</button>

<div class="surface-card border-critical">
  <p class="text-high">Required field.</p>
</div>
```

Border colors resolve per surface, so the same class produces correct contrast whether the surface is light or dark.
