---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `TimePicker`, a time of day on snapping wheels — hour, minute, optional second and, on a 12-hour clock, AM/PM. It presents as an `Input`-shaped trigger that opens a `BottomSheet`, or inline with `presentation="inline"`. The value is always a 24-hour `TimeValue`; `hourCycle` and `locale` change only how it reads. It takes `minuteStep`, `minTime`/`maxTime` (out-of-bounds rows dim and a wheel resting on one moves back), `showSeconds`, `visibleRows`, a custom `format`, `clearable`, controlled or uncontrolled value and open state, and joins an enclosing `Field`. Parts are `TimePicker.Trigger`, `.Value`, `.Icon`, `.Content`, `.Wheel`, `.Done` and `.Clear`; `TimePickerWheel` renders the bare wheel on its own, and the subpath exports the pure time helpers (`parseTime`, `serialiseTime`, `formatTime`, `snapTime`, `clampTime` and more). Each wheel column is one adjustable element to screen readers. The subpath imports the sheet engine, so it needs `@delacour/react-native-bottom-sheet` installed. The CLI can now `add time-picker`.
