# Field

A form field's layout, and the one place its state is written down. Root plus
`Field.Set`, `Field.Legend`, `Field.Group`, `Field.Content`, `Field.Label`,
`Field.Description`, `Field.Error` and `Field.Separator`.

`import { Field } from "@delacour/react-native-ui/field";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/field` |
| `field.tsx` | Root + the `Object.assign` compound surface |
| `field-set.tsx` | `Field.Set` |
| `field-legend.tsx` | `Field.Legend` |
| `field-group.tsx` | `Field.Group` |
| `field-content.tsx` | `Field.Content` |
| `field-label.tsx` | `Field.Label` |
| `field-description.tsx` | `Field.Description` |
| `field-error.tsx` | `Field.Error` |
| `field-separator.tsx` | `Field.Separator` |
| `field.context.tsx` | `FieldProvider`, `useField()`, `useFieldContext()` |
| `field-control.ts` | `useFieldControlAccessibility()` — the one call a control makes to read the field's name, validity, error and description |
| `field.types.ts` | Prop types shared by two or more parts |
| `field.variants.ts` | Pure `tv()` slots + resolvers, no RN imports |
| `field.variants.test.ts` | |
| `field.render.test.tsx` | Mounted under Jest — label press reaching Checkbox/Switch (and refused when disabled), state cascade, Slider thumb naming, validity reaching a control through the hook, label hidden once claimed, Error live region, Legend header, parts outside a Field |

## Design

- **Orientations**: `vertical` (default), `horizontal`.
- **The cascade is a context, and it had to be.** `<Field isInvalid>` reddens the
  control inside it, not just its own label. On the web shadcn does that with
  `group-data-[invalid=true]/field:` — a parent-scoped selector. Uniwind has no
  equivalent: its compiler reads `data-*` off a **single flat selector**
  (`bundler/css-processor/processor.ts`) and its runtime matches them against
  `props[attribute]` on **the component carrying the class**
  (`core/native/store.ts`), so no class on a `Field` can reach the
  [`Input`](../input/AGENTS.md) inside it. There is no `group-*`, no `peer-*`,
  no `:has()`. Do not go looking for one again.
- **The whole row drives the control, once one offers a press.** A control
  registers a callback through the same context the state cascades down, and the
  row becomes a `Pressable` with `feedback="none"` that calls it — so tapping
  "Accept the terms", or the description under it, ticks the
  [`Checkbox`](../checkbox/AGENTS.md) beside
  it. A checkbox in a form is a small square next to a sentence, and the sentence
  is what people aim at. This is [`Input.Group`](../input/AGENTS.md)'s trick one level out: that group
  is a pressable whose press focuses the field through a ref on its context.
  `resolveFieldInteractive` is the decision and it is pure, so it is
  unit-testable. A field of static text registers nothing and stays a `View` — mounting a
  detector regardless would put one under every label and description in a form,
  the thing [`Badge`](../badge/AGENTS.md) refuses for a list of fifty tags. The row is
  `accessible={false}`, so the control stays the element a screen reader sees,
  and the inner detector claims a tap on the box itself rather than firing both.
  A field holds one control, so a second registration replaces the first.
- **The label names the control, through the same context.** `Field.Label`
  registers its text with `registerLabel`, the mirror of `registerPress`: a
  control hands its press up, a label hands its name down. A control with no
  text of its own — a [Slider](../slider/AGENTS.md) thumb is a capsule — reads
  `field.label` as its `accessibilityLabel`, so "Volume" is announced rather than
  a bare "40". React Native has no `<label for>`; this is that association, done
  by hand. `resolveFieldLabelText` decides what qualifies and it is strict on
  purpose: a plain string or number, trimmed, and nothing else. A label built
  from elements has no text this side of a render, and guessing at one — an
  icon's key, say — would name the control after the wrong thing. State rather
  than a ref for the same reason as the press: the control renders differently
  for it, and the label registers in an effect, so it costs one render on mount.
- **Validity reaches the control by speech, because React Native has nothing
  else.** RN 0.88 has no `aria-invalid`, `aria-required`, `aria-describedby` or
  `accessibilityErrorMessage`, and `accessibilityState` holds none of them — do
  not go looking again. `Field` takes `isRequired`; `Field.Error` and
  `Field.Description` register their text (plain text only, via `labelText`)
  the way `Field.Label` does. `resolveFieldControlAccessibility` turns it into:
  - **name**: explicit `accessibilityLabel` verbatim → the control's own
    `defaultLabel` → the field's label → the control's `fallbackLabel`, with
    ", required" appended when required — the words [`Label`](../label/AGENTS.md)
    already speaks for its own `isRequired`.
  - **hint**: "Invalid: {error}" (or "Invalid" with no error text), then the
    description, then the control's own hint. VoiceOver reads it after a pause;
    TalkBack reads it as tooltip text. An error on a valid field is read without
    the "Invalid" lead.
  - **`accessibilityLabelledBy`** (Android only) at the label's `nativeID`,
    when the label is an element with no text to lend.
  The spoken words are `FIELD_ACCESSIBILITY_LABELS`, overridable per call for
  localisation. **A control wires all of it with `useFieldControlAccessibility`**
  (`field-control.ts`): spread `accessibilityLabel`, `accessibilityHint` and
  `accessibilityLabelledBy` on the focusable element and render with the
  returned `isInvalid`. The own `isInvalid`/`isRequired` beat the field's.
