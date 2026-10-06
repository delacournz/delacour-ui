# Calendar

An always-visible month grid for picking one day, several days or a range. Compound root plus
`Calendar.Header`, `Calendar.Nav`, `Calendar.Caption`, `Calendar.Weekdays`, `Calendar.Grid`,
`Calendar.Day` and `Calendar.Picker`. Used inline on a screen, and as the body of the date pickers'
sheets.

`import { Calendar } from "@delacour/react-native-ui/calendar";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/calendar`; also re-exports every date helper and type |
| `calendar.tsx` | Root: selection and month state, bounds, the context value, the `Object.assign` surface |
| `calendar-header.tsx` | `Calendar.Header` — prev arrow, caption, next arrow by default |
| `calendar-nav.tsx` | `Calendar.Nav` — a ghost `Button` that disables itself at a bound |
| `calendar-caption.tsx` | `Calendar.Caption` — label, or the button that cycles days → months → years |
| `calendar-weekdays.tsx` | `Calendar.Weekdays` — short names shown, full names spoken |
| `calendar-grid.tsx` | `Calendar.Grid` — six weeks, the paging pan and slide, hosts the picker |
| `calendar-day.tsx` | `Calendar.Day` — one cell: band, circle, number or custom content |
| `calendar-picker.tsx` | `Calendar.Picker` — the months and years jump views |
| `calendar.context.tsx` | `CalendarContext`, `useCalendar()`, `useCalendarContext()`, `useCalendarPart()` |
| `calendar.types.ts` | `CalendarSelection` (the mode union), `CalendarProps`, `CalendarCaptionLayout` |
| `calendar.date.ts` | **Shared leaf.** `CalendarDate` maths, matchers, grid, selection rules, `Intl` formatters. No React Native |
| `calendar.date.test.ts` | |
| `calendar.variants.ts` | Slotted `tv()`, the day-state, range-role, bounds, axes and page-direction resolvers |
| `calendar.variants.test.ts` | |

## The date leaf

- **A day is `{ year, month, day }` and nothing else.** No `Date`, no time zone, no UTC
  round-trip — a `Date` built at midnight in Auckland is the previous day in UTC, and that is the
  bug every calendar built on `Date` ships once. `toDate`/`fromDate` cross over by **local**
  fields, at the edge only.
- **`weekdayOf` is Sakamoto's method**, not `new Date().getDay()`, so the leaf never touches the
  device clock or zone. A test checks it against the platform for every day of a leap year.
- **`calendar.date.ts` is the only module another folder may import from here.** `date-picker`
  and `date-time-picker` reach `../calendar/calendar.date` — never `../calendar`, which would pull
  the whole compound in (package rule 3).
- **`resolveWeekStart` prefers `Intl.Locale#getWeekInfo`/`weekInfo`** and falls back to a region
  table, because Hermes support for either is not guaranteed. Unknown is Monday (ISO 8601).
- **Formatters never throw.** An unknown locale falls back to `en`; a formatter that throws inside
  render takes the screen down for a typo.
- **`parseDate` is strict** — `YYYY-MM-DD` and a real day, or `null`. A lenient parser turns
  `2026-02-31` into 3 March, which is a different booking.

## Selection

- **`mode` is the discriminant** of `CalendarSelection`, so `selected` and `onSelect` are typed for
  the mode named. Internally one `CalendarSelectionState` union flows through
  `useControllableState`, and `emitSelection` narrows back to the caller's shape.
- **Single:** a tap on the selected day clears it. **Multiple:** toggles; always sorted, deduped.
- **Range** (`applyRangeTap`): empty → start; start + any day → complete, in either direction,
  with the earlier day as `start` (`normaliseRange`); complete + tap → a new start. Backwards
  completes rather than moving the start, because tapping check-out first is as common as
  check-in first and a tap that silently discards the first one reads as a bug. A range that would contain a disabled day
  (`rangeContainsDisabled`) restarts at the tapped day instead of completing — a stay that spans a
  closed night is not bookable, and silently accepting it is worse than making the user tap again.
- **Disabled vs read-only.** `isDisabled` makes everything inert and fades the root. `isReadOnly`
  ignores day taps and leaves paging working — looking at another month changes nothing.

## Layout

- **Always six weeks** (`CALENDAR_WEEKS`). A month that fits in four or five rows still draws six,
  so height and column positions never shift while paging. An outside day with
  `showOutsideDays={false}` is an empty cell of the same height, never a missing one.
