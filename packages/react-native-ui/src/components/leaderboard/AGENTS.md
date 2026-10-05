# Leaderboard

Ranked people or teams with the top three on a podium — a fitness challenge, a
sales board, a game's scores. Data-driven: one root that takes `data` and draws
everything, with internal parts `Podium`, `PodiumPlace`, `Row`, `Movement` and
`Empty` that are not exported as slots.

`import { Leaderboard } from "@delacour/react-native-ui/leaderboard";`

```tsx
<Leaderboard data={entries} highlightId={me} limit={10} onPressEntry={open} unit="points" />
<Leaderboard data={laps} formatValue={formatLapTime} order="asc" podium="cards" unit="seconds" />
<Leaderboard data={entries} renderMedia={(entry) => <Avatar name={entry.name} size="sm" />} />
```

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/leaderboard` |
| `leaderboard.tsx` | Root — ranks, cuts, splits, pins; the `Object.assign` that names it |
| `leaderboard-podium.tsx` | `DelacourUI.Leaderboard.Podium` — the top three in visual order 2-1-3 |
| `leaderboard-podium-place.tsx` | `DelacourUI.Leaderboard.PodiumPlace` — a growing bar or a lifted card, plus the internal `Bar` |
| `leaderboard-row.tsx` | `DelacourUI.Leaderboard.Row` — rank, media, name, movement, value |
| `leaderboard-movement.tsx` | `DelacourUI.Leaderboard.Movement` — ▲ / ▼ / – and the places |
| `leaderboard-empty.tsx` | `DelacourUI.Leaderboard.Empty` — the no-entries line, on `EmptyState` |
| `leaderboard.context.tsx` | `LeaderboardProvider`, `useLeaderboardPart()` — internal, not exported |
| `leaderboard.types.ts` | `LeaderboardEntry`, `RankedEntry` |
| `leaderboard.variants.ts` | The slotted `tv()` and every pure resolver — no RN imports |
| `leaderboard.variants.test.ts` | |

## Design

- **The board ranks; the caller does not.** Entries arrive in any order.
  `rankLeaderboard` sorts stably by value and gives standard competition ranks
  — `1, 2, 2, 4` — so a caller cannot hand in a rank that disagrees with the
  values beside it. Ties keep input order, which is the caller's tiebreak if
  they have one: sort by it before passing `data`.
- **The podium is the first three positions, not the first three ranks.** A
  four-way tie for first puts three on the podium and the fourth, still ranked
  1, at the head of the rows. Splitting by rank would draw a podium of one, or
  of seven. Tone and bar height follow the **rank**, so tied leaders share the
  first tone and stand level.
- **A podium needs three entries on show.** With fewer — or a `limit` under
  three — `resolveLeaderboardPodium` falls back to `none`. A two-step podium
  with a hole where third should be reads as a bug.
- **Primary at 100 / 70 / 45 percent, never gold, silver and bronze.** The
  number on each place already says the place, and three metals would be the
  one palette on the screen no theme can retune. The tones are classes on the
  `place` axis, written out because Tailwind's scanner cannot see a class built
  at runtime.
- **`value` bars are proportional with a 35 % floor; `asc` forces `rank`.** On
  a lap-time board smaller is better, so a value-proportional bar would draw the
  winner shortest and invert the podium's meaning. The floor keeps a third far
  behind visible as a bar rather than a sliver. A leader at zero or below has
  nothing to be proportional to and falls back to `rank`.
- **Bars grow on mount, third → second → first, 80 ms apart, 500 ms ease-out.**
  The reveal ends on the winner. Height is animated rather than `scaleY`, which
  would squash the rank number inside the bar; three views make the layout cost
  negligible. With reduce motion on, the bar is seeded at its full height and
  never animates. Rows do not animate at all — a list that slides in on every
  data change is noise.
- **`limit` counts the podium.** `limit={10}` is a top ten, not a podium and ten
  more rows. Cut entries are not drawn; if `highlightId` is among them it is
  pinned after a "…" with its **true** rank — someone fourteenth is told they
  are fourteenth. A highlight already on show is not pinned twice.
- **The "…" separator is hidden from assistive technology.** The pinned row's
  label already opens with its rank, so the gap would be an unlabelled stop.
- **One element per place, one sentence per element.**
  `resolveLeaderboardAccessibilityLabel` gives "Rank 2, tied, Aroha, 1,240
  points, up 3 places", so VoiceOver reads a place in a single stop rather than
  five. With `onPressEntry` each place is a `Pressable`, announced as a button;
  without, it is a plain view, so a board nobody can tap does not pretend to be
  a list of buttons. `unit` is what makes the number a score — leaving it off
  is allowed, but the label is then a bare number.
- **The movement column is all or nothing.** `hasMovementColumn` shows it when
  any entry has a `change`; an entry without one still reserves the width, so
  every value lines up. ▲ is `success-soft-foreground`, ▼ is `destructive`,
  `0` is a muted dash. The glyph's token sits in `LEADERBOARD_MOVEMENT_COLOR`
  beside the text class, and a test holds the two together.
- **The highlighted row is `primary` at 10 % with the name in `Text.Strong`.**
  Found at a glance without a second accent fighting the podium. On a `cards`
  podium the highlighted card takes a `primary` hairline instead.
- **Rank and value are `tabular-nums`, the rank column a fixed `w-8`.** Names
  line up down the board and values down their edge whatever the digits.
- **Media is a render prop, not an import.** `renderMedia` receives the entry
  and its rank, so an `Avatar`, a flag or a team crest is the caller's choice
  and this folder takes no dependency on any of them.
- **The parts are internal in v1.** The board is a data view whose value is the
  ranking, cutting and pinning it does for the caller; exposing `Row` or
  `Podium` as slots would hand that logic back to every call site and freeze
  the parts' props as public API before anyone has asked to recompose them.
  The pure resolvers *are* exported, so a caller who needs a bespoke layout
  can rank with `rankLeaderboard` and draw their own.
- **Empty data is `EmptyState` at `sm`, description only.** A board is usually
  one section of a screen, so there is no picture and no action; `emptyText`
  changes the line.
- **Not virtualised.** Rows are plain views; pass `limit` for a long board.
- **No text treatment on a view slot** (rule 1). The tests assert it across
  every combination.
