# Planner

A month of days, each showing what falls on it — a training plan, a content
calendar, a habit log. Entries are dated and categorised; a day draws a marker,
an icon or two and a count, or in the `calendar` variant each entry's name.
Pressing a day selects it and, with `Details`, opens a sheet of its entries.
It is a **viewer** of entries, not a date picker: no range, no min or max.

`import { Planner } from "@delacour/react-native-ui/planner";`

Compound root plus twelve parts: `Header`, `Title`, `Today`, `Nav`, `Action`,
`Grid`, `Scroller`, `Day`, `Legend`, `Summary`, `Footer`, `Details`; and
`usePlanner()`.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/planner` |
| `planner.tsx` | Root — month and selection state, the pending-page request, the announcement — and the `Object.assign` surface |
| `planner-header.tsx` | `Planner.Header` |
| `planner-title.tsx` | `Planner.Title` — the month's name, a heading |
| `planner-today.tsx` | `Planner.Today` — disabled on the current month |
| `planner-nav.tsx` | `Planner.Nav` — previous and next |
| `planner-action.tsx` | `Planner.Action` — a ghost icon `Button` |
| `planner-grid.tsx` | `Planner.Grid` — six weeks, the swipe and the slide |
| `planner-scroller.tsx` | `Planner.Scroller` — a `FlatList` of weeks |
| `planner-weekdays.tsx` | The weekday row the grid and the scroller draw. Internal |
| `planner-day.tsx` | `Planner.Day`, and the internal content, dot and block it draws |
| `planner-legend.tsx` | `Planner.Legend` |
| `planner-summary.tsx` | `Planner.Summary` |
| `planner-footer.tsx` | `Planner.Footer` |
| `planner-details.tsx` | `Planner.Details` — a `BottomSheet` |
| `use-planner-today.ts` | `usePlannerToday()` — today, moved at midnight and on foreground |
| `planner.context.tsx` | `PlannerProvider`, `usePlanner()`, `usePlannerContext()`, `usePlannerPart()` |
| `planner.types.ts` | `PlannerEntry`, `PlannerCategory`, `PlannerDayInfo`, `PlannerDayRenderer`, `PlannerSlotProps` |
| `planner-dates.ts` | The month math — day keys, the grid, the week range, week start, names, the midnight timer. No RN imports |
| `planner-dates.test.ts` | |
| `planner.variants.ts` | The slotted `tv()` and every pure resolver — grouping, overflow, colour, counts, labels, swipe. No RN imports |
| `planner.variants.test.ts` | |

## Anatomy

```tsx
<Planner entries categories variant? fill? month? selected? onDayPress? weekStartsOn? locale? isFramed?>
  <Planner.Header>
    <Planner.Title />
    <Planner.Today />
    <Planner.Nav />
    <Planner.Action />
  </Planner.Header>
  <Planner.Grid renderDay? />          | <Planner.Scroller weeks? rowHeight? renderDay? />
  <Planner.Legend counts?>
    <Planner.Summary />
  </Planner.Legend>
  <Planner.Footer />
  <Planner.Details title? description?>{(date, entries) => …}</Planner.Details>
