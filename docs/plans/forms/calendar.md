# Calendar

- **Status**: spec, not started
- **Wave**: 1 (independent)
- **Depends on**: Pressable, Text, Icon, Button (nav arrows), Separator; hooks `use-controllable-state`, `use-calm-motion`. No other component folder.
- **Owns the shared leaf** `components/calendar/calendar.date.ts` (CalendarDate + helpers + formatters). `date-picker` and `date-time-picker` (Wave 2) import it via `../calendar/calendar.date`, never `../calendar`.

## Purpose on mobile
An always-visible month grid for picking one day, several days or a date range. Used inline on a screen (booking, scheduling) and as the body of the `DatePicker` / `DateTimePicker` sheets. Touch-first: 44pt cells, swipe to change month, a month/year jump view instead of tiny dropdowns. Stable height: always six week rows so paging never makes the surface jump.

## Behaviour reference (summary of features observed)
- Selection modes: single day, multiple days (toggle in/out), range (two taps; a tap before the start moves the start, a tap on the selected single day clears).
- Controlled/uncontrolled selection; `onSelect` fires on every change.
- Bounds: `minDate`/`maxDate` limit selectable days; separate `startMonth`/`endMonth` limit how far the month/year jump view reaches. Disabled days by list, span, weekday or predicate.
- Visible month controlled/uncontrolled; callback on change. Outside days (previous/next month cells) shown dimmed, optionally selectable.
- Always six rows, so height and column positions never shift while paging.
- Range drawn as a continuous band, rounded only at the two ends, rows wrap cleanly at week edges.
- Header: previous / next arrows (auto-disable at bounds), caption as plain label or as month/year jump pickers that open scrolled to the current value.
- Locale-aware weekday and month names, locale-aware first day of week; "today" re-evaluated when the app returns to foreground.
- Dates compared as calendar fields (no UTC round-trips), so timezone never shifts a day.
- Optional card chrome (`bordered`).
- Out of this spec: non-Gregorian calendar systems, multi-month side-by-side.

## API

```ts
// calendar.date.ts (leaf, no react-native imports)
export type CalendarDate = { year: number; month: number /* 1-12 */; day: number /* 1-31 */ };
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
export type CalendarDateRange = { start: CalendarDate | null; end: CalendarDate | null };
export type DateMatcher =
  | { type: "date"; date: CalendarDate }
  | { type: "span"; from: CalendarDate | null; to: CalendarDate | null } // inclusive, open-ended when null
  | { type: "weekday"; days: readonly Weekday[] }
  | { type: "predicate"; test: (date: CalendarDate) => boolean };
export type CalendarCell = { date: CalendarDate; isOutside: boolean; weekIndex: number; dayIndex: number };
export type CalendarDateFormatOptions = { locale?: string; style: "short" | "medium" | "long" | "full" };
```

```ts
// calendar.types.ts
export type CalendarSelection =
  | { mode: "single"; selected?: CalendarDate | null; defaultSelected?: CalendarDate | null; onSelect?: (v: CalendarDate | null) => void }
  | { mode: "multiple"; selected?: readonly CalendarDate[]; defaultSelected?: readonly CalendarDate[]; onSelect?: (v: readonly CalendarDate[]) => void }
  | { mode: "range"; selected?: CalendarDateRange; defaultSelected?: CalendarDateRange; onSelect?: (v: CalendarDateRange) => void };

export type CalendarProps = CalendarSelection & {
  variant?: "primary" | "secondary";   // primary = filled selection; secondary = soft selection
  size?: "sm" | "md" | "lg";           // cell height / text step, matched to --spacing-input-* / --text-input-*
  minDate?: CalendarDate; maxDate?: CalendarDate;
  disabled?: readonly DateMatcher[];
  isDisabled?: boolean; isReadOnly?: boolean;
  month?: CalendarDate; defaultMonth?: CalendarDate;   // day ignored
  onMonthChange?: (month: CalendarDate) => void;
  startMonth?: CalendarDate; endMonth?: CalendarDate;  // reach of the jump view
  locale?: string;                                     // BCP 47, default device locale
  weekStartsOn?: Weekday | "auto";                     // default "auto"
  captionLayout?: "label" | "picker";                  // default "picker" (tap caption -> months/years view)
  showOutsideDays?: boolean;                           // default true
  selectOutsideDays?: boolean;                         // default false
  isBordered?: boolean;                                // default false (sheet embeds it bare); true = Surface card chrome
  swipeToPage?: boolean;                               // default true
  today?: CalendarDate;                                // override, for tests/demos
  className?: string;
  children?: ReactNode;                                // omit for the default anatomy
};
```

