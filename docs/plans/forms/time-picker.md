# TimePicker

- **Status**: spec, not started
- **Wave**: 1 (independent)
- **Depends on**: BottomSheet (`../bottom-sheet`, optional peer engine), Input variants leaf (`../input/input.variants`), Field context leaf (`../field/field.context`), Pressable, Text, Button, Icon; hooks `use-controllable-state`, `use-calm-motion`.
- **Owns the shared leaf** `components/time-picker/time-picker.time.ts` (TimeValue + helpers). `date-time-picker` (Wave 2) imports it via `../time-picker/time-picker.time` and renders the bare wheel through the `TimePickerWheel` part module.

## Purpose on mobile
Pick a time of day with thumb-friendly snapping wheels (hour, minute, optional second, AM/PM). Presents as a field-like trigger that opens a bottom sheet, or renders the wheel inline on a screen. No native datetimepicker dependency: the wheels are one scroll primitive built on Reanimated + FlatList snapping.

## Behaviour reference (summary of features observed)
- Value is always a 24-hour `{ hour, minute }`; the 12/24-hour setting only changes display, never storage. Helpers convert display hour <-> stored hour.
- Controlled/uncontrolled value; `minTime` / `maxTime` bound it; `minuteStep` sets granularity; values off the step are rounded, not rejected.
- `hourCycle` 12 (default per locale) or 24; locale controls trigger text and AM/PM labels; optional custom `format`.
- Trigger shows placeholder when unset; opening an unset picker starts near the current hour, not midnight.
- Scroll-based wheels with platform momentum; sheet presentation has a Done button; outside tap dismisses.
- Open/closed controllable; disabled blocks interaction.
- Inline presentation shows the bare wheel; useful inside other panels.
- Other faces (clock dial, ruler) exist in the observed behaviour; this spec ships **wheel only** and reserves `layout` for them.

## API

```ts
// time-picker.time.ts (leaf, no react-native imports)
export type TimeValue = { hour: number /* 0-23 */; minute: number /* 0-59 */; second?: number /* 0-59 */ };
export type HourCycle = 12 | 24;
export type DayPeriod = "am" | "pm";
export type TimeBounds = { minTime?: TimeValue; maxTime?: TimeValue };
```

```ts
// time-picker.types.ts
export type TimePickerPresentation = "sheet" | "inline"; // grows to "popover" when Overlays ships
export type TimePickerProps = {
  value?: TimeValue | null;
  defaultValue?: TimeValue | null;
  onValueChange?: (value: TimeValue | null) => void;   // fires when a wheel settles (see Behaviour below)
  minTime?: TimeValue; maxTime?: TimeValue;
  minuteStep?: 1 | 2 | 5 | 10 | 15 | 20 | 30;          // default 1
  showSeconds?: boolean;                                // default false; adds a third wheel
  hourCycle?: HourCycle | "auto";                       // default "auto" (from locale)
  locale?: string;
  format?: (value: TimeValue, ctx: { locale: string; hourCycle: HourCycle }) => string;
  placeholder?: string;                                 // default "Select time"
  presentation?: TimePickerPresentation;                // default "sheet"
  layout?: "wheel";                                     // reserved
  isOpen?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  isDisabled?: boolean; isReadOnly?: boolean; isInvalid?: boolean;
  variant?: "primary" | "secondary"; size?: "sm" | "md" | "lg";
  title?: string;                                       // sheet title, default "Select time"
  doneLabel?: string;                                   // default "Done"
  clearable?: boolean;                                  // adds Clear in the sheet footer, default false
  accessibilityLabel?: string;                          // falls back to field.label
  className?: string;
  children?: ReactNode;                                 // omit for the default anatomy
};
```
Standalone wheel (used inline and by DateTimePicker):
```ts
export type TimePickerWheelProps = Pick<TimePickerProps,
  "minTime" | "maxTime" | "minuteStep" | "showSeconds" | "hourCycle" | "locale" | "size" | "isDisabled"> & {
  value: TimeValue | null;
  onValueChange: (value: TimeValue) => void;   // fires on settle
  className?: string;
};
```
Hook: `useTimePicker()` -> `{ value, setValue, isOpen, open, close, hourCycle, locale, display: string, isDisabled, isInvalid }` (throws outside; `useTimePickerContext()` nullable).

Anatomy:
```tsx
<Field isInvalid={!!error}>
  <Field.Label>Reminder</Field.Label>
  <TimePicker value={t} onValueChange={setT} minuteStep={5}>
    <TimePicker.Trigger>
      <TimePicker.Value placeholder="Select time" />
      <TimePicker.Icon />
    </TimePicker.Trigger>
    <TimePicker.Content title="Reminder time">   {/* BottomSheet portal + container + header + footer */}
      <TimePicker.Wheel />
    </TimePicker.Content>
  </TimePicker>
</Field>

<TimePicker presentation="inline" value={t} onValueChange={setT} />
```
Parts: `TimePicker.Trigger`, `TimePicker.Value`, `TimePicker.Icon`, `TimePicker.Content`, `TimePicker.Wheel`, `TimePicker.Done`, `TimePicker.Clear`. Internal: `TimeWheelColumn`. The root, with no children, renders the default anatomy. The root mounts `BottomSheet` (`isOpen`/`onOpenChange` passed through) - consumers must mount `BottomSheetProvider` once. All parts `DelacourUI.TimePicker.*`.