</Planner>
```

## Design

- **A day is a `YYYY-MM-DD` key, never a timestamp.** `toDayKey` reads a
  `Date`'s local year, month and day, and takes a string as written —
  `new Date("2026-04-05")` is UTC midnight, the 4th anywhere west of
  Greenwich. Every step (`addDays`, `addMonths`, `startOfWeek`) goes through
  the `Date` constructor's fields, which the runtime normalises in local time.
  Arithmetic in milliseconds is a day that is 23 or 25 hours long twice a year,
  and an entry on the neighbouring day. The tests run in `Pacific/Auckland`
  across both of its daylight-saving nights.
- **A malformed date string throws.** `"14/10/2026"` or `"2026-02-30"` would
  otherwise land on a guess — or on no day at all, silently.
- **Gregorian only.** The math, the grid and the names assume it. A `calendar`
  system prop is out of scope for v1; `Intl` already formats the names in the
  locale, which covers the language but not the calendar.
- **The month math is this folder's own.** No calendar primitive exists in the
  library yet. When a date picker lands, the shared math moves to `src/lib/`
  in a follow-up rather than this waiting on it.
- **The grid is always six weeks.** `buildMonthGrid` returns 42 days whatever
  the month, and each variant fixes a week's height — `h-16`, a square tile,
  a 96pt floor — so paging between a four-week February and a six-week month
  never moves anything below the planner. `fill` trades the fixed heights for
  an equal share of whatever the planner is given.
- **Today rings, selection fills.** Two marks for two questions: a 2pt
  `primary` ring on today's marker, a `primary` fill inside it for the
  selection, so a selected today shows both. The ring is always drawn,
  transparent when it is not today, so a day becoming today at midnight does
  not shift its numeral. A tile takes the same pair on its border and fill.
- **Today moves at midnight.** `usePlannerToday` arms a timer for the next
  local midnight — measured to that midnight, not `now + 24h` — and re-arms it
  each time. A suspended app runs no timers, so returning to the foreground
  re-reads the clock too.
- **`Today` is disabled on the current month.** A control that does nothing
  when pressed says so before it is pressed.
- **A month change is a request, and only an accepted one animates or
  speaks.** `navigate` records `{ key, direction, origin }` in a ref and asks
  for the month. The grid's effect slides the new month in from that side when
  the month with that key arrives, and the root's effect then announces it and
  clears the request. A controlled parent that refuses the change never
  delivers the key, so nothing slides and VoiceOver is not told about a month
  it is not looking at. The parts' effects run before the root's, which is
  what lets the grid read the direction before it is cleared.
- **The swipe claims sideways fingers only.** `activeOffsetX([-20, 20])` and
  `failOffsetY([-12, 12])`: a vertical scroll around the planner keeps its
  scroll, and a tap on a day is still a tap. On release the grid always
  settles back; an accepted month replaces that with its own slide, and a
  refused one leaves nothing half off-screen. `resolveSwipePage` decides —
  a quarter of the width, or a flick that is not flicking back — on the JS
  thread, because a helper called from a worklet is not captured into it (see
  [Pressable](../pressable/AGENTS.md)). `isSwipeEnabled={false}` for a grid
  inside a horizontal pager.
- **Reduce motion crossfades.** The slide is replaced by a 150 ms fade, and a
  drag no longer moves the grid under the finger; the swipe still pages.
- **Each day is one button with one label.** "Wednesday, 14 October,
  3 entries, Run, Strength", plus ", today". Each category is said once, in
  the order it appears; an uncategorised entry is named by its own label.
  Selection is the button's `selected` state rather than words in the label,
  so the screen reader says it in its own voice. The weekday row is hidden: the
  day labels already carry the weekday, and seven bare stops before the month
  would be read first. Dots are hidden; a legend row is one text element.
- **`renderDay` replaces the content, never the button.** The planner keeps
  the `Pressable`, the label and the state, so a custom day cannot forget to
  be accessible or selectable.
- **Colour has an order: entry `color`, category `color`, category
  `colorIndex`, then `primary`.** `resolveEntryColor` returns a discriminated
  union — `chart`, `literal`, `default` — because the three are painted
  differently: a chart slot is a class written out per index (Tailwind cannot
  see `bg-chart-${n}`), a literal is a style. An `Icon` takes either through
  `entryColorToken`.
- **A literal colour never fills behind text.** A `calendar` block of a theme
  colour is a 15% tint behind foreground text, which reads in both themes. A
  literal cannot be tinted without parsing it, so its block is `bg-muted` with
  a 3pt bar of the colour on the leading edge — never text on a fill whose
  contrast nobody checked.
- **A tile has room for one icon.** `resolveDayDisplay` shows the first entry
  on a tile whatever `entryLimit` says, and the rest are "+N". `default` draws
  a dot per distinct colour (up to three) and up to `entryLimit` icons;
  `calendar` draws up to `entryLimit` blocks — three by default — then
  "+N more".
- **Pressing a selected day clears it.** Without `Details` there is otherwise
  no way back to no selection. `onDayPress` fires first, every time, with the
  day's entries — the hook for pushing a screen instead of opening a sheet.
- **`Details` is the selection, not a second state.** The sheet is open while
  a day is selected, and closing it by any route clears the selection. It keeps
  drawing the last day while it closes, so the content does not empty out from
  under the animation. No `Details`, no sheet.
- **`Details` is a `BottomSheet`, so this subpath resolves the sheet engine.**
  `@delacour/react-native-bottom-sheet` is an optional peer of the library, and
  importing `planner` pulls it in through `bottom-sheet`. An app using the
  planner mounts `BottomSheetProvider` once, as it would for any sheet.
- **The scroller is virtualised by a fixed row height.** `getItemLayout` from
  `rowHeight` places any week without rendering the ones before it, so ±26
  weeks — a year — costs a screenful of views and `initialScrollIndex` lands
  on the opening month directly. The range is built once from the month the
  planner opened on; rebuilding it as the month followed the scroll would jump
  the list under the finger.
- **The scroller drives the month.** The top visible week's month — the month
  holding its fourth day, so most of its days — becomes the planner's month,
  with origin `scroll`: `Title` follows, `onMonthChange` fires, nothing is
  announced. `Nav` and `Today` scroll the list to the week holding the 1st, or
  today.
- **`weekStartsOn="auto"` asks the locale.** `Intl.Locale`'s week info — a
  method on newer engines, a getter on older ones, Sunday counted as 7 — and
  Monday when the runtime cannot say.
- **Framed by default, on `Card`.** The header, legend and footer take the
  card's 16pt inset; the grid takes 8pt so the days are as wide as they can be.
  `isFramed={false}` drops the card and the insets for a planner that is the
  whole screen.
- **No text treatment on a view slot** (rule 1). The tests assert it across
  every combination, and that every colour token a slot names exists in both
  themes.
