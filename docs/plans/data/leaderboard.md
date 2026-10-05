# Leaderboard — DATA-01-P4

> Read [README.md](README.md) § Conventions first. Subpath `@delacour/react-native-ui/leaderboard`.

## Purpose on mobile

Ranked people or teams with the top three on a podium — a fitness challenge, a sales board, a game's
scores. It ranks for the caller (ties included), highlights "you", and pins "you" below a cut-off list.
Not virtualised: pass `limit`.

## API

```tsx
<Leaderboard data={entries} unit="points" highlightId={me} limit={10} onPressEntry={open} />
<Leaderboard data={laps} order="asc" podium="cards" formatValue={formatLapTime} unit="seconds" />
<Leaderboard data={entries} renderMedia={(e) => <Avatar …/>} />
```

```ts
type LeaderboardEntry = { id: string; name: string; value: number; change?: number; subtitle?: string };
type LeaderboardPodium = "bars" | "cards" | "none";
type LeaderboardProps = Omit<ViewProps, "children"> & {
  data: readonly LeaderboardEntry[];
  podium?: LeaderboardPodium;               // default "bars"; needs ≥ 3 entries, else falls back to "none"
  order?: "desc" | "asc";                   // default "desc"
  podiumScale?: "value" | "rank";           // forced "rank" when order is "asc"
  podiumHeight?: number;                    // tallest bar, default 132
  limit?: number;
  highlightId?: string;
  formatValue?: (value: number) => string;  // default Intl.NumberFormat grouping
  unit?: string;                            // spoken after the value
  renderMedia?: (entry: LeaderboardEntry, rank: number) => ReactNode;
  onPressEntry?: (entry: LeaderboardEntry, rank: number) => void;
  emptyText?: string;                       // default "No entries yet"
  className?: string;
};
```

Data-driven, single root (pattern A/C). Internal parts with display names: `Leaderboard.Podium`,
`.PodiumPlace`, `.Row`, `.Movement`, `.Empty` — not exported as slots in v1 (keep the surface small;
record in AGENTS.md why).

## Behaviour

- **Ranking**: standard competition ranking — `1, 2, 2, 4`. Stable sort by value (desc/asc), ties keep
  input order. Pure `rankLeaderboard(data, order)` → `RankedEntry[]` (`{ entry, rank, isTied }`).
- **Podium**: top three *positions* by index (not rank) render on the podium in visual order 2-1-3;
  rows start at index 3. `podium="none"` → all rows.
- **Bar heights** (`podiumScale`): `value` → height ∝ value / max with a floor of 35 % of
  `podiumHeight` so a tiny third stays visible; `rank` → fixed 100 / 75 / 55 %. `asc` forces `rank`
  (smaller is better, so value-proportional bars would invert the meaning).
- **Limit + highlight pinning**: rows beyond `limit` are cut; if `highlightId`'s entry is cut it is
  appended after a "…" separator with its true rank.
- **Movement**: `change > 0` ▲ success-soft-foreground, `< 0` ▼ destructive, `0` "–" muted; column hidden
  entirely when no entry has `change`.
- Highlighted row: `bg-primary/10`, name `Text.Strong`.
- Empty data → `EmptyState`-like muted text (use `EmptyState` if its API fits a compact inline use;
  otherwise a `Text.Caption`).

## Visual

Podium colours: theme `primary` at three opacities (100 / 70 / 45 %), not gold/silver/bronze — the
number on the podium already says the place. `cards` podium: three `Surface` cards, the leader raised
by 12 pt. Rows: rank (tabular, fixed width), media, name + subtitle, movement, value (end-aligned
tabular).

## Motion

Podium bars grow from 0 on mount, staggered third → second → first (Reanimated `withTiming`, 80 ms
stagger, 500 ms ease-out). Reduce motion → full height immediately. No row animation.

## A11y

One element per podium place and per row; label = `resolveLeaderboardAccessibilityLabel` →
"Rank 2, tied, Aroha, 1,240 points, up 3 places". `onPressEntry` → button role. The "…" separator is
hidden. `unit` documented as required for meaning.

## Reuses

`Pressable`, `Text`, `Surface`, `Icon`, `EmptyState` (if it fits), `useThemeColor` (bar fill). No new peers.

## Pure logic (`leaderboard.variants.ts`)

`rankLeaderboard`, `splitPodium(ranked, podium)` → `{ podium: RankedEntry[]; rows: RankedEntry[] }`,
`resolvePodiumOrder` (2-1-3), `resolvePodiumHeights(ranked, scale, order, max)`,
`applyLeaderboardLimit(rows, limit, highlightId)` → `{ rows; pinned?: RankedEntry }`,
`resolveMovement(change)` (discriminated: `{ kind: "up" | "down"; places } | { kind: "same" } | { kind: "none" }`),
`hasMovementColumn(data)`, `resolveLeaderboardAccessibilityLabel`, `defaultFormatValue`, slot classes.

## Playground demos

`bars` (hero, capture), `cards` (capture), `ascending-times` (capture), `highlight-pinned` (limit 5,
me at 14, capture), `ties`, `movement`, `with-avatars` (renderMedia + Avatar), `empty`, `pressable`.

## Docs page

`leaderboard.mdx`: overview, ranking + ties, podium styles and scale, limit + pinning, movement,
custom media, accessibility, API.

## Acceptance

- [ ] Ranking + ties + asc/desc + pin logic exhaustively tested (incl. < 3 entries, all tied, highlight in podium)
- [ ] Bars grow staggered on mount; none with reduce motion
- [ ] Highlighted, cut-off entry pinned with true rank
- [ ] VoiceOver label per place/row incl. "tied" and movement
- [ ] Folder AGENTS.md, Components row, ITEM_META, gen-exports, registry:build, demos, docs, changeset
- [ ] `bun test`, `bun run typecheck`, `bun run check` green

## Delivery notes

- **Previews not captured (follow-up).** The argent CLI the capture script drives is not installed on
  the build machine, so `bun run previews` cannot run. The demos carry `align: "stretch"` but no
  `capture` (a captured demo without a manifest entry fails `demos.test.ts`), and `leaderboard.mdx`
  opens at `## Installation` with no `<Preview>`. Follow-up: restore `capture` on `bars` (hero),
  `cards`, `ascending-times`, `highlight-pinned` and `movement`, run
  `bun run previews -- -- --only leaderboard`, and add the hero `<Preview>` to the page.