**Behaviour decisions**
- Commit on settle: `onValueChange` fires each time a wheel stops (ends momentum). Done closes the sheet and commits nothing extra; swipe-dismiss/overlay tap also keeps the value (no revert). A `commitOn="done"` mode is a follow-up.
- Unset open: wheels initialise to `resolveInitialTime(now, step, bounds)` (now, snapped to step, clamped) but value stays `null` until the user scrolls or presses Done; Done with an untouched wheel commits the shown time.
- Out-of-bounds rows render dimmed; on settle onto a disabled row the wheel scrolls to the nearest enabled row.
- Hour wheel in 12h shows 12,1..11; the AM/PM wheel is two rows. Changing AM/PM maps via `to24Hour`.

## Variants & sizes
- `variant`/`size` apply to the **trigger** (identical box to `Input`: reuse `inputVariants` root slot via `resolveInputFieldClass`, `h-input-sm|md|lg`, `text-input-*`) and to the wheel row height (sm 32, md 40, lg 48; visible rows odd, default 5, `visibleRows?: 3 | 5 | 7`).
- Wheel slots in `timePickerVariants`: `trigger, value, valuePlaceholder, icon, wheel, column, row, rowText, selectionBand, fadeTop, fadeBottom, separator, header, footer`. Selection band `bg-muted` rounded; selected text `text-foreground`, others `text-muted-foreground`, disabled rows additionally dim. Fade masks via `expo-linear-gradient` (existing peer) or opacity-stepped rows (pick: opacity/scale-by-distance in the scroll handler, no gradient) so no extra peer is touched.

## States
default; pressed (trigger `Pressable` feedback `fade`); focused (trigger shows `border-ring` while the sheet is open, via `isFocused = isOpen`); disabled (inert, 50% opacity, no sheet); invalid (cascade `isInvalid ?? field.isInvalid`, destructive border); readOnly (value shown, sheet does not open); empty (placeholder, muted); out-of-bounds rows; no loading state. Cascade chain nearest wins with `??`: prop -> `Field`.

## Accessibility
- Trigger: `accessibilityRole="button"`, label = `accessibilityLabel ?? field.label ?? "Time"`, value = formatted time or "not set", hint "Opens time picker". Registers `registerPress(open)` with Field so tapping the label opens the sheet; `registerPress(null)` on unmount.
- Each wheel column: `accessibilityRole="adjustable"`, `accessibilityValue={{ text: "30 minutes" }}`, `accessibilityActions` increment/decrement stepping by one row (minute by `minuteStep`), `onAccessibilityAction` scrolls; screen reader users never need to flick a wheel.
- Rows themselves are hidden from the a11y tree (`importantForAccessibility="no"`), the column carries the semantics.
- Sheet is modal and labelled by the title (engine provides this). Done is a labelled button.

## Motion & haptics
- Snap: `snapToInterval = rowHeight`, `decelerationRate="fast"`; Reanimated `useAnimatedScrollHandler` drives per-row scale/opacity from distance to centre (behavioural, kept under calm motion).
- Haptic tick: `Presets.System.selection` worklet whenever the centred index changes during scroll (de-duplicated by index). `impactLight` on settle into a clamped/blocked row.
- Inline wheel appears without entrance animation; sheet motion belongs to BottomSheet.
- `useCalmMotion()`: only affects the scale/opacity flourish (rows stop scaling, opacity step only).

## Reuses / new internal pieces / peer deps
- Reuses `BottomSheet` (Portal, Overlay, Container, Content, Title, Footer, Close), `Pressable`, `Text`, `Button`, `Icon` (`IconClock` / `IconChevronDownSmall`), `inputVariants` leaf, `useFieldContext` leaf, `useControllableState`.
- New: `time-picker.time.ts` leaf; `TimeWheelColumn` (snapping list + centre-index math in `time-picker.variants.ts` worklets).
- Presentation is a discriminated `"sheet" | "inline"` today; an anchored popover is a follow-up once Overlays' Popover merges, with no breaking change.
- **Peer deps: none new.** The engine `@delacour/react-native-bottom-sheet` stays an optional peer; `time-picker.tsx` imports the sheet parts, so the subpath needs it (see open question).

