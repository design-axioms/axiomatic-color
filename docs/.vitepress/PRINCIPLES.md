# Documentation Site Principles

## The docs site is a consumer of the color system

Every element on this site that lives inside a surface is styled using the system's CSS classes — not by referencing `var(--axm-*)` custom properties directly. The custom properties are an implementation detail; the classes are the API.

### What this means in practice

**Inside a surface context** (any element that's a descendant of a `.surface-*` class):

- Text color → use `.text-high`, `.text-strong`, `.text-subtle`, `.text-subtlest`
- Border color → use `.border-decorative`, `.border-interactive`, `.border-critical`
- Atmosphere → use `.hue-brand`, `.hue-success`, etc.
- Background → applied automatically by the surface class

**Never do this:**

```css
/* WRONG: reaching for the variable directly */
.my-label {
  color: var(--axm-text-high);
}
```

**Do this instead:**

```html
<!-- RIGHT: using the class -->
<span class="my-label text-high">Label</span>
```

### Why

1. **The docs demonstrate the programming model.** If a reader inspects any element, they should see the same classes they'd use in their own code.
2. **Composition works.** Classes compose with surfaces, hue utilities, and mode switching. Direct variable references bypass the composition algebra.
3. **Consistency.** One source of truth for how text color is resolved, not N component-local implementations.

### Documentation chrome vs system content

There are two categories of styling on this site:

| Category             | Source                                 | Examples                                           |
| -------------------- | -------------------------------------- | -------------------------------------------------- |
| System content       | `@design-axioms/color` classes         | Text on surfaces, borders, backgrounds             |
| Documentation chrome | VitePress theme variables (`--vp-c-*`) | Toolbar buttons, slider labels, component outlines |

The distinction: if an element is _inside a surface context_ and represents content that the color system is responsible for, use system classes. If it's documentation UI that frames the content (controls, labels, chrome), use VitePress theme variables.

### Reusable components

When a visual pattern appears more than once, it should be a component:

- **Token** — canonical styled class name badge (`.text-high`, `.surface-card`, etc.)
- **ApcaBadge** — inline contrast verification pill with link to APCA reference
- **GradePreview** — live text grades + border tiers on real surfaces

Don't create one-off styled spans for class names — use `<Token name=".text-high" />`.
