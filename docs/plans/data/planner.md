# Planner — DATA-01-P5

> Read [README.md](README.md) § Conventions first. Subpath `@delacour/react-native-ui/planner`.

## Purpose on mobile

A month grid where each day shows what falls on it — a marker, an icon or two and a count — for a
training plan, a content calendar, a habit log. Tapping a day selects it and (optionally) opens its
entries. It is a viewer of entries, not a date picker: there is no range selection and no min/max.

## API

```tsx
<Planner entries={entries} categories={categories} onDayPress={(d, e) => …}>
  <Planner.Header>
    <Planner.Title />
    <Planner.Today />
    <Planner.Nav />
  </Planner.Header>
  <Planner.Grid />
  <Planner.Legend counts />
  <Planner.Details>{(date, dayEntries) => <EntryList entries={dayEntries} />}</Planner.Details>
</Planner>

<Planner variant="calendar" fill entries={…}>
  <Planner.Header>…</Planner.Header>
  <Planner.Scroller weeks={26} rowHeight={112} />
</Planner>
```

```ts
type PlannerEntry = { id: string; date: Date | string /* YYYY-MM-DD */; label: string;
  category?: string; icon?: CentralIcon; color?: string };
type PlannerCategory = { id: string; label: string } &
  ({ colorIndex?: 1 | 2 | 3 | 4 | 5 /* --chart-N */; color?: undefined } | { color: string; colorIndex?: undefined });
type PlannerVariant = "default" | "tiles" | "calendar";
type PlannerDayInfo = { date: Date; key: string; entries: readonly PlannerEntry[]; isToday: boolean;
  isInMonth: boolean; isSelected: boolean };
type PlannerDayRenderer = (info: PlannerDayInfo) => ReactNode;

type PlannerProps = ViewProps & {
  month?: Date; defaultMonth?: Date; onMonthChange?: (month: Date) => void;
  selected?: Date | null; defaultSelected?: Date | null; onSelectedChange?: (date: Date | null) => void;
  onDayPress?: (date: Date, entries: readonly PlannerEntry[]) => void;  // fires before selection
  entries?: readonly PlannerEntry[]; categories?: readonly PlannerCategory[];
  variant?: PlannerVariant; fill?: boolean; entryLimit?: number;       // default 2 (3 for calendar)
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | "auto";                    // auto: Intl.Locale weekInfo, fallback 1
  locale?: string; showOutsideDays?: boolean;                           // default true
  isFramed?: boolean;                                                   // default true: Card around it
  className?: string;
};
```

Parts: `Header`, `Title`, `Today`, `Nav`, `Action` (Button wrapper), `Grid` (`renderDay?`), `Scroller`
(`weeks`, `rowHeight`, `renderDay?`), `Day` (internal-ish, exported for custom grids), `Legend`
(`counts?`), `Summary` (month total line, inside Legend), `Footer`, `Details` (render-prop children,
`title?`, `description?`). Hook `usePlanner()` → `{ month, setMonth, selected, select, entriesByDay, … }`.

Gregorian only in v1 (record in AGENTS.md; `calendar` system prop scoped out). Dates are compared as
local-calendar `YYYY-MM-DD` keys — never by `Date` timestamp — so DST and time zones never shift an
entry to the neighbouring day.

## Behaviour

- **Grid is always 6 weeks × 7** so paging never changes height.
- **Today rings, selection fills** — two marks for two questions; both can apply to one day.
- Today recomputes at local midnight (timer to next midnight) and on `AppState` → active.
- Month nav: `Nav` prev/next buttons; also horizontal swipe on `Grid` (Gesture Handler `Pan` with
  `activeOffsetX([-20,20])`, `failOffsetY`) pages a month. Paging slides the grid ±width (Reanimated,
  220 ms); reduce motion → crossfade/instant.
- `Today` button is disabled when the displayed month is the current month.
- `Details` mounts a `BottomSheet` (existing component, `@delacour/react-native-bottom-sheet` optional
  peer) opened when `selected` is non-null; closing clears selection. No `Details` → no sheet;
  `onDayPress` still fires (push a screen instead).
- Variants: `default` = date numeral + category dot(s) + up to `entryLimit` icons + "+N";
  `tiles` = one large icon tinted by the first entry's category, date in the corner;
  `calendar` = each entry's label in a coloured block (needs height: `fill` or `Scroller`), "+N more".
- Category colour: `colorIndex` → `--chart-N` via `useThemeColor`; explicit `color` wins; entry `color`
  wins over category.
