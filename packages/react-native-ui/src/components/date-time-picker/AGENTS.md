# DateTimePicker

One field for "when": a date and a time of day decided together, in one sheet with one Done.
Compound root plus `DateTimePicker.Trigger`, `DateTimePicker.Value`, `DateTimePicker.Icon`,
`DateTimePicker.Content`, `DateTimePicker.Calendar`, `DateTimePicker.Time`, `DateTimePicker.Done`
and `DateTimePicker.Clear`, and `useDateTimePicker()` for a custom part.

`import { DateTimePicker } from "@delacour/react-native-ui/date-time-picker";`

The subpath imports `BottomSheet`, so an app using it installs the optional
`@delacour/react-native-bottom-sheet` peer and mounts `BottomSheetProvider` once — including for
`presentation="inline"`, which never opens a sheet. That is the category's decision 5
(`docs/plans/forms/README.md`), the same as `DatePicker` and `TimePicker`.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/date-time-picker` |
| `date-time-picker.tsx` | Root: value and open state, `setDate`/`setTime`, the active tab and auto-advance, Done's announcement, the `Field` press, the context value, the `Object.assign` surface |
| `date-time-picker-trigger.tsx` | `DateTimePicker.Trigger` — a `Pressable` wearing `DatePicker`'s trigger box; `Value` + `Icon` by default |
| `date-time-picker-value.tsx` | `DateTimePicker.Value` — the formatted value or the placeholder |
| `date-time-picker-icon.tsx` | `DateTimePicker.Icon` — `IconCalendarClock`, muted or destructive |
| `date-time-picker-content.tsx` | `DateTimePicker.Content` — the sheet (scrim, close, title, panel, pinned footer) or the inline card; the `tabs` layout and the child walk that fills it |
| `date-time-picker-calendar.tsx` | `DateTimePicker.Calendar` — a single-day `Calendar` bound to `setDate` |
| `date-time-picker-time.tsx` | `DateTimePicker.Time` — a readout row over `TimePickerWheel`; in `stacked`, a hairline and a row that opens the wheel |
| `date-time-picker-done.tsx` | `DateTimePicker.Done` — announces and closes |
| `date-time-picker-clear.tsx` | `DateTimePicker.Clear` — `null`, reported, stays open |
| `date-time-picker.context.tsx` | `DateTimePickerProvider`, `useDateTimePicker()`, `useDateTimePickerContext()`, `useDateTimePickerPart()` |
| `date-time-picker.types.ts` | `DateTimePickerProps` |
| `date-time-picker.value.ts` | **Pure** `DateTimeValue` helpers: order, window, either-order completion, native `Date`, format, ISO |
| `date-time-picker.value.test.ts` | |
| `date-time-picker.variants.ts` | Slotted `tv()` for the panel, the layout constants, and the pure display, a11y and auto-advance rules |
| `date-time-picker.variants.test.ts` | |

## Imports, never duplicates

- **Every day sum is `calendar.date`'s and every minute sum is `time-picker.time`'s.**
  `date-time-picker.value.ts` imports both leaves and adds only what neither can answer alone: the
  order of two date-times, and how a bound on one day becomes a bound on that day's clock. The one
  piece of arithmetic it owns is rounding *up* onto the step (`ceilToStep`) — the time leaf rounds
  to the nearest, which is right for a wheel and wrong for "now" (see below).
- **The calendar is `Calendar` from `../calendar`, the wheel is `TimePickerWheel` from
  `../time-picker`.** Both index imports, the house norm (category decision 4). Neither is wrapped
  in its own picker: the bare wheel takes a value and reports settles, which is exactly the shape a
  second picker composes.
- **The trigger is `DatePicker`'s, through its variants leaf.** `resolveDatePickerTriggerClass`
  (itself `Input`'s box), `resolveTriggerState`, `resolveDatePickerAxes`, the `value` and `icon`
  slots and `resolveDatePickerIconColor` all come from `../date-picker/date-picker.variants`, so a
  date field and a date-and-time field beside it are one box at every size, variant and state.
  The part files are thin because there is nothing left for them to decide.

## The value

- **Whole or `null`, never half.** `{ date: CalendarDate; time: TimeValue }`, wall-clock with no
  zone. A partial value would make every caller handle "a date but no time" everywhere they read
  it, so the halves complete themselves instead.
- **Either order.** `applyDate(null, day)` takes the time from the clock; `applyTime(null, time)`
  takes today — or, when today is disabled or outside the window, `nearestAllowedDate`, which looks
  forward a year and a day and then back. With no day allowed at all the settle is dropped and the
  value stays `null`.
- **"Now" rounds up.** At 10:07 on a quarter-hour step the first guess is 10:15, not the 10:00
  already gone; at 23:55 it is 23:45, because the next step is tomorrow and the value cannot say
  so. The wheel's own `nearestEnabledTime` rounds to the nearest, which is right once a person is
  turning it.
- **Continuous commit.** Every calendar pick and every wheel settle calls `onValueChange` with a
  whole value. Done decides nothing — it announces and closes — and a swipe, scrim tap or the close
  control keeps the value too. There is no draft to lose.
- **A tap on the chosen day keeps it.** `Calendar`'s single mode clears on a second tap; here that
  would empty the date and leave a time, which the value cannot hold. Clear is how it empties.

## One window, not two pairs of bounds

- **`minDateTime` / `maxDateTime` replace a `minDate` + `minTime` pair.** A separate `minTime`
  would forbid 8:00 on *every* day; "not before 9:15 on the 5th" is a bound on the 5th's clock and
  nothing else. `timeBoundsForDate` returns `{}` strictly inside the window, `{ minTime }` on its
  first day, `{ maxTime }` on its last, both on a one-day window, and `null` outside it.
- **The calendar gets the window's two days**, through `resolveCalendarBounds`; the disabled days
  pass straight through.
- **Moving the date re-clamps the time.** `applyDate` keeps the time when the new day allows it and
  otherwise moves it to the nearest time on the step that does — so picking the window's first day
  pulls 8:00 up to 9:15 rather than reporting a value outside the window.
- **An inverted window is no window**, the rule `normaliseBounds` already applies to a bare time.
- **The wheel's bounds follow the value's day**, or while empty the day `setTime` would land on, so
  the rows it dims are exactly the ones a settle would be clamped off.

## Layouts

- **`tabs` (default)** — `Tabs` at `primary`/`sm` with Date and Time panels, so the sheet holds one
  of a calendar and a wheel at a time and fits the shortest phone. Each opening starts on Date and
  moves to Time once after the first date pick of an empty value (`resolveShouldAutoAdvance`) —
  that is the moment the time is a guess. With a value already set, or after the first advance,
  it never jumps, so going back to change the day is not undone.
- **`stacked`** — the calendar, a hairline, then a "Time  3:30 PM" row that opens the wheel beneath
  it. For tablets and tall sheets.
- **The stacked wheel's height is committed by React, never animated on the UI thread.** The sheet
  sizes itself from its content's measured layout, and a height written by a Reanimated style does
  not reach that measurement: on the simulator the row turned primary, the wheel opened *behind*
  the footer, and the sheet moved three points. The clip's height is therefore a plain style —
  `DATE_TIME_PICKER_WHEEL_HEIGHT`, the `md` wheel's own, known up front — so the sheet springs to
  its new snap point and that spring is the motion; the wheel fades in on top, and under calm
  motion it does not. Closed, the wheel stays mounted (its scroll position survives) but takes no
  height, leaves the accessibility tree and stops taking touches.
- **`DateTimePicker.Content`'s children are walked by type in `tabs`.** `DateTimePicker.Calendar`
  goes in the Date panel, `DateTimePicker.Time` in the Time panel, a section left out falls back to
  the default part, and anything else follows the tabs — the same child walk `Tabs` does for its
  panels. In `stacked` the children render in order.
- **Both halves are always `md`.** The trigger's `size` is the field's; day targets and wheel rows
  stay at 44pt-ish whatever a compact form chooses.

## Gestures

- **The sheet's content pan is off**, as in `TimePicker`: every vertical drag inside belongs to a
  wheel column. The handle still drags the sheet, and swipe-down from it still dismisses.
- **The calendar's month swipe is off in `tabs`**, so the only horizontal drag in the panel is the
  tab pager's; the caption's arrows still page. In `stacked` there is no pager and the swipe stays.

## Trigger and accessibility

- **`locale` formats dates and names; it does not translate messages.** Pass Calendar messages to
  a custom `DateTimePicker.Calendar`. Picker labels such as `doneLabel` remain separate props.
  Omitted Calendar messages keep their English defaults.
- **The trigger is a button** named `accessibilityLabel ?? field.label ?? "Date and time"`, valued
  with the long form — "Monday 5 October 2026 at 3:30 PM" — or "not set". `Field` cascade is
  nearest-wins `??`, and the root registers `open` with the field's `registerPress` through a
  ref-backed trampoline, as `TimePicker` does. Inline registers nothing.
- **Disabled and read-only never open.** Disabled also freezes and fades the whole panel, inline
  included; read-only shows the panel and refuses every change.
- **Done announces the composed value** ("Selected Monday 5 October 2026 at 3:30 PM") and plays
  `impactLight` — the calendar and the wheel already ticked on their own picks.
- **The Time panel's readout row is one accessibility element**, "Time, 3:30 PM", ahead of the
  wheel's adjustable columns. In `stacked` it is a button with an expanded state.

## Test ids

- **Parts derive their `testID` from the root's**, through the calendar's `resolvePartTestID`, as
  `DatePicker`'s do: `-trigger`, `-calendar` (so a day is `-calendar-day-2026-10-14`),
  `-tab-date`, `-tab-time`, `-time-row`, `-time-wheel`, `-title`, `-close`, `-clear`, `-done`. No
  root id, no part ids. An explicit `testID` on `Trigger`, `Done`, `Clear` or `Time` wins.
- **`today` pins the clock's day** — the calendar's marker and the day a time picked first lands
  on — so a preview or a test does not change with the date it runs on.

## Native `Date`

- **`toNativeDate` and `fromNativeDate` read and write local fields.** A wall-clock value has no
  instant until it is placed in a zone, and the phone's zone is the one a person means. A time
  inside a spring-forward gap is moved forward by the platform, as any local `Date` is; the tests
  pin a round trip across 2026-09-27 in `Pacific/Auckland` for every hour outside the gap.
- **`fromNativeDate` drops seconds**, matching a picker without a seconds wheel.

## Open questions

- `Tabs` inside a `BottomSheet`: verified on the iOS simulator — a wheel drag scrolls the wheel and
  never the sheet, tab presses slide the pager, and a horizontal fling below the wheel did not page
  (nor fight anything). Android is unverified. The fallback, if the pager ever fights, is a
  `ToggleButton` group switching panels with no pager.
- `minDateTime` / `maxDateTime` replace separate date and time bounds; confirm the single-window
  API is acceptable.
- Out of scope: time zones (store the zone beside the value), clock and ruler faces, an anchored
  popover (the `presentation` union leaves room for it once the Overlays category ships one),
  date ranges with times, recurring schedules, a commit-on-Done mode.