- **The whole cell is the target**, not the circle. A column on a phone is wider than the circle
  is tall, and the gap belongs to whichever day it sits beside.
- **The cell is on the input scale** (`h-input-*`, `size-input-*`, `text-input-*`): sm 36, md 44,
  lg 52. `md` and `lg` meet 44pt.
- **The jump view sits over the grid** (`absolute inset-0`) while the weeks are hidden with
  `opacity-0`, not unmounted, so opening it never changes the calendar's height. The weekday row
  hides the same way.

## Drawing

- **A day is three layers:** `band` (absolute, edge to edge, behind), `dayBase` (the circle) and
  the label. The band spans the full cell so adjacent days join into one strip.
- **The band ends at the centre of each end cell, and the circle is the cap.** Start runs from its
  cell's centre to the right edge, end from the left edge to its centre, middle spans the cell; none
  is rounded. A cell is wider than its circle, so the first version — a band rounded across the
  whole end cell — showed a crescent of band beside the circle at both ends. A lone `only` day
  draws no band. At a week's edge the strip simply stops and resumes on the next row.
- **Today is a ring (`border-ring`) and `text-primary`, never a fill**, so it cannot be mistaken
  for a selection.
- **Variant:** `primary` fills `bg-primary`, band `bg-primary/15`; `secondary` fills
  `bg-secondary`, band `bg-muted`. The primary band is a tint of the selection colour, not
  `bg-accent`: light `--accent` is 0.97 on a 0.985 page, so the band all but vanished in light
  while reading fine in dark. A tint of `primary` reads in both themes and joins the end caps
  as one shape. `isInvalid` overrides both with `bg-destructive` / `bg-destructive-soft`.
- **Colour is on the text slots only** (rule 1): `dayLabel`, `weekdayLabel`, `captionText`,
  `pickerItemLabel`. A test holds every `View` slot to carrying no `text-*` colour.
- **Custom day content** gets `labelClassName` in its render props, so a price under the number
  takes the selected colour with it rather than reimplementing the tone table.

## Paging

- **A Gesture Handler pan on `Calendar.Grid`**, `activeOffsetX` ±12 and `failOffsetY` ±12: it
  claims a sideways drag and gives up a vertical one, so the calendar lives inside a `ScrollView`
  or a sheet without stealing its scroll.
- **`resolvePageDirection` is pure and tested.** A quarter of the width, or a release faster than
  500 pt/s, pages; a flick against the drag settles back; it never pages past a bound or on an
  unmeasured grid.
- **Slide out, swap, slide in.** The old month slides off, the month changes on the JS thread, and
  the new one slides in from the opposite side — the same entrance the arrows give. The grid
  clips (`overflow-hidden`) so the swap frame is never seen.
- **Calm motion skips both slides.** The page change is behaviour and always happens.
- **A drag toward a bound resists** (20% travel) and settles back with a `light` haptic — the edge
  is felt rather than the month silently refusing to turn.
- **Tapping an outside day** (with `selectOutsideDays`) selects it and pages to its month.

## Accessibility

- Each day is a button labelled with the full date (`formatDate(…, { style: "full" })`), hinted
  "Today" / "Range start" / "Range end", with `selected` and `disabled` state.
- The grid is `role="grid"`, named by an enclosing `Field.Label` or else the month.
- **Paging for screen readers lives on the caption**, as increment/decrement actions. An
  adjustable grid would fold its child buttons into itself on both platforms and make the days
  unreachable.
- A month change is announced with `AccessibilityInfo.announceForAccessibility` — on change only,
  never on mount, because the caption already says it.
- Today is re-read on `AppState` → `active`, so a calendar left open overnight marks the right day.

- **Parts derive their `testID` from the root's** (`resolvePartTestID`): `testID="booking"`
  names the days `booking-day-2026-10-05`, the arrows `booking-prev`/`booking-next`, the caption
  `booking-caption` and the jump-view items `booking-month-10`/`booking-year-2026`. The default
  anatomy renders forty-odd parts no caller writes, and an end-to-end test or a recorded preview
  flow has to reach one particular day all the same. No root `testID`, no part ids.

## Field

`resolveCalendarAxes` is the nearest-wins chain: the calendar's own `isDisabled` / `isInvalid` /
`isReadOnly` / `size` / `variant`, else the `Field`'s. The field's label names the grid. It does
not `registerPress` — there is no single focus target for a row tap to reach.

## Not here

Non-Gregorian calendars, side-by-side months, week numbers, drag-to-select ranges, time. The
anchored presentation belongs to `DatePicker`.