Context hook: `useCalendar()` returns `{ mode, variant, size, locale, weekStartsOn, visibleMonth, view: "days"|"months"|"years", setView, goToMonth(date), goPrev(), goNext(), canGoPrev, canGoNext, isDateDisabled(d), isDateSelected(d), rangeRole(d): "start"|"middle"|"end"|"only"|null, today, select(d) }` (throws outside a Calendar; `useCalendarContext()` nullable for other folders).

Anatomy (all parts optional; the root writes this when `children` is omitted):
```tsx
<Calendar mode="range" selected={range} onSelect={setRange} minDate={today}>
  <Calendar.Header>
    <Calendar.Nav direction="prev" />
    <Calendar.Caption />          {/* label, or a pressable that opens the months/years view */}
    <Calendar.Nav direction="next" />
  </Calendar.Header>
  <Calendar.Weekdays />
  <Calendar.Grid renderDay? />    {/* six rows; Day rendered per cell */}
</Calendar>
```
Parts: `Calendar.Header`, `Calendar.Nav` (`direction`, `accessibilityLabel` default "Previous month"/"Next month", localisable via `label` prop), `Calendar.Caption`, `Calendar.Weekdays`, `Calendar.Grid` (owns the swipe pan + month slide), `Calendar.Day` (`date`, children for custom content e.g. price under the number), `Calendar.Picker` (internal-but-exported: months/years view). `displayName`: `DelacourUI.Calendar`, `DelacourUI.Calendar.Header`, etc.

## Variants & sizes
- `variant`: primary (selected day `bg-primary text-primary-foreground`, range middle `bg-primary/15`-style soft band token e.g. `bg-accent text-accent-foreground`), secondary (selected `bg-secondary`, band `bg-muted`).
- `size`: sm (cell 36), md (44, default), lg (52). Cell height/text via `--spacing-input-*` / `--text-input-*` tokens; the grid is `flex` 7 equal columns.
- Today: ring `border-ring`/`text-primary` mark, never a fill. Outside days `text-muted-foreground opacity`. Slots in one `tv()`: `root, header, nav, caption, captionText, weekdays, weekday, grid, week, cell, dayBase, dayLabel, band, pickerGrid, pickerItem`. Axes include `rangeRole` (start/middle/end/only) for the band's rounding, `isSelected`, `isToday`, `isOutside`, `isDisabled`.

## States
- default; selected; range start/middle/end/only; today; outside; disabled (dimmed, not pressable, `accessibilityState.disabled`); pressed (Pressable `fade`, no scale on the band cells); focused n/a (touch) — screen-reader focus ring only.
- Calendar `isDisabled`: everything inert, 0.5 opacity. `isReadOnly`: selection shown, taps do nothing, nav still works.
- Field cascade: `useFieldContext()` -> `isDisabled ?? field.isDisabled`; `isInvalid` tints the selected/range band `destructive` (nearest-wins `??` chain). Calendar does not call `registerPress` (no single focus target); it does read `field.label` for the grid `accessibilityLabel`.
- Empty: no selection is a valid state (`null` / `[]` / `{start:null,end:null}`).
- Loading: none.

## Accessibility
- Grid: `accessibilityRole="grid"`; each Day `accessibilityRole="button"`, label = long formatted date ("Monday 5 October 2026"), plus today/selected/range-start/range-end hints, `accessibilityState={{ selected, disabled }}`.
- Nav buttons labelled and `disabled` at bounds; caption announces "October 2026, button, opens month and year picker".
- Month change announced via `AccessibilityInfo.announceForAccessibility(<month year>)`.
- Weekday header `accessibilityElementsHidden` duplicates avoided: header cells use full name as label, short text visually.
- Adjustable action on the Grid (`increment`/`decrement`) moves by month for VoiceOver/TalkBack users.
- 44pt minimum target at `md`/`lg`; `sm` adds `hitSlop`.

