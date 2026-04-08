# Why Axiomatic Color

## The problem

Maintaining contrast across surfaces and across light and dark modes is manual work. A designer picks colors, an engineer checks contrast, and the team iterates until the result looks acceptable. Nothing guarantees that text contrast still holds on every surface after the next change.

When you add a surface, you re-check every text grade on that surface in both modes. When you change a key color, you re-check every surface it tints. When a surface moves to a different lightness, all of its text and border values need re-solving. This is the maintenance loop.

## The approach

Axiomatic Color starts from semantic intent instead of a fixed palette. You declare surfaces, text grades, and atmosphere. The solver generates CSS custom properties that handle contrast and mode switching together.

The output uses `oklch()` colors wrapped in `light-dark()` for mode switching. It works in browsers that support those functions and does not require runtime JavaScript or a build step at consumption time.

## The contract

The system makes three kinds of claims.

**Guaranteed:** Text grades meet their APCA targets on every surface that can support them. "Strong" text targets 95+ APCA. Page and Spotlight maintain an 80+ APCA gap. Border tiers resolve at their target contrast (decorative at 10, interactive at 30, critical at 80).

**Enhanced:** Page is lighter than Workspace, and Workspace is lighter than Card. These differences are real, but hierarchy should not depend on them alone.

**Out of scope:** Borders, shadows, and spacing work together to establish visual hierarchy. That composition belongs to a design system layer built on top of the color system.

## When targets cannot be met

If a target cannot be met, the system reports the shortfall in diagnostics and solves for the best achievable value. For example, a dark card surface at L=0.40 may not reach a 100 APCA text target. The solver reports which grades fell short and by how much.
