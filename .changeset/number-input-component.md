---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `NumberInput` — a number between a minus and a plus

Tap a stepper to move by `step`, hold it to repeat after 400ms and accelerate, or type: while
focused the field takes half-typed text (`""`, `"-"`, `"1."`) and commits on blur or submit, so it
never fights the person typing. Every path goes through one reconcile — snapped to the step, held
inside `[min, max]`, rounded to the step's precision — and `onValueChange` fires only on a committed
change. The box is `Input.Group`'s, so it takes `Input`'s variants and sizes and an enclosing
`Field`'s label, invalid and disabled state. `formatOptions` formats the value at rest through
`Intl`; `commitMode="validate"` keeps an out-of-range number and flags it instead of clamping. The
field is `adjustable` with increment and decrement actions for VoiceOver and TalkBack. The parse,
format and step maths are exported as pure helpers. `bunx delacour add number-input` installs it.