## Motion & haptics
- Month paging: Gesture Pan on `Calendar.Grid` + Reanimated `translateX` slide, spring settle; the page change itself is behavioural and always happens; when `useCalmMotion()` is true the slide is replaced by an instant swap.
- Range band: no animation on fill (instant), end-cap rounding only. Today ring none.
- Haptics (Pulsar worklet presets): `Presets.System.selection` on day select and on month page; `impactLight` on reaching a bound (nav disabled swipe).
- Months/years view: crossfade with the grid, scrolls to current value on open (`scrollToIndex`, `initialScrollIndex`).

## Reuses / new internal pieces / peer deps
- Reuses `Pressable` (day, nav, caption), `Button` (variant `ghost`, size `icon-sm` for nav), `Text`, `Icon` (`IconChevronLeft/Right`, `IconChevronDownSmall` from `icons/central`), `Surface` when `isBordered`, `useControllableState` (selection, month), `useFieldContext` (leaf `../field/field.context`), `useCalmMotion`.
- New: `calendar.date.ts` leaf (below), month slide pan, months/years picker view.
- **Peer deps: none new.** Uses Gesture Handler, Reanimated, Pulsar already peers.

## Files
`packages/react-native-ui/src/components/calendar/`
| File | Holds |
| --- | --- |
| `index.ts` | public entry `@delacour/react-native-ui/calendar`; also re-exports date helpers/types |
| `calendar.tsx` | root, state, `Object.assign` surface, `displayName "DelacourUI.Calendar"` |
| `calendar-header.tsx`, `calendar-nav.tsx`, `calendar-caption.tsx` | header parts |
| `calendar-weekdays.tsx`, `calendar-grid.tsx`, `calendar-day.tsx`, `calendar-picker.tsx` | body parts |
| `calendar.context.tsx` | `CalendarContext`, `useCalendar()`, `useCalendarContext()`, `useCalendarPart()` |
| `calendar.types.ts` | prop unions above |
| `calendar.date.ts` | **shared leaf**, pure date math + formatters |
| `calendar.date.test.ts` | exhaustive tests |
| `calendar.variants.ts` / `.variants.test.ts` | slotted `tv()` + resolvers (`resolveRangeRole`, `resolveDayState`), tokens exist in both themes |
| `AGENTS.md` | design notes + file map; row added to package `AGENTS.md` Components table |
Plus the repo-wide checklist: `bun run gen-exports`; playground `apps/playground/src/demos/calendar/`, route `src/app/(components)/calendar.tsx`, row in `src/app/index.tsx`, `bun run gen-demos`; docs `apps/web/content/docs/native/components/calendar.mdx` + meta.json; registry `ITEM_META` in `packages/cli/src/registry/config.ts` then `bun --filter delacour run registry:build`; changeset (minor on `@delacour/react-native-ui` and `delacour`).

