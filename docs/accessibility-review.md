# Accessibility and localization review

Review date: 2026-10-22. Base: `develop` at `36b3b80f`.

This review covers Calendar, DatePicker, Dialog, BottomSheet, Input, and Slider.
Calendar and DatePicker now accept partial `messages` objects. Dialog, BottomSheet,
and Slider accept app-supplied accessibility labels. Input uses the app's
`Field.Label` by default, or accepts `accessibilityLabel`.

Native acceptance remains open. Source checks and pure tests do not prove native behavior.

## Changes

- Calendar accepts partial `messages` for navigation, picker hints, and day states.
- DatePicker accepts partial `messages` for controls, values, and announcements.
  Functions receive dates that the existing locale formatter has already formatted.
  The application can control sentence order and plural forms.
- Omitted Calendar and DatePicker entries keep their existing English defaults.
  Explicit label, title, placeholder, and formatter props retain priority.
- Dialog.Close accepts a translated `accessibilityLabel`. BottomSheet.Close and
  BottomSheet.Overlay accept one too. BottomSheet.Handle accepts translated
  `accessibilityLabel` and `accessibilityValue` props. Slider.Thumb accepts a
  translated `accessibilityLabel`.
- Input uses `Field.Label` when `accessibilityLabel` is absent.
  Textarea uses Input and inherits this fallback.
  SearchBar keeps its explicit accessible name.
- Input has no built-in text to translate. The app supplies its Field label,
  placeholder, and any icon-only button label.
- The playground includes Arabic examples under `Direction dir="rtl"`.

## Source evidence

| Component | Source result | Native check still required |
| --- | --- | --- |
| Calendar | Messages now cover navigation actions, day state hints, and caption hints. The existing locale still formats dates. | Read a selected date and both range ends. Open the month and year views. Repeat in RTL. |
| DatePicker | Messages now cover placeholders, controls, range values, counts, and completion announcements. | Read empty and selected values in all three modes. Confirm focus after open, done, clear, and close. |
| Dialog | The title receives focus on open. A mounted trigger receives focus on close. The source uses modal semantics and reduced motion. `Dialog.Close` accepts an app-supplied label. | Verify focus order and return with VoiceOver and TalkBack. Check long text and the close control in RTL. |
| BottomSheet | The engine uses modal semantics, title labels, adjustable handle actions, and system reduced motion. Callers can override handle, close, and overlay labels and the handle value. | Verify focus transfer and return. Check translated handle values, the keyboard, and RTL close placement. |
| Input | The Field context provides the label. Input now passes that label to the native input unless the caller supplies one. | Read names for Input, Textarea, and SearchBar. Check an explicit label. Check clipping at the largest system text size. |
| Slider | The thumb exposes an adjustable role, current value, increment and decrement actions, and a field label fallback. `Slider.Thumb` accepts an app-supplied label. | Change each thumb with screen reader actions. Check value announcements and bounds in RTL. |

Relevant source files:

- [Calendar](../packages/react-native-ui/src/components/calendar/calendar.tsx)
- [DatePicker](../packages/react-native-ui/src/components/date-picker/date-picker.tsx)
- [Dialog focus](../packages/react-native-ui/src/components/dialog/dialog-content.tsx)
- [Sheet container](../packages/react-native-bottom-sheet/src/components/bottom-sheet-container.tsx)
- [Sheet handle](../packages/react-native-bottom-sheet/src/components/bottom-sheet-handle.tsx)
- [Input](../packages/react-native-ui/src/components/input/input.tsx)
- [Slider thumb](../packages/react-native-ui/src/components/slider/slider-thumb.tsx)

## Automated checks

The focused Calendar, DatePicker, DateTimePicker, Input, Textarea, and SearchBar
test run passed 355 tests. The registry build passed its static check for
runner-neutral test APIs. Copied tests under Jest and Vitest remain pending.
Demo, install, and skill metadata were regenerated.
The root lint and format check passed with warnings.

The full UI test run passed 6,488 tests and failed to load one Skia test.
The full web test run failed to load the telemetry package.
Type checks report missing Skia and telemetry modules. Full signoff is pending.
These dependency failures also occurred before this change.

## Native acceptance record

Run this matrix on one iOS device or simulator and one Android device or emulator.
Record the OS, device, application commit, and assistive technology version.
Attach a recording or a written action log for each result.

| Check | iOS | Android |
| --- | --- | --- |
| English defaults and explicit overrides | Pending | Pending |
| Arabic messages and RTL navigation | Pending | Pending |
| Largest system text size and long translations | Pending | Pending |
| Screen reader names, values, actions, and announcements | Pending | Pending |
| Overlay focus entry and return | Pending | Pending |
| Reduced motion during open, close, and calendar navigation | Pending | Pending |

Do not mark a row complete from source inspection alone.
The current checkout lacks Skia and the Warden command. Free disk space is below
the repository's 5 GiB install floor. These limits block native capture in this review.
The active simulator belongs to another project and was not used.
