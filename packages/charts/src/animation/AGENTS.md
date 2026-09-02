# animation

Path morphing, and the configuration that drives it.

## Files

| Path | What |
| --- | --- |
| `animation.types.ts` | `ChartAnimation` — timing, spring, or none |
| `use-animated-path.ts` | A path that morphs whenever it changes |

## Design

- **Interpolation is Skia's own `usePathInterpolation`.** One native
  `Path.Interpolate` per frame, with no path allocated on the JavaScript side.
  The alternative — constructing a path inside a `useDerivedValue` — is the
  shape behind a long-standing crash with Skia host objects in shared values.

- **It never falls back to snapping, and says so when it does.** Point counts
  are matched in data space before either path is built, so two paths always
  share a verb sequence and `isInterpolatable` always holds. The
  development-only warning exists to make a regression loud: if it fires,
  `chooseMorphStrategy` or `matchPointCounts` has a bug, and silently snapping
  is exactly how that bug would survive a release.

- **`none` is not a zero duration.** It skips the interpolation entirely, which
  is what a chart re-rendering off a live feed needs — there is nothing to
  animate towards when the target moves every frame, and starting an animation
  you immediately abandon costs a frame each time.

- **The animation config is read through a ref inside the effect.** An inline
  `{ type: "timing" }` prop is a new object every render; in the dependency
  list it would restart the animation on every render, which reads as a line
  that never settles.

- **`enterFrom` is read on mount and never again.** It seeds the first morph
  — a pie slice hands over itself at radius zero and grows out of the centre —
  and is then forgotten, so an inline path built on every render cannot restart
  the entrance. Omitted, the hook behaves exactly as it did before the option
  existed: the range starts at the target and nothing is animated on mount.