## Pure logic to unit-test (`calendar.date.test.ts`, `calendar.variants.test.ts`)
Functions: `isValidDate`, `compareDates`, `isSameDay`, `isSameMonth`, `isBetween(d, a, b)` (inclusive), `daysInMonth(y, m)`, `isLeapYear`, `weekdayOf(d)` (Sakamoto/Zeller, no `Date`), `addDays`, `addMonths` (clamps day: 31 Jan + 1 month = 28/29 Feb), `addYears`, `startOfMonth`, `clampDate(d, min, max)`, `monthGrid(month, weekStartsOn): CalendarCell[][]` (always 6x7), `toDate`/`fromDate` (native `Date` <-> CalendarDate using local fields), `today()`, `matchesDisabled(d, matchers)`, `isDateDisabled(d, {minDate, maxDate, disabled})`, `normaliseRange(a, b)` (swap if end < start), `applyRangeTap(range, d)` -> next range, `toggleMultiple(list, d)` (sorted, dedup), `resolveWeekStart(locale)`, `weekdayLabels(locale, weekStartsOn, "narrow"|"short"|"long")`, `monthNames(locale)`, `formatDate(d, {locale, style})`, `formatMonthYear`, `formatDateRange`, `serialiseDate` / `parseDate` (ISO `YYYY-MM-DD`, strict).
Cases:
- `daysInMonth`: Feb 2024=29, Feb 2100=28, Feb 2000=29, Apr=30.
- `weekdayOf({2026,10,5})` = 1 (Monday); 2000-01-01 = 6.
- `addMonths(31 Jan 2026, 1)` = 28 Feb; `addMonths(15 Mar, -3)` crosses year; `addDays` across month/year/leap boundaries, negative n.
- `monthGrid` for Oct 2026 weekStart 0 and 1: 6 rows, row 0 begins with correct leading days, `isOutside` flags, month starting on first column still renders a full leading week? (No: starts at that column; 6th row is trailing days.) Feb 2026 (starts Sunday, 28 days) = exactly 4 inside rows + 2 outside rows.
- `applyRangeTap`: empty -> {d,null}; start only + later d -> complete; start only + earlier d -> start moves; start only + same d -> single-day range; complete + tap -> restart {d,null}; tap on a disabled-spanning range rejected by caller predicate (`rangeContainsDisabled`).
- `isDateDisabled`: min/max inclusive, weekday matcher, span open-ended, predicate.
- `resolveWeekStart("en-US")=0`, `("en-NZ")=1`, `("de-DE")=1`, `("ar-EG")=6`, unknown -> 1. Prefer `Intl.Locale#getWeekInfo`/`weekInfo` when present, table fallback.
- Formatters: `formatDate` with `en-NZ`/`medium` contains "Oct" and "2026"; locale `ja-JP` differs; never throws on an invalid locale (falls back to `en`).
- Variants test: every token a slot names exists in light and dark themes; `rangeRole` rounding table (start rounds left only, end right only, only both, middle none); selected cell never carries `rounded-none` for `only`; text slots carry no colour on the parent.

## Playground demos (`apps/playground/src/demos/calendar/`)
`single` (capture, **hero**), `range` (capture), `multiple` (capture), `bounds-and-disabled` (min/max, weekends disabled; capture), `sizes-variants` (capture), `bordered-in-card` (no capture), `locale-week-start` (switch en-NZ/en-US/ar; no capture). 4-6 captured, one hero.

## Docs page outline (`calendar.mdx`)
Intro and import; Usage (single); Range; Multiple; Min/max & disabled matchers; Controlled month; Caption layouts; Sizes & variants; Custom day content; Locale & week start; In a `Field`; Accessibility; API tables (root, each part, `useCalendar`); Date helpers reference (`CalendarDate`, helpers) and a note that no date library is needed.

## Out of scope / follow-ups
- Non-Gregorian calendars, multi-month side-by-side, week numbers, time zones (a CalendarDate has none by design), drag-to-select ranges, year-only/month-only mode.
- Anchored popover presentation lives in DatePicker, not here.
- Open question: `Intl.Locale#getWeekInfo` support in Hermes — verify on device; table fallback ships regardless.
- Open question: should `calendar.date.ts` formatters live in a second leaf (`calendar.format.ts`) so the math file stays tiny? Default: single file as per category decision.

## Acceptance checklist
- [ ] `calendar.date.ts` has no react-native imports and is fully covered by `bun test`.
- [ ] Grid always renders 6 rows; height identical across all months in the playground.
- [ ] Single, multiple, range behave per rules above; band rounding correct at week wraps.
- [ ] min/max/disabled matchers respected; nav disabled at bounds.
- [ ] Controlled and uncontrolled for both selection and month.
- [ ] Field cascade (isDisabled/isInvalid, label) verified.
- [ ] VoiceOver/TalkBack: grid/day labels, adjustable month action verified on simulator.
- [ ] Swipe paging and months/years view verified on iOS simulator; calm motion removes the slide.
- [ ] Every part has a `DelacourUI.` displayName; `display-name.test.ts` and `docs.test.ts` pass.
- [ ] AGENTS.md, package table row, gen-exports, demos + gen-demos, docs mdx + meta.json, registry entry + build, changeset done.
- [ ] No comments inside JSX; no `any`; semantic tokens only.
