# Why Axiomatic?

$$
\text{Color} = f(\text{Context}, \text{Intent})
$$

Axiomatic Color is not a paint set — a collection of static colors you pick from a palette. It's a **deterministic system** that generates accessible, harmonious, and adaptive interfaces from semantic intent.

## The Problem

Design systems face an inherent tension: **aesthetics vs. accessibility**. Beautiful color palettes break when you check them against contrast requirements. Accessible palettes feel lifeless when you strip away the creative freedom.

Most systems resolve this by hand-tuning — a designer picks colors, an engineer checks contrast, they iterate until both sides compromise. This doesn't scale, doesn't adapt to user preferences, and doesn't guarantee correctness.

## The Solution

Axiomatic Color treats aesthetics and accessibility as **constraints in the same mathematical system**. You declare your intent (surfaces, atmosphere, text grades), and the solver finds colors that satisfy all constraints simultaneously.

- **Input**: Semantic intent (surface names, key colors, contrast targets)
- **Process**: Constraint solver (APCA contrast + oklch color science)
- **Output**: CSS custom properties with `light-dark()` mode switching

The output works in any browser that supports `oklch()` and `light-dark()`. No runtime JavaScript. No build step at consumption time.

## What Gets Guaranteed

The system makes explicit guarantees — and is explicit about what it _doesn't_ guarantee:

| Tier             | What                          | Example                                                              |
| ---------------- | ----------------------------- | -------------------------------------------------------------------- |
| **Guarantee**    | Text APCA contrast targets    | "Strong" text achieves 95+ APCA on every surface that can support it |
| **Guarantee**    | Cross-polarity distinction    | Page ↔ Spotlight has 80+ APCA gap                                    |
| **Guarantee**    | Border contrast tiers         | Decorative (10), Interactive (30), Critical (80) APCA                |
| **Enhancement**  | Same-polarity surface stagger | Page is lighter than Workspace — real but not load-bearing           |
| **Out of scope** | Multi-signal visual hierarchy | Borders + shadows + spacing compose hierarchy above this layer       |

When a target can't be met (e.g., a dark card surface can't achieve 100 APCA for "high" grade text), the system tells you — the "noisy no." It solves for the best achievable value and flags the shortfall in diagnostics.