- `Scroller`: virtualised vertical list of weeks (FlatList, `getItemLayout` from `rowHeight`), ±`weeks`
  around the opening month; the header `Title` follows the month of the top visible week.

## A11y

- Each day one button: label `resolvePlannerDayLabel` → "Tuesday 14 October, 3 entries, Run, Strength"
  (+ ", today", + ", selected" state). Weekday header row hidden from AT. Legend items are text,
  dots hidden.
- Month change via `Nav` announces the new month (`AccessibilityInfo.announceForAccessibility`) only
  when the change was user-initiated and accepted (controlled parent may refuse).

## Reuses

`Card` (frame), `Button` + `Icon` (header), `Pressable` (days), `Text`, `BottomSheet` (details),
`useControllableState`, `useThemeColor`, Gesture Handler, Reanimated. No new peers. Month math is
local to this folder (see README cross-category note re Calendar).

## Pure logic (`planner.variants.ts` + `planner-dates.ts` with tests)

`toDayKey(date | string)`, `startOfMonth`, `addMonths` (clamps day 31), `resolveWeekStart(locale, prop)`,
`buildMonthGrid(month, weekStartsOn)` → 42 `{ key, date, isInMonth }`, `groupEntriesByDay(entries)`,
`resolveDayDisplay(entries, variant, entryLimit)` → `{ shown, overflow }`, `resolveEntryColor(entry,
categories)` → `{ kind: "chart"; index } | { kind: "literal"; color } | { kind: "default" }`,
`countByCategory(entries, month)`, `resolvePlannerDayLabel`, `msUntilNextMidnight(now)`,
`weekdayLabels(locale, weekStartsOn)`, `buildWeekRange(month, weeks, weekStartsOn)`. Test DST weeks
(NZ April/September), leap February, months starting on each weekday.

## Playground demos

`training-plan` (hero, capture, default), `tiles` (capture), `calendar-fill` (capture), `details-sheet`
(capture clip: tap day → sheet), `scroller`, `custom-day` (renderDay), `controlled-month`,
`week-start-sunday`.

## Docs page

`planner.mdx`: overview, entries + categories, variants, details sheet vs pushing a screen, scroller,
custom days, dates and time zones, accessibility, API.

## Acceptance

- [ ] Date math tested incl. DST, leap year, all 7 week starts; entries never shift a day
- [ ] Grid height constant across months; swipe and Nav page months; Today disabled on current month
- [ ] Today ring + selection fill coexist; today updates across midnight
- [ ] Details sheet opens on select and clears selection on close; absent `Details` → no sheet
- [ ] `calendar` variant with `fill` names entries; Scroller virtualises a year
- [ ] VoiceOver day labels with counts and categories
- [ ] Folder AGENTS.md, Components row, ITEM_META, gen-exports, registry:build, demos, docs, changeset
- [ ] `bun test`, `bun run typecheck`, `bun run check` green

## Delivery notes

- **Previews not captured (follow-up).** The argent CLI the capture script drives is not installed on
  the build machine, so `bun run previews` cannot run. Every demo carries `align: "stretch"` but no
  `capture` (a captured demo without a manifest entry fails `demos.test.ts`), and `planner.mdx` opens
  at `## Installation` with no `<Preview>`. Follow-up: restore `capture` on `training-plan` (hero),
  `tiles`, `calendar-fill`, `custom-day` and `details-sheet` (`flow: "planner/details-sheet"`,
  `frame: "device"` — the flow is already in `.argent/flows/previews/planner/`), run
  `bun run previews -- -- --only planner`, and add the `<Preview>`s back to the page.
- **Simulator verified** (warden-iphone-17, iOS 26.5, dev client): grid, today ring, legend counts;
  `Nav` and `Today` (disabled on the current month, enabled off it); a pan pages both ways; the
  details sheet opens on the pressed day with its entries, and both its close button and a swipe
  down clear the selection; day labels read "Wednesday, October 14, 3 entries, Run, Strength, Ride"
  with `selected` state; tiles, calendar `fill` and the scroller render.
- **Found on the simulator and fixed:** at the spec's 20pt `activeOffsetX` the stack's full-width back
  swipe claimed a rightward drag and popped the screen — now `PLANNER_PAN`, the `Tabs` pager's 10/14.
  A calendar day with overflow drew `entryLimit` blocks plus "+N more" and spilled into the next week
  — "+N more" now takes the last line, and the cell clips.
- **Day details** use the existing `BottomSheet`, as planned; no Overlays code. Month math is local
  to the folder; no Forms Calendar import.
