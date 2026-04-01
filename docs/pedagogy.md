# Pedagogical Mapping

> A translation layer between the rigorous internal algebra and user-facing mental models.

The Axiomatic Color system uses mathematical models to guarantee correctness. But teaching the math directly can be alienating. These **pedagogical metaphors** make the system intuitive without sacrificing accuracy.

## The Core Metaphor: Signal Processing

The UI is not a static painting — it's a **signal processing system**.

| Internal Concept | Pedagogical Term | The Metaphor |
|:-----------------|:-----------------|:-------------|
| **Atmosphere** | **Context** | The "Weather" of the room. It permeates everything — warm or cool, vivid or muted. |
| **Text Grades** | **Voice** | The "Speaker." They can whisper (Subtlest) or project clearly (High). |
| **Contrast Mode** | **Volume** | The "Volume Knob." High Contrast Mode amplifies the signal. |
| **Light/Dark Mode** | **Time of Day** | The "Sun." Light mode is daytime, dark mode is night. |

## Key Metaphors

### The Taper: Why You Can't Have Neon Black

**Math:** $C_{\text{effective}} = C \times (1 - |2L - 1|)$

**Metaphor:** As a surface approaches pure black or pure white, its ability to carry color diminishes — like how objects lose their color in deep shadow or blinding light. "Neon black" doesn't exist in physics, and the taper encodes that reality.

The taper is a linear bicone in the lightness-chroma space. At mid-lightness (L=0.5), full chroma is available. At the extremes, chroma fades to zero.

### Atmosphere: Weather, Not Paint

Atmosphere is not a color you pick for each surface. It's the ambient condition that permeates everything — like weather affects the appearance of every object in a scene.

A key color (your brand purple, your product's signature green) sets the atmosphere. The system applies it proportionally: mid-lightness surfaces show it most, extreme-lightness surfaces show it least (the taper at work).

### The Noisy No: Honest Diagnostics

When you ask for something the system can't deliver — "high" grade text (100 APCA) on a mid-tone card surface — the system doesn't silently compromise. It:

1. Solves for the best achievable contrast
2. Reports that the target was missed
3. Tells you what the ceiling actually is

This is the "noisy no." The system is always honest about its limitations, so you can make informed tradeoffs about surface placement, anchor ranges, and contrast targets.