- **`Field.Label` leaves the accessibility tree once a control takes its
  name.** The hook claims the label when the control has no name of its own
  (`takesFieldLabel: false` opts out, for a control named some way the hook
  cannot see — a `Checkbox` whose inline content is an element);
  `resolveFieldLabelHidden` then hides the label (`accessibilityElementsHidden`
  + `importantForAccessibility="no-hide-descendants"`), so a swipe does not stop
  on "Email" and then on the "Email" text field. An element label lends nothing,
  so it stays readable. A claim is a count, so a remounting control never
  unhides the label for a frame. A required field's label draws `Label`'s
  asterisk and reads "Email, required" while it is visible to a screen reader.
- **`Field.Error` announces through one mechanism**: an Android polite live
  region. `role="alert"` was dropped — on Android it only adds a spoken "alert"
  to every visit, on iOS it maps to no trait. VoiceOver hears the error as part
  of the control's hint. An iOS on-appearance announcement is the shared
  announce helper's job, not this part's.
- **`Field.Legend` is a header**, so the headings rotor jumps between sections.
- **A data-attribute class would also hide the decision from unit tests.** Even for a part styling
  itself, `data-invalid:text-destructive` moves the decision from `field.variants.ts`
  into uniwind's runtime matcher, where no unit test can see it. The parts style
  themselves from `tv()` booleans; the context is only for crossing a component
  boundary.
- **The text parts render the `Text` presets and pass a colour, never a scale.**
  `Field.Label` *is* [`Text.Label`](../text/AGENTS.md); `Field.Description` and `Field.Error` are
  `Text.Caption`. `resolveFieldTextColor` picks the colour and returns
  `undefined` to mean "leave the preset's own alone" — which is exactly what
  `Text`'s unnamed axes do. A `text-sm font-medium` in a slot here would be a
  second definition of `Text.Label`, the thing that kept [`Input`](../input/AGENTS.md) from shipping a
  label part at all. A test asserts the text slots carry no size, weight or
  colour.
- **The gap ladder is the component.** `content` 0.5 → `root` 1.5 → `set` 4 →
  `group` 5. A label attaches to the control beneath it rather than the one above
  purely because the gap inside a field is tighter than the gap between two, and
  nothing else is doing that work. The test pins the **ordering**, not the
  numbers, so the spacing can be retuned without the test becoming a transcript
  of it.
- **Only the label fades when disabled.** The control dims itself, and a dimmed
  description stacked on a dimmed control reads as two problems rather than one
  state. The description stays muted when invalid too, so an appearing
  `Field.Error` is the one line that changed.
- **`Field.Error` renders nothing when it has no children**, so
  `<Field.Error>{error}</Field.Error>` removes itself once the value is fixed.
  It is deliberately **not** gated on `isInvalid`: a part that swallowed children
  a caller actually wrote, because of a prop on a sibling, would be a part whose
  absence is unexplainable from the call site. shadcn's `errors` array prop is
  not ported — it exists to accept react-hook-form and Standard Schema shapes,
  and this package takes no form dependency.
- **`Field.Separator` draws two rules, not one with a label on top.** The web
  version absolutely-positions a single rule and punches a hole in it with an
  opaque `bg-background` label, which is invisible only while the separator sits
  on exactly that colour — on a card or a sheet the hole shows as a block of the
  wrong shade. Two rules and a gap assume nothing about what is behind them. The
  playground's `/field/grouping` has the card case on screen.
- **`Field.Group` inserts no dividers**, unlike [`ListGroup`](../list-group/AGENTS.md). A list of rows
  without lines is a wall of text; fields are already held apart by whitespace,
  and a rule between every one is noise.
- **`Field.Label` is not built on [`Label`](../label/AGENTS.md)**, the standalone
  primitive. `Label` narrows `children` from `Text`'s and reports
  `accessibilityState.disabled`, so wrapping it would change this part's public
  surface. The two colour and fade identically instead, and
  they must stay in step with `fieldVariants`' label slot
  and `resolveFieldTextColor`. A required field sets `<Field isRequired>`;
  `Field.Label` reuses `Label`'s mark and its announcement.
- **There is no `Field.Title`.** On the web it exists because a `<div>` is not a
  `<label>` — label-styled text with nothing to point `htmlFor` at. React Native
  has neither element nor association, so it and `Field.Label` would render the
  same `Text`.
- **A set holds no state.** `isInvalid` and `isDisabled` live on each `Field`,
  because a whole section going `destructive` says less than the one field that is
  actually wrong.