## Files
`packages/react-native-ui/src/components/time-picker/`
| File | Holds |
| --- | --- |
| `index.ts` | `@delacour/react-native-ui/time-picker` |
| `time-picker.tsx` | root, state, `Object.assign` surface |
| `time-picker-trigger.tsx`, `-value.tsx`, `-icon.tsx` | trigger parts |
| `time-picker-content.tsx` | sheet shell: portal, overlay, container, header, footer |
| `time-picker-wheel.tsx` | bare wheel (the unit DateTimePicker reuses) |
| `time-picker-wheel-column.tsx` | one snapping column (internal) |
| `time-picker-done.tsx`, `time-picker-clear.tsx` | footer actions |
| `time-picker.context.tsx` | context + hooks |
| `time-picker.types.ts` | prop types |
| `time-picker.time.ts` / `.time.test.ts` | **shared leaf** + tests |
| `time-picker.variants.ts` / `.variants.test.ts` | slotted `tv()`, resolvers, scroll math worklets (no RN imports) |
| `AGENTS.md` | design notes, file map; row in package table |
Plus the repo-wide checklist: `gen-exports`; playground demos + route + index row + `gen-demos`; docs mdx + meta.json; registry `ITEM_META` + `PACKAGE_INSTALL` (bottom-sheet engine) + `registry:build`; changeset (minor on `@delacour/react-native-ui` and `delacour`).

## Pure logic to unit-test
`time-picker.time.ts`: `isValidTime`, `compareTimes`, `toMinutes`/`fromMinutes`, `to12Hour(h) -> {hour12, period}`, `to24Hour(hour12, period)`, `displayHour(h, cycle)`, `hourFromDisplay(n, cycle, period)`, `snapMinute(m, step)` (nearest, 59 with step 15 -> next hour handled by `snapTime`), `snapTime(t, step)` (rounds, carries into hour, wraps 23:59 -> clamp not 00:00), `clampTime(t, min, max)`, `isTimeDisabled(t, bounds)`, `minutesForHour(h, step, bounds)` (enabled minutes list), `hoursInBounds(bounds)`, `resolveInitialTime(now, step, bounds)`, `resolveHourCycle(locale)` (via `Intl.DateTimeFormat(locale,{hour:"numeric"}).resolvedOptions().hourCycle`, fallback 12), `formatTime(t, {locale, hourCycle})`, `parseTime("HH:mm"|"HH:mm:ss")`, `serialiseTime`.
Cases: 12<->24 round trips for all 24 hours; 0 -> 12 AM, 12 -> 12 PM, 13 -> 1 PM; `to24Hour(12,"am")=0`; `snapMinute(7,5)=5`, `(8,5)=10`, `(53,15)=45`, `(53,30)=60 -> carry`; clamp below/above/inside bounds, min > max treated as unbounded; `minutesForHour` at the boundary hour of `minTime 09:20` step 5 starts at 20; `formatTime({hour:15,minute:5},{locale:"en-US",hourCycle:12})` contains "3:05" and "PM"; 24h `en-GB` gives "15:05"; invalid locale does not throw.
`time-picker.variants.test.ts`: tokens exist in both themes; slot ladder (`h-input-*` equals Input's); `offsetToIndex`/`indexToOffset` round trip, clamps at ends, `nearestEnabledIndex`; row text slots carry colour, parents do not.

## Playground demos (`apps/playground/src/demos/time-picker/`)
`basic-sheet` (capture, **hero**), `minute-step-15` (capture), `twenty-four-hour` (capture), `bounds` (min/max; capture), `inline-wheel` (capture), `in-field-invalid` (no capture), `with-seconds` (no capture).

## Docs page outline
Intro/import; BottomSheetProvider requirement; Basic; Minute step; 12/24h & locale; Min/max; Inline; Controlled open; In a `Field`; Custom format; Accessibility (adjustable columns); API (root, parts, `TimePickerWheel`, `useTimePicker`); Time helpers.

## Out of scope / follow-ups
- Clock dial and ruler faces (`layout` reserved), anchored popover presentation, duration/interval picker, looping wheels, `commitOn="done"`, keyboard-typed time entry.
- Open question: sheet import makes the optional engine required for the whole `time-picker` subpath, including inline. Option 1: accept (matches Select/DatePicker). Option 2: export `TimePickerWheel` from a second subpath `time-picker/wheel` that never imports the engine. Default: option 1; revisit at review.
- Open question: shared picker trigger. Select, DatePicker, TimePicker, DateTimePicker all need an Input-shaped trigger. Default here: each owns a thin trigger on the `inputVariants` leaf; consolidate into a shared `picker-trigger` leaf if Select (Wave 1) ships one first.

## Acceptance checklist
- [ ] `time-picker.time.ts` pure, no RN imports, tests pass.
- [ ] Stored value always 24h; 12h display correct for 12 AM/12 PM.
- [ ] Step rounding, min/max clamping and nearest-enabled settle work on device.
- [ ] Sheet and inline presentations; controlled and uncontrolled value and open.
- [ ] Field cascade (invalid, disabled, label, press registration).
- [ ] Adjustable a11y actions verified with VoiceOver/TalkBack.
- [ ] Selection haptic per row, no double firing; calm motion honoured.
- [ ] `DelacourUI.` displayNames; display-name/docs tests pass.
- [ ] AGENTS.md, table row, gen-exports, demos, docs, registry, changeset done.
- [ ] No JSX comments, no `any`, semantic tokens only.
