# Field

A form field's layout, and the one place its state is written down. Root plus
`Field.Set`, `Field.Legend`, `Field.Group`, `Field.Content`, `Field.Label`,
`Field.Description`, `Field.Error` and `Field.Separator`.

`import { Field } from "@delacour/native-ui/field";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/native-ui/field` |
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
| `field.types.ts` | Prop types shared by two or more parts |
| `field.variants.ts` | Pure `tv()` slots + resolvers, no RN imports |
| `field.variants.test.ts` | |

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
  `resolveFieldInteractive` is the decision and it is pure, so `bun test` reaches
  it. A field of static text registers nothing and stays a `View` — mounting a
  detector regardless would put one under every label and description in a form,
  the thing [`Badge`](../badge/AGENTS.md) refuses for a list of fifty tags. The row is
  `accessible={false}`, so the control stays the element a screen reader sees,
  and the inner detector claims a tap on the box itself rather than firing both.
  A field holds one control, so a second registration replaces the first.
- **A data-attribute class would also leave `bun test`.** Even for a part styling
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
- **There is no `Field.Title`.** On the web it exists because a `<div>` is not a
  `<label>` — label-styled text with nothing to point `htmlFor` at. React Native
  has neither element nor association, so it and `Field.Label` would render the
  same `Text`.
- **A set holds no state.** `isInvalid` and `isDisabled` live on each `Field`,
  because a whole section turning destructive says less than the one field that is
  actually wrong.
