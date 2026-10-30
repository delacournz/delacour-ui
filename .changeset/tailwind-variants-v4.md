---
"@delacour/react-native-ui": minor
"delacour": minor
---

Upgrade `tailwind-variants` to v4. `lib/tv` now builds `tv` with `createTV` from `tailwind-variants/config`, the only v4 entry that accepts `twMergeConfig` — the default entry throws on it, so a `tv.ts` copied by an earlier CLI breaks as soon as v4 is installed. `tailwind-merge` is no longer a dependency: v4 ships its own compiled merge tables. `delacour add` stops installing it.

v4's types drop numeric variant keys, so `KpiVariantProps["colorIndex"]`, `PlannerVariantProps["colorIndex"]` and `LeaderboardVariantProps["place"]` are now string unions (`"1" | "2" | …`). The component props — `KpiColorIndex`, `PlannerColorIndex`, `LeaderboardPlace` — stay numeric.
