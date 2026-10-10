# delacour

## 0.1.0

### Minor Changes

- [#97](https://github.com/delacournz/delacour-ui/pull/97) [`638f2d9`](https://github.com/delacournz/delacour-ui/commit/638f2d9e2093f1b2e62144bb8d3f53cb9a62c965) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Meter` — a measurement on a fixed scale, coloured by where it falls.

  - Built on `Progress`: `Meter.Header`, `Meter.Label`, `Meter.Output`, `Meter.Track` and `Meter.Fill` are the progress bar's parts, with a root that clamps the reading and judges it. A bare `<Meter value={68} />` draws the scale on its own.
  - Judge a reading by `low`, `high` and `optimum` — good, worse and worst regions painted success, warning and destructive, with `optimum` saying which end is good — or by a `thresholds` list naming the colour from points along the scale. The prop type allows one or the other, never both.
  - `segments` draws the scale as whole blocks that fade on and off; any reading above the floor lights at least one.
  - `valueLabel` takes a function handed the judged reading and its `region`, so the judgement is put into words that are drawn and spoken alike rather than left to colour. One accessible element with the `progressbar` role, spoken the way `Progress` speaks its value.
  - `delacour add meter` copies it into a project, along with `progress`.

- [#88](https://github.com/delacournz/delacour-ui/pull/88) [`ebaf127`](https://github.com/delacournz/delacour-ui/commit/ebaf127930b1b3fecdbd497ebc1d7e3f5885dbe3) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Progress` — a bar showing how far a task has got, or a looping segment while it is under way.

  - Compound anatomy: `Progress.Header`, `Progress.Label`, `Progress.Output`, `Progress.Track` and `Progress.Fill`; a bare `<Progress value={40} />` draws the track and fill on its own.
  - The fill animates on the UI thread as a clipped `translateX`, with no layout pass per frame. `isIndeterminate` sweeps a segment across the track, and breathes in place instead when Reduce Motion is on.
  - Six colours and three sizes, shared with `Slider`. `formatOptions`, a function child on `Progress.Output`, or `valueLabel` word the readout.
  - One accessible element with the `progressbar` role: the value is spoken as a percentage over 0–100 and as a count (`18 of 24`) over any other range, and an indeterminate bar reports busy with no value.
  - `delacour add progress` copies it into a project.

- [#137](https://github.com/delacournz/delacour-ui/pull/137) [`a71dc63`](https://github.com/delacournz/delacour-ui/commit/a71dc63815e3a33110f19b9fc2ec9505ba9d0398) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `SelectionMode` — pick several things at once, then act on them from a bar. A long press enters the mode with the pressed item picked; taps then toggle. `SelectionMode.Item` wraps any row, avatar or swatch with a round `leading` mark, a `ring` or nothing; `.Header` counts the picks and offers select-all and the way out; `.Bar` and `.Action` act on the selection; `.Group` lays items out as a stacked card, a grid or a horizontal strip. Selection is a set of ids, controllable alongside the mode, with an optional `max`.

  `delacour add selection-mode` copies it into a project.

- [#135](https://github.com/delacournz/delacour-ui/pull/135) [`57d6320`](https://github.com/delacournz/delacour-ui/commit/57d63202634494f2b85aad040624137d70a5e1b2) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `SlideButton`, a control confirmed by dragging a handle across a rail

  The handle tracks the finger exactly and only the release is sprung. A release confirms past
  `threshold` (0.9 by default) with a small look-ahead, but a flick from halfway never does, and
  `threshold={1}` demands the far end. Controlled, the handle waits at the end until `isCompleted`
  answers; a rejected `onComplete` promise takes it home. Variants `secondary`, `destructive` and
  `success`; sizes match `Button`. Screen readers confirm with one named action, and the control
  flips under RTL.

- [#132](https://github.com/delacournz/delacour-ui/pull/132) [`5f7b6e4`](https://github.com/delacournz/delacour-ui/commit/5f7b6e4fce36a746690478c4407226d0b5c450b1) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `StackCard` — a deck taken one card at a time by throwing the top one off.

  - Compound anatomy: `StackCard.Card`, `StackCard.Stamp`, `StackCard.Empty`, `StackCard.Actions` and `StackCard.Action`. The root sorts its children by type, and anything it does not recognise is a card.
  - One shared value — the top card's offset — drives the drag, the tilt, the stamps and the cards behind, so nothing re-renders during a drag and the next card is already in place when the top one leaves.
  - `directions` picks which ways a drag throws; a horizontal-only deck lets vertical scrolls through. A flick throws from a short drag, and a disallowed direction gives a little and returns.
  - `layout` draws the cards behind as a `stack`, a `fan` or `flat`, `depth` of them. Only a window around the top card is mounted, so a deck of five hundred costs what a deck of five does.
  - Undo brings the last card back from the side it left, and a controlled deck that leaves `index` where it was declines the throw and the card flies back.
  - Each allowed direction, and undo, is a screen-reader action on the top card, named by `directionLabels`; the cards behind are hidden. Under Reduce Motion a card fades rather than flies.
  - `delacour add stack-card` copies it into a project.

- [#92](https://github.com/delacournz/delacour-ui/pull/92) [`d4b4b89`](https://github.com/delacournz/delacour-ui/commit/d4b4b893df4bcc7f4dfe0e0787ba7e68f983095b) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Avatar`

  A person as a picture. The initials of `name` are painted first and the image goes on top, so the circle is never
  empty while a picture loads or after it fails, and a failed source retries on its own when its URI or headers change.
  `variant` and `color` paint the fallback on the six colours `Badge` takes; `sm`, `md`, `lg` and `xl` are fixed edges.

  `Avatar.Badge` pins a count or, left empty, a presence dot to a corner without the circle clipping it. `Avatar.Group`
  overlaps its faces with the first on top, rings each in the page background, and counts the people past `max` — or
  up to `total` — in a trailing `+N` tile that `onOverflowPress` can make a button.

  `delacour add avatar` copies it in.

- [#124](https://github.com/delacournz/delacour-ui/pull/124) [`7eedbec`](https://github.com/delacournz/delacour-ui/commit/7eedbecacc2a9a6f9dbc4a24644bef3c390185cb) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Calendar`, an always-visible month grid for picking one day (`mode="single"`), several (`"multiple"`) or a range (`"range"`), controlled or uncontrolled. Always six weeks, so the height never moves; swipe or tap the arrows to page, and tap the caption for month and year jump views. `minDate`/`maxDate` and `disabled` matchers (a date, a span, weekdays or a predicate) limit what can be picked; names and the first day of the week come from the locale. Two variants, three sizes on the input scale, optional `Surface` chrome, custom day content, and `isInvalid` / `isDisabled` / the label cascade from a `Field`. Days are plain `CalendarDate`s — `{ year, month, day }`, no time zone — with the helpers to compare, add, format, parse and serialise them, so no date library is needed. `bunx delacour add calendar` copies it.

- [#117](https://github.com/delacournz/delacour-ui/pull/117) [`2ee3fa2`](https://github.com/delacournz/delacour-ui/commit/2ee3fa29a51646a7d7e6b0d5bcc429864dd85ea5) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `isMotionCalm` to `DelacourProvider`, and `useCalmMotion()`

  An E2E build passes `isMotionCalm` and every decorative loop holds still, exactly as it does under
  the OS reduce-motion setting — so a test runner that waits for the screen to settle before each
  gesture (Argent, Detox, Maestro) never waits out a shimmering `Skeleton`. Motion that is the
  behaviour keeps moving: `Spinner` and an indeterminate `Progress` are untouched.

  `useCalmMotion()` (`@delacour/react-native-ui/hooks/use-calm-motion`) is the one question a
  component asks before it loops — reduce motion, or the app asking — and `CalmMotionProvider` sets
  the app's half for a hand-composed root. `Skeleton` and `Skeleton.Group` now read it.

- [#90](https://github.com/delacournz/delacour-ui/pull/90) [`f600b93`](https://github.com/delacournz/delacour-ui/commit/f600b93678e5baf9c7d73ba33327cb525e9eaa92) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Chip`, an interactive pill for filters, tags and removable tokens

  What a chip does follows from its props. With no handler it is a plain tag; with `onPress` it is
  a button; with `isSelected`, `defaultSelected` or `onSelectedChange` it is a filter that toggles —
  controlled or uncontrolled, with a `selection` haptic, announced to a screen reader as selected or
  not. `onClose` adds a remove control with a press of its own, so removing a chip never also toggles
  it.

  ```tsx
  import { Chip } from "@delacour/react-native-ui/chip";

  <Chip isSelected={open} onSelectedChange={setOpen} variant="outline">
    <Icon icon={IconFilter1} />
    <Chip.Label>Open only</Chip.Label>
  </Chip>;
  ```

  It shares `Badge`'s colours, sizes and tones — an unselected `soft` or `outline` chip is painted
  exactly as the badge beside it — and selection swaps in a solid fill in the chip's colour without
  changing its size, so a wrapping row never reflows. Parts: `Chip.Label`, `Chip.StartContent`,
  `Chip.EndContent`, `Chip.CloseButton`, and `useChip()` for a child that restyles itself on
  selection.

  `bunx delacour add chip` copies it in, along with `badge`, whose tones it reads.

  `Pressable` now multiplies a `className`'s opacity into its press feedback instead of overwriting it,
  so a disabled `Button`, `Badge` or `Chip` fades as its variant says it should.

- [#87](https://github.com/delacournz/delacour-ui/pull/87) [`d999f83`](https://github.com/delacournz/delacour-ui/commit/d999f83f0d8c34cfcd7c7240f0ab9935bac5c78e) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Collapsible` — one section of content shown and hidden by its own trigger. Controlled (`isOpen` / `onOpenChange`) or uncontrolled (`defaultOpen`), with `Collapsible.Trigger`, `.Title`, `.Description`, `.Indicator` and `.Content`. The panel's height is measured and sprung, so whatever sits below follows it; the panel mounts on first open and stays mounted, and a closed panel leaves the accessibility tree. Shares `Accordion`'s variants, sizes and motion, and `bunx delacour add collapsible` copies it without pulling in an accordion.

- [#136](https://github.com/delacournz/delacour-ui/pull/136) [`c03d5bb`](https://github.com/delacournz/delacour-ui/commit/c03d5bb4ff0c18a5f19ba8430dd94db081e9ae0d) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Fab`, one primary action floating over the screen it belongs to. `placement` pins it to the
  bottom start, centre or end of its nearest positioned ancestor, clear of the safe area, or leaves it
  in flow when omitted; sizes are 44, 56 and 64pt from new `--spacing-fab-*` tokens, in `primary`,
  `secondary`, `surface` and `destructive`. `isExtended` with `Fab.Label` makes a labelled stadium.
  `Fab.Group` unfolds a dial of `Fab.Action`s over a scrim from one spring with a stagger, turns its
  plus into a cross, unmounts the actions once closed, closes on the scrim, an action or Android back,
  and takes `isOpen` / `defaultOpen` / `onOpenChange`. `delacour add fab` copies it in.

- [#93](https://github.com/delacournz/delacour-ui/pull/93) [`3c33ec0`](https://github.com/delacournz/delacour-ui/commit/3c33ec0acd6b1665f93c7f500f1b74b2f7ea23bf) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Item`, a row of media, text and actions for lists and settings. It renders as a `Pressable` when given `onPress` and as a plain view otherwise, has `default`, `outline` and `muted` surfaces, `sm`/`md`/`lg` sizes, a `vertical` orientation for cards, `isDisabled` and `isSelected` states, and `Item.Media` (bare icon, icon tile or clipped image), `Item.Content`, `Item.Title`, `Item.Description`, `Item.Actions`, `Item.Header`, `Item.Footer`, `Item.Group` and `Item.Separator`. Dropped into a `ListGroup` it takes the group's size, draws no surface of its own and lines up with the group's dividers. The CLI can now `add item`.

- [#85](https://github.com/delacournz/delacour-ui/pull/85) [`4383198`](https://github.com/delacournz/delacour-ui/commit/438319823f65968c8551a8260fbe862d324066b8) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Label`, a form control's name with required, invalid and disabled states

  `Label` renders `Text.Label` and takes a colour, never a scale, so it keeps the type scale the rest
  of a form uses. `isRequired` appends a destructive asterisk as a nested run behind a no-break space,
  so a label that wraps carries the mark after its last word, and announces the label as
  "Email, required" rather than reading the asterisk aloud. `isInvalid` turns it destructive and
  `isDisabled` fades it and reports it disabled to assistive technology.

  ```tsx
  import { Label } from "@delacour/react-native-ui/label";

  <Label isRequired>Email</Label>;
  ```

  `bunx delacour add label` copies it in, bringing `text` and `tv` with it.

- [#138](https://github.com/delacournz/delacour-ui/pull/138) [`7d260fd`](https://github.com/delacournz/delacour-ui/commit/7d260fdf6101311b592315b2e490f41b12a7f809) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `ProgressButton`, a button held rather than tapped to confirm. A fill grows from the leading
  edge over `holdDuration` (2000 ms by default) and `onComplete` fires only when it reaches the end,
  read from the animation's own finish rather than a timer. Released early, the fill plays back at the
  same rate, and a second press resumes from where it is. Every variant (`primary`, `secondary`,
  `destructive`, `success`) rests on the same surface and carries its colour in a label drawn twice,
  so the text stays readable across the wipe. It takes the button's sizes and a `pill` or `rounded`
  shape, draws a tick on completion or a caller's `ProgressButton.Done`, rewinds by travelling back
  with `isAutoReset` or a controlled `isCompleted`, steps in fifths under reduced motion, and
  completes on a screen reader's activate. `delacour add progress-button` copies it in.

- [#91](https://github.com/delacournz/delacour-ui/pull/91) [`ecf81ca`](https://github.com/delacournz/delacour-ui/commit/ecf81ca23b5d6baca611a4e4cf6de4438719e974) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Rating`, a row of stars that reads or sets a score. Tap a star or drag along the row to set it, in whole stars or any step that divides one (`step={0.5}` for halves); a read-only rating draws any value, filling a fraction of a star. `allowClear` lets a tap on the value held withdraw it, `Rating.Output` shows the value, and the row is one adjustable control to screen readers. Six colours, three sizes, and `isInvalid` / `isDisabled` cascade from a `Field`. `bunx delacour add rating` copies it.

- [#96](https://github.com/delacournz/delacour-ui/pull/96) [`8da14c4`](https://github.com/delacournz/delacour-ui/commit/8da14c4248ae6ea2f75f35969d62b4978b26cad9) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Skeleton`, a placeholder for content that is still loading

  It comes in three shapes — `rect`, `line` and `circle` — and either shimmers a glint across itself or pulses its opacity, on the UI thread. Pass the real content as children and the placeholder takes its exact size, then fades the content in when `isLoading` flips off with nothing moving. `Skeleton.Lines` draws a paragraph, and `Skeleton.Group` keeps every skeleton inside it on one clock and one loading flag. Motion stops under the OS reduce-motion setting, and a placeholder stays hidden from screen readers unless it has a `label`. `bunx delacour add skeleton` copies it in.

- [#99](https://github.com/delacournz/delacour-ui/pull/99) [`1de172e`](https://github.com/delacournz/delacour-ui/commit/1de172e68c91530f7e737bf1008dc2fa26ccad24) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Steps`, a stepper for multi-step flows

  `Steps` shows where someone is in a flow: numbered indicators joined by a line, each step completed, current or
  upcoming against one zero-based `value`. It runs horizontally, with titles under the indicators, or vertically, with
  titles and descriptions beside them, in two variants and three sizes. The connectors are drawn for you — the root
  counts its `Steps.Item`s and every one but the last draws a line to the next, filled once the value has passed it.

  A step can be loading (a spinner in the indicator), invalid (a cross and a destructive title) or disabled, and
  `completed` overrides whether it reads as done. Steps take presses and move the value there; `isLinear` keeps the
  steps ahead closed, and a controlled `value` with no `onValueChange` is a read-only progress display whose steps are
  not announced as buttons. `Steps.Panel` holds a step's form or summary below its title, outside the tap target, so its
  controls stay reachable by a screen reader. Each step is announced as its title with a value such as "Step 2 of 3,
  completed".

  `bunx delacour add steps` copies it into your project.

- [#89](https://github.com/delacournz/delacour-ui/pull/89) [`f24334f`](https://github.com/delacournz/delacour-ui/commit/f24334f1882d10553b920d8db4ce10e231f76865) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Textarea`, a multiline text field sized in rows. It renders `Input`'s box — variants, sizes, focus, invalid, disabled and the `Field` cascade — and adds a height derived from `rows` and the size's line height, `autoGrow` up to `maxRows`, and a `showCount` character count against `maxLength` that turns destructive at the limit. `delacour add textarea` copies it, with `input` and `text` as registry dependencies.

- [#84](https://github.com/delacournz/delacour-ui/pull/84) [`0377ff9`](https://github.com/delacournz/delacour-ui/commit/0377ff9299c669ea073643434ff5e0afc5c06a38) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `ToggleButton`, a button that stays pressed. On its own it is controlled with `isSelected` and
  `onSelected` or holds its own state from `defaultSelected`; inside `ToggleButton.Group` the group
  owns one array of selected values, in `multiple` or `single` selection mode, with
  `isSelectionRequired` to keep the last choice from being cleared. Each state draws with one of the
  button's own variants (`default`, `outline`, `ghost`), so sizes, icons, loading and press feedback
  are the button's. An attached group joins into one run like `Button.Group`; a detached one wraps
  with a gap. The state is announced as a toggle button that is checked, or as a selected radio in a
  single-choice group. `delacour add toggle-button` copies it in.

- [#35](https://github.com/delacournz/delacour-ui/pull/35) [`ac1c4fe`](https://github.com/delacournz/delacour-ui/commit/ac1c4fe3768868236b740fc2202d334ce0704166) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `init` copies the root provider in and `doctor` accepts `DelacourProvider` as the gesture root

  `delacour init` now adds the `provider` item alongside `styles`, so `DelacourProvider` is in the
  `ui` directory before anything is mounted, and its follow-up list names that import rather than a
  bare `GestureHandlerRootView`. `doctor`'s Gesture Handler check passes on either name, reads a
  blank template's root `App.tsx` as well as `app/` and `src/`, and no longer counts the copied
  `provider.tsx` itself as the app mounting it.

- [#49](https://github.com/delacournz/delacour-ui/pull/49) [`b8689cd`](https://github.com/delacournz/delacour-ui/commit/b8689cdc8210c4856edbbe28de5ee8b070616afe) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `add` sets the project up itself

  `add` no longer fails on a project with no `native-components.json`. It runs `init` first — writing
  the config, wrapping Metro, pointing Tailwind at the components and copying the theme and the root
  provider in — and then adds what was asked for. That was previously a prompt, and only where there
  was a terminal to ask in, so `--yes`, CI and every MCP call hit `MissingConfigError` while a human
  sailed past. `--no-init` is the opt-out, and `-s, --src <dir>` forwards to `init` so a template that
  keeps its files at the project root still needs one command.

  `init` now returns the result of the `add` it ends on, so a caller that set a project up still
  learns what the components need from npm.

  New MCP tool `init_project`, for the layout an agent cannot infer — a shared package in a monorepo,
  or a source directory that is not `src`. `add_components` needs it no more often than a person
  needs `init`.

- [#25](https://github.com/delacournz/delacour-ui/pull/25) [`c0a7ca4`](https://github.com/delacournz/delacour-ui/commit/c0a7ca4dfb4e97e09c97b6335f19c657c7535616) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - One theme file, the same shape everywhere

  `theme.css` is now the one file in `styles/` that is yours, and its header says so. What
  `delacour init` ships, what the docs site's `/theme` page emits with no preset, and what
  `delacour theme` writes are held to the same shape, declaration for declaration.

  **`delacour theme` converts `theme.css` in place.** Paste a shadcn or tweakcn `globals.css` over
  the file and run the command with no argument: a file already in Uniwind's shape is left alone, a
  shadcn-shaped one is rewritten, and anything else is named. `delacour doctor` fails on a `theme.css`
  still in shadcn's `:root` / `.dark` shape, which Uniwind reads as a utility class named `dark` and a
  dark theme that never arrives.

  **The converter fills what shadcn v4 stopped declaring.** `--destructive-foreground` — which
  `Button`, `Badge`, `Switch`, `Slider` and `Checkbox` all paint with — and the shadow scale are now
  derived when a source omits them, and the light `--elevated` derivation follows the card, as the
  shipped file already did.

  **The shipped defaults are shadcn's current ones.** The chart ramp is the neutral greys `shadcn
init` writes today, and the default typeface is each platform's own sans rather than Geist, which a
  fresh app had never loaded. The `/theme` page shows `theme.css` first, with shadcn's `globals.css`
  in a second tab for a web app sharing the theme.

- [#51](https://github.com/delacournz/delacour-ui/pull/51) [`09ea8bf`](https://github.com/delacournz/delacour-ui/commit/09ea8bfa066e1749622aee2a26fd511bb6be3348) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `delacour skills` installs an agent skill

  An agent asked for "a button" writes plausible JSX — the right shape, and none of the parts that
  matter: the icon that inherits its size from the button's context, the spinner that _replaces_ the
  icon so the label does not shift, the `expo install` route for the native modules underneath.

  `bunx delacour@alpha skills` installs a skill into whichever assistants a project uses — Claude
  Code, Cursor, OpenCode or Codex, detected from the directories present, or named with `--agent`, in
  `--scope project` or `user`. The files are bundled into the binary, so a run works offline and
  installs the skill matching the version you are pinned to. The docs site serves the same bytes at
  `/skills/delacour-ui/SKILL.md`.

  The skill names no component on purpose. A catalogue on someone's disk is stale the day the next
  component ships, and silently so — it teaches `list`, `view`, `add` and `doctor` instead, and spends
  its own words on the failures that produce no error message.

### Patch Changes

- [#117](https://github.com/delacournz/delacour-ui/pull/117) [`2ee3fa2`](https://github.com/delacournz/delacour-ui/commit/2ee3fa29a51646a7d7e6b0d5bcc429864dd85ea5) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Fix `Accordion` and `Collapsible` panels that never opened on their first expand in Release builds

  The item's effect decided "has the panel measured?" by reading the measured height's shared value
  on the JS thread, straight after the panel's `onLayout` had written it. That write is queued onto
  the UI runtime and the read does not drain the queue, so a Release build read the unmeasured
  sentinel every time, bailed, and nothing re-ran it — the trigger said expanded and the panel stayed
  shut. Debug builds were slow enough to hide it. "Measured" is now React state, the decision is a
  pure `accordionTravelTarget` / `collapsibleTravelTarget`, and a test sweeps both components for any
  JS-thread read of the height.

- [#94](https://github.com/delacournz/delacour-ui/pull/94) [`8e6fedd`](https://github.com/delacournz/delacour-ui/commit/8e6fedd7aff8a274325ca2e85cdf41511eb65ea3) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Alert`, a status message on a `Surface`

  Five statuses — `default`, `info`, `success`, `warning` and `destructive` — pick the leading glyph
  and colour it and the title from one token, while the description stays muted. `variant="soft"`
  washes the surface in the status's soft fill; `variant="surface"` keeps a neutral fill that steps
  off whatever it sits in. Three sizes move padding, type and glyph together. Composed from
  `Alert.Indicator`, `Alert.Content`, `Alert.Title`, `Alert.Description`, `Alert.Action` and
  `Alert.CloseButton`; `isDismissible` adds the close control, uncontrolled or through `isOpen` /
  `onOpenChange`, and `useAlert().dismiss` closes it from an action. `bunx delacour add alert` copies
  it into a project, with `surface` alongside.

- [#95](https://github.com/delacournz/delacour-ui/pull/95) [`e84ab6d`](https://github.com/delacournz/delacour-ui/commit/e84ab6dd133ef99510878a216bbd5cbaa525e97a) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Card`, a content surface with a header, a body and a footer

  Built on `Surface`, so it takes the same four fills and steps to the next one when nested. Six parts —
  `Card.Header`, `Card.Title`, `Card.Description`, `Card.Action`, `Card.Content` and `Card.Footer` —
  share one inset through context across three sizes, and the padding lives on the parts, so media placed
  straight in the card reaches its edges. `Card.Action` is pinned to the header's corner wherever it is
  written, the title follows the foreground token of the card's fill, and `Card.Footer variant="band"`
  sets the footer into the card on the next fill down. `useCard()` exposes the size and fill to custom
  parts, and `bunx delacour add card` copies it into a project, with `surface` alongside.

- [#116](https://github.com/delacournz/delacour-ui/pull/116) [`e9ef1d4`](https://github.com/delacournz/delacour-ui/commit/e9ef1d4055a8159c5edab24658d03bedd6057b6f) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `add bottom-sheet` installs the engine instead of the library it replaced: `@delacour/react-native-bottom-sheet` from npm, and `react-native-teleport` through `expo install`, because it ships a Fabric portal view and needs a rebuild. `@gorhom/bottom-sheet` has left the install map, `doctor` watches `react-native-teleport` for a duplicated copy in a monorepo, and its New Architecture failure now names `BottomSheet`, whose portal does not render on the old one.

- [#106](https://github.com/delacournz/delacour-ui/pull/106) [`333d83b`](https://github.com/delacournz/delacour-ui/commit/333d83b10ca8c18722d02c792b9f69eed4a5231c) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Install Delacour packages from the CLI's own release line. An alpha CLI (`delacour@alpha`) adds `@delacour/react-native-ui@alpha` and `@delacour/react-native-charts@alpha`, and a stable CLI adds them untagged from `latest`. A peer on a Delacour package is still written as `>=0.0.0-0`, so either line satisfies it.

- [#125](https://github.com/delacournz/delacour-ui/pull/125) [`1c4284b`](https://github.com/delacournz/delacour-ui/commit/1c4284b916dfceb20a097f19e926e640dc0672f2) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Dialog`, a centred card over a dimmed app that asks for a decision or a short input

  `@delacour/react-native-ui/dialog`, and `delacour add dialog`. A compound root with `Trigger`,
  `Content`, `Close`, `Header`, `Title`, `Description`, `Body` and `Footer`, drawn through the overlay
  foundation, so it sits above every bottom sheet and the navigator's header. `isOpen` /
  `defaultOpen` / `onOpenChange`, and `isDismissible={false}` for an alert dialog that only its own
  actions close. Four sizes (`sm`, `md`, `lg`, `full`), a `plain` or `panel` footer that stacks on
  `sm`, a card that lifts just clear of the keyboard, a fade-only entrance under Reduce Motion, and
  accessibility focus that moves to the title on open and back to the trigger on close.

  Also: `Overlay.Portal`'s missing-provider warning no longer names the npm package, so a copied
  overlay carries no reference to it.

- [#129](https://github.com/delacournz/delacour-ui/pull/129) [`41506f8`](https://github.com/delacournz/delacour-ui/commit/41506f844caa291d9dd14ec63652b4d80b726333) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Drawer`, a panel that slides in from an edge and covers the app until dismissed

  `@delacour/react-native-ui/drawer`, and `delacour add drawer`. A compound root with `Trigger`,
  `Content`, `Header`, `Title`, `Description`, `Body`, `Footer` and `Close`, drawn through the overlay
  foundation, so it sits above every bottom sheet and the navigator's header. Four sides — `start` and
  `end` swap under RTL, plus `top` and `bottom` — and four sizes as a capped fraction of the window.
  Swipe toward the edge to dismiss: past 40% or on a fling it carries on from the finger, short of that
  it eases back, a selection haptic marks the threshold and the scrim thins with the drag. The panel
  pads the safe-area insets on its screen sides, fades instead of sliding under Reduce Motion, and
  moves accessibility focus to the title on open and back to the trigger on close.

- [#86](https://github.com/delacournz/delacour-ui/pull/86) [`1d02f49`](https://github.com/delacournz/delacour-ui/commit/1d02f49b03e8c07064296892c504bbe247646a35) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `EmptyState`

  A placeholder for a list or screen with nothing in it. `EmptyState.Header` stacks `Media`, `Title` and
  `Description`, and `EmptyState.Content` holds the actions. `variant="card"` draws a dashed block for an
  empty section beside populated ones, and `size` scales the padding, media and type together. A bare
  `Icon` in `Media` inherits its size and colour, and `Media variant="icon"` tints a box behind it.

  `delacour add empty-state` copies it into a project.

- [#130](https://github.com/delacournz/delacour-ui/pull/130) [`b646977`](https://github.com/delacournz/delacour-ui/commit/b6469779f61d090262f95c4f9b17ae796850ad9b) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Feedback`, a dialog for writing — the field in a recessed well, the actions on the band around it

  `@delacour/react-native-ui/feedback`, and `delacour add feedback`. Built on `Dialog`, so open state,
  portal, scrim, back, escape, focus and the keyboard lift are Dialog's. A compound root with
  `Trigger`, `Content`, `Panel`, `Title`, `Close`, `Field`, `Footer`, `Action`, `Cancel` and `Submit`,
  and `useFeedback()`. The draft is `value` / `defaultValue` / `onValueChange` on the root and survives
  close and reopen until `clear()`. `Submit` is gated by `canSubmitFeedback` (empty and whitespace are
  empty, `canSubmitEmpty` for chips or a rating), passes the trimmed text, shows its loading state and
  makes the field read-only while a returned promise is in flight, and never closes on its own. The
  well eases to its measured height when a multi-step flow swaps its content, so the card never
  jumps; under Reduce Motion it changes height at once. The field grows from `minRows` (6) to
  `maxRows` (12) before it scrolls, and takes the title's text as its label.

- [#98](https://github.com/delacournz/delacour-ui/pull/98) [`d5944d4`](https://github.com/delacournz/delacour-ui/commit/d5944d4004e987797a2994dc6a62e0f327946dcc) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Kpi`, one number, its change and a sparkline of how it got there

  Built on `Card`, so it takes the card's four fills and three sizes and sits on the card's inset. `Kpi.Trend`
  takes a signed percentage and colours it by what it means rather than by its sign — `goodDirection` on the
  card says whether up, down or neither is good news, and every trend inside follows it — as a line of text or
  a badge with an arrow, announced as one string. `Kpi.Sparkline` is a `Chart` line with no axes in the card's
  series colour, under the number or in a fixed column beside it, and holding it scrubs a point: the KPI keeps
  the scrubbed index as controllable state that `useKpi()` reads. `isLoading` holds placeholders of each part's
  size, and `Kpi.Group` lays several metrics out in a row or a column, optionally on one surface with rules
  between. `Chart` gains `frameClassName`, which sizes the plot's frame. `bunx delacour add kpi` copies it into a
  project, with `card` and `chart` alongside.

- [#120](https://github.com/delacournz/delacour-ui/pull/120) [`033b774`](https://github.com/delacournz/delacour-ui/commit/033b7743238fbdc3fa2aef46f1c2613cf78f4a5f) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `OverlayProvider`, the layer every overlay is drawn on

  `@delacour/react-native-ui/overlay` mounts the one teleport host that overlays and bottom sheets
  share, and a registry that orders them in bands — every overlay above every sheet, an anchored
  panel above the dialog that opened it, a toast above both — and gives Android's back button to the
  topmost overlay only. `Overlay.Portal`, `Overlay.Scrim`, `useOverlayPresence` (keeps an overlay
  mounted through its exit animation) and `useOverlayBackHandler` are exported for building more.
  `BottomSheetProvider` now detects an `OverlayProvider` above or below it and mounts teleport's
  provider only once; the engine's provider takes `hasPortalProvider` to make that possible.
  `bunx delacour add overlay` copies it into a project.

- [#127](https://github.com/delacournz/delacour-ui/pull/127) [`927ab21`](https://github.com/delacournz/delacour-ui/commit/927ab21f808163c5ccea7b8f379df7b9a9dec2bf) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Popover` — a small panel anchored to its trigger that flips and shifts to stay inside the safe area and above the keyboard, with an arrow that keeps pointing at the trigger, a title, a description, a close control, an optional scrim, `width="trigger"` and a scrollable body. Its anchoring pieces — `resolveAnchoredPosition`, `useAnchorMeasure`, `useAnchoredContent` and `AnchoredArrow` — are exported for other anchored overlays. `delacour add popover` copies it.

- [#83](https://github.com/delacournz/delacour-ui/pull/83) [`fd2209e`](https://github.com/delacournz/delacour-ui/commit/fd2209e0a73141f4e9676be5c8d2ce1a73dc8258) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Surface`, a rounded container on the theme's fill ladder

  Four fills — `default`, `secondary`, `tertiary` and `transparent` — and four padding steps. A
  surface that names no variant steps to the next fill from the one it sits in, so a panel inside a
  card never vanishes into it, and a transparent surface passes the plane beneath it through.
  `useSurface()` exposes the resolved fill to custom children, and `padding="none"` clips, for
  content bled to the corners. `bunx delacour add surface` copies it into a project.

- [#122](https://github.com/delacournz/delacour-ui/pull/122) [`2937efb`](https://github.com/delacournz/delacour-ui/commit/2937efbf85072786ceb18853ce5f7c90d686d628) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Toast` — a brief message shown with `toast()` from anywhere, including outside React, and drawn by one `<ToastViewport />` mounted inside `OverlayProvider`. Toasts stack at the top or bottom edge, three drawn with the newest in front and the rest queued; they sit above the home indicator and the keyboard, pause their clock while touched or backgrounded, and swipe away toward their edge or sideways. Statuses, glyphs and title colours are `Alert`'s; `toast.promise` turns one loading toast into the success or the failure in place; `render` composes a custom card from `<Toast>`'s parts. Each toast is announced as it appears and stays at least ten seconds under a screen reader. Alert's status glyphs move to the `alert-glyphs.ts` leaf so the two share them. `delacour add toast` copies it.

- [#128](https://github.com/delacournz/delacour-ui/pull/128) [`dd83873`](https://github.com/delacournz/delacour-ui/commit/dd83873544ef43ae2db1f12372398fc9528f4466) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Tooltip` — a short label anchored to its control that opens on a long press (or a press, with `openOn="press"`), hides itself after `duration`, and closes on any outside tap while letting that tap through to what it landed on. It flips and shifts like `Popover`, has an inverted and a surface variant, an arrow that points at the trigger, and reads its `label` to a screen reader on the trigger without opening. `OverlayProvider` now hears every touch that starts beneath it, through `subscribeTouchStart`, without claiming any. `delacour add tooltip` copies it.

- [#48](https://github.com/delacournz/delacour-ui/pull/48) [`04bc15b`](https://github.com/delacournz/delacour-ui/commit/04bc15b32e86416bf32f4cece2fdf4e6af495f5b) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Publish the libraries under the `@delacour` org

  `delacour-react-native-ui` is now `@delacour/react-native-ui`, and `delacour-react-native-charts` is now
  `@delacour/react-native-charts`. The old names are deprecated and take no further versions. (Both were briefly spelled
  `@delacour/native-ui` and `@delacour/charts` in this repository; neither reached npm, so the line
  above is the whole story for anyone installing.) Nothing about the
  components changed — swap the package and the import prefix:

  ```bash
  bun remove delacour-react-native-ui delacour-react-native-charts
  bun add @delacour/react-native-ui@alpha @delacour/react-native-charts@alpha
  ```

  ```diff
  - import { Button } from "delacour-react-native-ui/button";
  + import { Button } from "@delacour/react-native-ui/button";
  ```

  and in `global.css`, `@import '@delacour/react-native-ui/styles';`.

  The CLI keeps its name. `delacour add chart` now installs `@delacour/react-native-charts`.

- [#22](https://github.com/delacournz/delacour-ui/pull/22) [`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add bar, scatter, candlestick and pie charts, stacked areas and horizontal bars

  **`@delacour/react-native-charts`** gains four marks and a second root. `ChartBar` draws
  one bar per datum on a cubic-cornered rect path, so a corner radius animates
  without snapping; sibling bars share a step and bars naming one `stackId`
  stack in data space, so the y domain covers the running totals rather than
  the tallest series. `ChartArea` takes the same `stackId`. `ChartScatter` is
  one Skia path per series, and `ChartCandlestick` draws every candle through every sentiment
  path so a colour flip is a morph rather than a cut. `orientation="horizontal"`
  swaps the axis roles at the model, so bars grow rightward from a category
  axis. `PolarChart` is the new root, with `PieSlices` on a fixed-verb path
  that morphs between any two data sets and a scrub-free tap that resolves a
  slice index. `@delacour/react-native-charts/core` exports the bar, scatter, candle and
  slice geometry alongside the scales.

  **`@delacour/react-native-ui/chart`** skins all of it. `Chart.Bar`, `Chart.Scatter`
  and `Chart.Candlestick` join `Chart.Line` and `Chart.Area`; bars group by
  being siblings, stack by sharing a `stackId`, round their value end from
  `--radius`, and take `labels`. Candles borrow `success`, `destructive` and
  `muted-foreground` for their sentiment. Over bars or candles `Chart.Tooltip.X`
  becomes a band one step wide. `PieChart` is a second root — `PieChart.Slice`,
  `.Label`, `.Center`, `.Tooltip` and `.Legend` — whose categories are its rows,
  with `innerRadius` for a donut and a tap-driven readout.

  Series colours now dedupe before the theme lookup, so twenty slices walking
  the five-token ramp resolve five tokens rather than throwing past the eighth.

  The CLI's chart registry item picks up the new files and names the new marks
  in its description.

- [#52](https://github.com/delacournz/delacour-ui/pull/52) [`9bf93d6`](https://github.com/delacournz/delacour-ui/commit/9bf93d67c6078e0ca512f8b265431753174c87b6) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Teach one verb, and hold the docs to the CLI

  The Quick start forks before the first command — a new app, an existing one, or hand it to an
  agent — and lands all three on one rendered Button. It scaffolds Expo's `with-router-uniwind`
  example and never names `init`: `add` does that setup itself, so a reader learns one verb.

  The landing page's hero says `add` too, the package path names Uniwind as a real setup step with
  links to its own guide, and a handful of claims that had gone stale are corrected — the registry
  holds no copy of the library's source, `/llms.txt` lives on `ui.delacour.co.nz`, and the releases
  page no longer reports a version that was never published.

  `docs-commands.test.ts` walks the commander program and holds every copyable `delacour …` in the
  repository to it — verb, long flags, positional arity, and whether a component named in an example
  is in the registry. It caught `add --src` before a reader did.

- [#72](https://github.com/delacournz/delacour-ui/pull/72) [`cc9fb6a`](https://github.com/delacournz/delacour-ui/commit/cc9fb6afb7e2e4babe83653a9bf38c3278fc9c25) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - List every native peer in the install command. The charts README's `expo install` line named only Skia, and `delacour add chart` skipped Gesture Handler — the scrub and the pie's tap then never fire, with no error.

- [#104](https://github.com/delacournz/delacour-ui/pull/104) [`21f692a`](https://github.com/delacournz/delacour-ui/commit/21f692af764ca3bf8adea2c36f6395bcaa13223f) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Point the "registry may be newer than this CLI" hint at `--ref develop`. `main` now moves only on a release, so unreleased components live on `develop`.

- [#50](https://github.com/delacournz/delacour-ui/pull/50) [`1f0042b`](https://github.com/delacournz/delacour-ui/commit/1f0042bf4737075e596ff58a2e4a29babf07c6e8) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `doctor` stops failing correct Metro configs, and tells you a path you can paste

  - **`withUniwindConfig is not the outermost wrapper`, when it was.** The check required the export
    expression to _begin_ with `withUniwindConfig`, so it failed both
    `const c = withUniwindConfig(…); module.exports = c;` and the reassignment a Metro config uses
    when it applies several wrappers in turn — `config = withUniwindConfig(config, …)`. A wrapper
    genuinely applied after Uniwind still fails, which is the point of the check.
  - **`cssEntryFile does not point at the configured entry` restated the problem rather than the
    fix.** It now says which file Metro actually compiles and why that is the one that has to win.
  - **The CSS import it told you to add did not resolve.** It was `./` plus the file's basename,
    which is right only when the root layout sits in the same directory as the CSS. On the ordinary
    Expo Router layout it is `../styles/global.css`, and that is what both `doctor` and `init` now
    print — from one function.

- [#50](https://github.com/delacournz/delacour-ui/pull/50) [`1f0042b`](https://github.com/delacournz/delacour-ui/commit/1f0042bf4737075e596ff58a2e4a29babf07c6e8) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Adopt the Tailwind entry an app already has, and print the root layout

  **One entry, never two.** `init` picked `<src>/styles/global.css` unless a wrapped Metro config
  named another, so an app that had installed Uniwind and written its own `global.css` — without
  wiring Metro to it yet — got a second entry. Tailwind then compiled the file holding the `@source`
  globs while the app imported the one without them: every component unstyled, nothing logged, and
  `doctor` reporting that nothing imports the entry. An entry already on disk is now adopted.

  **The root layout is printed whole.** Two of the three follow-ups are edits to one file, so `init`
  shows that file rather than describing it — and detects Expo Router, whose root layout is a
  different file with a different shape (`app/_layout.tsx` rendering a `<Slot />`, not `App.tsx`).
  The bullet and the snippet take their import paths from one function, so they cannot disagree.

- [#55](https://github.com/delacournz/delacour-ui/pull/55) [`1947da7`](https://github.com/delacournz/delacour-ui/commit/1947da72a7b9c53aed55c6865c6f7c8985b04cb5) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Refresh the lockfile and drop an obsolete patch

  `bun.lock` pinned `expo-modules-jsi@57.0.5` while a dependency already required `~57.1.0`, so
  `bun install --frozen-lockfile` failed the moment anything forced a re-resolve. The patch that
  pinning existed for — declaring `retainRuntimeScheduler` / `releaseRuntimeScheduler` for Swift
  bridging — ships in `57.1.0` itself, so it and its `patchedDependencies` entry are gone.

- [#49](https://github.com/delacournz/delacour-ui/pull/49) [`b8689cd`](https://github.com/delacournz/delacour-ui/commit/b8689cdc8210c4856edbbe28de5ee8b070616afe) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Stop the last line suggesting a command that already ran

  `add` delegates to `init` whenever a project has no config, so a run that copied `button` in ended
  on _"Ready. `delacour add button` to get started."_ — the command the reader had just run. The outro
  now names what landed instead: _"Ready. `button` is yours to edit."_

  It no longer mentions `doctor` either. The follow-up block directly above it already ends on
  `delacour doctor`, and two consecutive lines pointing at the same command read as a glitch rather
  than as emphasis.

- [#22](https://github.com/delacournz/delacour-ui/pull/22) [`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add charts: a headless Skia engine, and the `Chart` component that skins it

  **`@delacour/react-native-charts` is new** — a token-free charting engine for React Native,
  drawn with Skia, animated with Reanimated and driven by Gesture Handler. It
  ships `CartesianChart` with `Line`, `Area`, `Grid` and both axes, a scrub whose
  dot rides the drawn curve rather than hopping between data points, and path
  morphing that never falls back to snapping. `@delacour/react-native-charts/core` is every
  scale, tick, curve and solver in it, importable with no Skia in the module graph.

  **`@delacour/react-native-ui/chart`** is that engine wearing the theme. A shadcn-shaped
  `config` names each series and assigns `--chart-1` … `--chart-5` by position, so
  a call site writes `<Chart.Line yKey="revenue" />` and never a colour. Parts are
  placed rather than configured: `Chart.Grid`, `Chart.Line`, `Chart.Area`,
  `Chart.XAxis` and `Chart.YAxis` draw into the canvas, while `Chart.Tooltip` and
  `Chart.Legend` are React Native views layered over and under it.

  Also new: `--spacing-chart-sm/md/lg`, because a canvas has no intrinsic height
  and a dashboard's rows only line up if every chart agrees on one.

  **This needs a dev-client rebuild.** `@shopify/react-native-skia` is a native
  module and is new to the workspace — run `expo prebuild --clean` and rebuild
  before running the playground.

  The CLI learns two things: how to install a Skia-backed component, and that
  `@delacour/react-native-charts` publishes to the `alpha` tag while this repository is in pre
  mode, since a bare `bun add` of it would resolve `latest` and find nothing.

- [#50](https://github.com/delacournz/delacour-ui/pull/50) [`1f0042b`](https://github.com/delacournz/delacour-ui/commit/1f0042bf4737075e596ff58a2e4a29babf07c6e8) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Work correctly on a project that already has Uniwind

  Three bugs, all found against Expo's `with-router-uniwind` example — a scaffold that arrives with
  Uniwind, Tailwind and Metro already wired.

  - **`init` wrote its `@source` block into a file Metro does not compile.** A wired Metro config
    names its own `cssEntryFile`, and `init` recorded `<src>/styles/global.css` regardless — so
    Tailwind scanned a file with no globs in it, every class the components use was dropped, and
    every component rendered unstyled with nothing logged. It now reads `cssEntryFile` and `dtsFile`
    off the wrapped config and records those.
  - **`doctor` failed the official template.** Its outermost-wrapper check required the export
    expression to begin with `withUniwindConfig`, and that template assigns the wrapped config to a
    variable before exporting it. The exported name is now followed to the last thing assigned to it
    above the export, a few hops deep.
  - **`init` asked for a CSS import that was already there.** The follow-up list is now built from
    what the project actually has, so neither the CSS import nor the provider is listed once it is
    mounted.

- [#50](https://github.com/delacournz/delacour-ui/pull/50) [`1f0042b`](https://github.com/delacournz/delacour-ui/commit/1f0042bf4737075e596ff58a2e4a29babf07c6e8) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Refuse to stack a second Tailwind transform

  Nothing noticed when a project already had **NativeWind**. It is Tailwind for React Native too: it
  compiles `className`, and it does that by wrapping Metro. Wrapping Metro again on top of it leaves
  classes resolving through whichever wrapper ran last and a build that fails naming neither library.

  `init` now warns before it touches `metro.config.js`, and `doctor` carries a `Styling` check that
  keeps saying so.

  It is deliberately not fixed automatically. Which of the two a project keeps is the owner's call,
  and uninstalling someone's styling library is not a thing a component CLI gets to do — so the
  message points at Uniwind's migration guide instead.

## 0.1.0-alpha.6

### Patch Changes

- [#104](https://github.com/delacournz/delacour-ui/pull/104) [`21f692a`](https://github.com/delacournz/delacour-ui/commit/21f692af764ca3bf8adea2c36f6395bcaa13223f) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Point the "registry may be newer than this CLI" hint at `--ref develop`. `main` now moves only on a release, so unreleased components live on `develop`.

## 0.1.0-alpha.5

### Patch Changes

- [#72](https://github.com/delacournz/delacour-ui/pull/72) [`cc9fb6a`](https://github.com/delacournz/delacour-ui/commit/cc9fb6afb7e2e4babe83653a9bf38c3278fc9c25) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - List every native peer in the install command. The charts README's `expo install` line named only Skia, and `delacour add chart` skipped Gesture Handler — the scrub and the pie's tap then never fire, with no error.

## 0.1.0-alpha.4

### Minor Changes

- [#49](https://github.com/delacournz/delacour-ui/pull/49) [`b8689cd`](https://github.com/delacournz/delacour-ui/commit/b8689cdc8210c4856edbbe28de5ee8b070616afe) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `add` sets the project up itself

  `add` no longer fails on a project with no `native-components.json`. It runs `init` first — writing
  the config, wrapping Metro, pointing Tailwind at the components and copying the theme and the root
  provider in — and then adds what was asked for. That was previously a prompt, and only where there
  was a terminal to ask in, so `--yes`, CI and every MCP call hit `MissingConfigError` while a human
  sailed past. `--no-init` is the opt-out, and `-s, --src <dir>` forwards to `init` so a template that
  keeps its files at the project root still needs one command.

  `init` now returns the result of the `add` it ends on, so a caller that set a project up still
  learns what the components need from npm.

  New MCP tool `init_project`, for the layout an agent cannot infer — a shared package in a monorepo,
  or a source directory that is not `src`. `add_components` needs it no more often than a person
  needs `init`.

- [#51](https://github.com/delacournz/delacour-ui/pull/51) [`09ea8bf`](https://github.com/delacournz/delacour-ui/commit/09ea8bfa066e1749622aee2a26fd511bb6be3348) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `delacour skills` installs an agent skill

  An agent asked for "a button" writes plausible JSX — the right shape, and none of the parts that
  matter: the icon that inherits its size from the button's context, the spinner that _replaces_ the
  icon so the label does not shift, the `expo install` route for the native modules underneath.

  `bunx delacour@alpha skills` installs a skill into whichever assistants a project uses — Claude
  Code, Cursor, OpenCode or Codex, detected from the directories present, or named with `--agent`, in
  `--scope project` or `user`. The files are bundled into the binary, so a run works offline and
  installs the skill matching the version you are pinned to. The docs site serves the same bytes at
  `/skills/delacour-ui/SKILL.md`.

  The skill names no component on purpose. A catalogue on someone's disk is stale the day the next
  component ships, and silently so — it teaches `list`, `view`, `add` and `doctor` instead, and spends
  its own words on the failures that produce no error message.

### Patch Changes

- [#52](https://github.com/delacournz/delacour-ui/pull/52) [`9bf93d6`](https://github.com/delacournz/delacour-ui/commit/9bf93d67c6078e0ca512f8b265431753174c87b6) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Teach one verb, and hold the docs to the CLI

  The Quick start forks before the first command — a new app, an existing one, or hand it to an
  agent — and lands all three on one rendered Button. It scaffolds Expo's `with-router-uniwind`
  example and never names `init`: `add` does that setup itself, so a reader learns one verb.

  The landing page's hero says `add` too, the package path names Uniwind as a real setup step with
  links to its own guide, and a handful of claims that had gone stale are corrected — the registry
  holds no copy of the library's source, `/llms.txt` lives on `ui.delacour.co.nz`, and the releases
  page no longer reports a version that was never published.

  `docs-commands.test.ts` walks the commander program and holds every copyable `delacour …` in the
  repository to it — verb, long flags, positional arity, and whether a component named in an example
  is in the registry. It caught `add --src` before a reader did.

- [#50](https://github.com/delacournz/delacour-ui/pull/50) [`1f0042b`](https://github.com/delacournz/delacour-ui/commit/1f0042bf4737075e596ff58a2e4a29babf07c6e8) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `doctor` stops failing correct Metro configs, and tells you a path you can paste

  - **`withUniwindConfig is not the outermost wrapper`, when it was.** The check required the export
    expression to _begin_ with `withUniwindConfig`, so it failed both
    `const c = withUniwindConfig(…); module.exports = c;` and the reassignment a Metro config uses
    when it applies several wrappers in turn — `config = withUniwindConfig(config, …)`. A wrapper
    genuinely applied after Uniwind still fails, which is the point of the check.
  - **`cssEntryFile does not point at the configured entry` restated the problem rather than the
    fix.** It now says which file Metro actually compiles and why that is the one that has to win.
  - **The CSS import it told you to add did not resolve.** It was `./` plus the file's basename,
    which is right only when the root layout sits in the same directory as the CSS. On the ordinary
    Expo Router layout it is `../styles/global.css`, and that is what both `doctor` and `init` now
    print — from one function.

- [#50](https://github.com/delacournz/delacour-ui/pull/50) [`1f0042b`](https://github.com/delacournz/delacour-ui/commit/1f0042bf4737075e596ff58a2e4a29babf07c6e8) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Adopt the Tailwind entry an app already has, and print the root layout

  **One entry, never two.** `init` picked `<src>/styles/global.css` unless a wrapped Metro config
  named another, so an app that had installed Uniwind and written its own `global.css` — without
  wiring Metro to it yet — got a second entry. Tailwind then compiled the file holding the `@source`
  globs while the app imported the one without them: every component unstyled, nothing logged, and
  `doctor` reporting that nothing imports the entry. An entry already on disk is now adopted.

  **The root layout is printed whole.** Two of the three follow-ups are edits to one file, so `init`
  shows that file rather than describing it — and detects Expo Router, whose root layout is a
  different file with a different shape (`app/_layout.tsx` rendering a `<Slot />`, not `App.tsx`).
  The bullet and the snippet take their import paths from one function, so they cannot disagree.

- [#55](https://github.com/delacournz/delacour-ui/pull/55) [`1947da7`](https://github.com/delacournz/delacour-ui/commit/1947da72a7b9c53aed55c6865c6f7c8985b04cb5) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Refresh the lockfile and drop an obsolete patch

  `bun.lock` pinned `expo-modules-jsi@57.0.5` while a dependency already required `~57.1.0`, so
  `bun install --frozen-lockfile` failed the moment anything forced a re-resolve. The patch that
  pinning existed for — declaring `retainRuntimeScheduler` / `releaseRuntimeScheduler` for Swift
  bridging — ships in `57.1.0` itself, so it and its `patchedDependencies` entry are gone.

- [#49](https://github.com/delacournz/delacour-ui/pull/49) [`b8689cd`](https://github.com/delacournz/delacour-ui/commit/b8689cdc8210c4856edbbe28de5ee8b070616afe) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Stop the last line suggesting a command that already ran

  `add` delegates to `init` whenever a project has no config, so a run that copied `button` in ended
  on _"Ready. `delacour add button` to get started."_ — the command the reader had just run. The outro
  now names what landed instead: _"Ready. `button` is yours to edit."_

  It no longer mentions `doctor` either. The follow-up block directly above it already ends on
  `delacour doctor`, and two consecutive lines pointing at the same command read as a glitch rather
  than as emphasis.

- [#50](https://github.com/delacournz/delacour-ui/pull/50) [`1f0042b`](https://github.com/delacournz/delacour-ui/commit/1f0042bf4737075e596ff58a2e4a29babf07c6e8) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Work correctly on a project that already has Uniwind

  Three bugs, all found against Expo's `with-router-uniwind` example — a scaffold that arrives with
  Uniwind, Tailwind and Metro already wired.

  - **`init` wrote its `@source` block into a file Metro does not compile.** A wired Metro config
    names its own `cssEntryFile`, and `init` recorded `<src>/styles/global.css` regardless — so
    Tailwind scanned a file with no globs in it, every class the components use was dropped, and
    every component rendered unstyled with nothing logged. It now reads `cssEntryFile` and `dtsFile`
    off the wrapped config and records those.
  - **`doctor` failed the official template.** Its outermost-wrapper check required the export
    expression to begin with `withUniwindConfig`, and that template assigns the wrapped config to a
    variable before exporting it. The exported name is now followed to the last thing assigned to it
    above the export, a few hops deep.
  - **`init` asked for a CSS import that was already there.** The follow-up list is now built from
    what the project actually has, so neither the CSS import nor the provider is listed once it is
    mounted.

- [#50](https://github.com/delacournz/delacour-ui/pull/50) [`1f0042b`](https://github.com/delacournz/delacour-ui/commit/1f0042bf4737075e596ff58a2e4a29babf07c6e8) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Refuse to stack a second Tailwind transform

  Nothing noticed when a project already had **NativeWind**. It is Tailwind for React Native too: it
  compiles `className`, and it does that by wrapping Metro. Wrapping Metro again on top of it leaves
  classes resolving through whichever wrapper ran last and a build that fails naming neither library.

  `init` now warns before it touches `metro.config.js`, and `doctor` carries a `Styling` check that
  keeps saying so.

  It is deliberately not fixed automatically. Which of the two a project keeps is the owner's call,
  and uninstalling someone's styling library is not a thing a component CLI gets to do — so the
  message points at Uniwind's migration guide instead.

## 0.1.0-alpha.3

### Patch Changes

- [#48](https://github.com/delacournz/delacour-ui/pull/48) [`04bc15b`](https://github.com/delacournz/delacour-ui/commit/04bc15b32e86416bf32f4cece2fdf4e6af495f5b) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Publish the libraries under the `@delacour` org

  `delacour-react-native-ui` is now `@delacour/react-native-ui`, and `delacour-react-native-charts` is now
  `@delacour/react-native-charts`. The old names are deprecated and take no further versions. Nothing about the
  components changed — swap the package and the import prefix:

  ```bash
  bun remove delacour-react-native-ui delacour-react-native-charts
  bun add @delacour/react-native-ui@alpha @delacour/react-native-charts@alpha
  ```

  ```diff
  - import { Button } from "delacour-react-native-ui/button";
  + import { Button } from "@delacour/react-native-ui/button";
  ```

  and in `global.css`, `@import '@delacour/react-native-ui/styles';`.

  The CLI keeps its name. `delacour add chart` now installs `@delacour/react-native-charts`.

## 0.1.0-alpha.2

### Minor Changes

- [#35](https://github.com/delacournz/delacour-ui/pull/35) [`ac1c4fe`](https://github.com/delacournz/delacour-ui/commit/ac1c4fe3768868236b740fc2202d334ce0704166) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `init` copies the root provider in and `doctor` accepts `DelacourProvider` as the gesture root

  `delacour init` now adds the `provider` item alongside `styles`, so `DelacourProvider` is in the
  `ui` directory before anything is mounted, and its follow-up list names that import rather than a
  bare `GestureHandlerRootView`. `doctor`'s Gesture Handler check passes on either name, reads a
  blank template's root `App.tsx` as well as `app/` and `src/`, and no longer counts the copied
  `provider.tsx` itself as the app mounting it.

## 0.1.0-alpha.1

### Minor Changes

- [#25](https://github.com/delacournz/delacour-ui/pull/25) [`c0a7ca4`](https://github.com/delacournz/delacour-ui/commit/c0a7ca4dfb4e97e09c97b6335f19c657c7535616) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - One theme file, the same shape everywhere

  `theme.css` is now the one file in `styles/` that is yours, and its header says so. What
  `delacour init` ships, what the docs site's `/theme` page emits with no preset, and what
  `delacour theme` writes are held to the same shape, declaration for declaration.

  **`delacour theme` converts `theme.css` in place.** Paste a shadcn or tweakcn `globals.css` over
  the file and run the command with no argument: a file already in Uniwind's shape is left alone, a
  shadcn-shaped one is rewritten, and anything else is named. `delacour doctor` fails on a `theme.css`
  still in shadcn's `:root` / `.dark` shape, which Uniwind reads as a utility class named `dark` and a
  dark theme that never arrives.

  **The converter fills what shadcn v4 stopped declaring.** `--destructive-foreground` — which
  `Button`, `Badge`, `Switch`, `Slider` and `Checkbox` all paint with — and the shadow scale are now
  derived when a source omits them, and the light `--elevated` derivation follows the card, as the
  shipped file already did.

  **The shipped defaults are shadcn's current ones.** The chart ramp is the neutral greys `shadcn
init` writes today, and the default typeface is each platform's own sans rather than Geist, which a
  fresh app had never loaded. The `/theme` page shows `theme.css` first, with shadcn's `globals.css`
  in a second tab for a web app sharing the theme.

### Patch Changes

- [#22](https://github.com/delacournz/delacour-ui/pull/22) [`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add bar, scatter, candlestick and pie charts, stacked areas and horizontal bars

  **`@delacour/react-native-charts`** gains four marks and a second root. `ChartBar` draws
  one bar per datum on a cubic-cornered rect path, so a corner radius animates
  without snapping; sibling bars share a step and bars naming one `stackId`
  stack in data space, so the y domain covers the running totals rather than
  the tallest series. `ChartArea` takes the same `stackId`. `ChartScatter` is
  one Skia path per series, and `ChartCandlestick` draws every candle through every sentiment
  path so a colour flip is a morph rather than a cut. `orientation="horizontal"`
  swaps the axis roles at the model, so bars grow rightward from a category
  axis. `PolarChart` is the new root, with `PieSlices` on a fixed-verb path
  that morphs between any two data sets and a scrub-free tap that resolves a
  slice index. `@delacour/react-native-charts/core` exports the bar, scatter, candle and
  slice geometry alongside the scales.

  **`@delacour/react-native-ui/chart`** skins all of it. `Chart.Bar`, `Chart.Scatter`
  and `Chart.Candlestick` join `Chart.Line` and `Chart.Area`; bars group by
  being siblings, stack by sharing a `stackId`, round their value end from
  `--radius`, and take `labels`. Candles borrow `success`, `destructive` and
  `muted-foreground` for their sentiment. Over bars or candles `Chart.Tooltip.X`
  becomes a band one step wide. `PieChart` is a second root — `PieChart.Slice`,
  `.Label`, `.Center`, `.Tooltip` and `.Legend` — whose categories are its rows,
  with `innerRadius` for a donut and a tap-driven readout.

  Series colours now dedupe before the theme lookup, so twenty slices walking
  the five-token ramp resolve five tokens rather than throwing past the eighth.

  The CLI's chart registry item picks up the new files and names the new marks
  in its description.

- [#22](https://github.com/delacournz/delacour-ui/pull/22) [`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add charts: a headless Skia engine, and the `Chart` component that skins it

  **`@delacour/react-native-charts` is new** — a token-free charting engine for React Native,
  drawn with Skia, animated with Reanimated and driven by Gesture Handler. It
  ships `CartesianChart` with `Line`, `Area`, `Grid` and both axes, a scrub whose
  dot rides the drawn curve rather than hopping between data points, and path
  morphing that never falls back to snapping. `@delacour/react-native-charts/core` is every
  scale, tick, curve and solver in it, importable with no Skia in the module graph.

  **`@delacour/react-native-ui/chart`** is that engine wearing the theme. A shadcn-shaped
  `config` names each series and assigns `--chart-1` … `--chart-5` by position, so
  a call site writes `<Chart.Line yKey="revenue" />` and never a colour. Parts are
  placed rather than configured: `Chart.Grid`, `Chart.Line`, `Chart.Area`,
  `Chart.XAxis` and `Chart.YAxis` draw into the canvas, while `Chart.Tooltip` and
  `Chart.Legend` are React Native views layered over and under it.

  Also new: `--spacing-chart-sm/md/lg`, because a canvas has no intrinsic height
  and a dashboard's rows only line up if every chart agrees on one.

  **This needs a dev-client rebuild.** `@shopify/react-native-skia` is a native
  module and is new to the workspace — run `expo prebuild --clean` and rebuild
  before running the playground.

  The CLI learns two things: how to install a Skia-backed component, and that
  `@delacour/react-native-charts` publishes to the `alpha` tag while this repository is in pre
  mode, since a bare `bun add` of it would resolve `latest` and find nothing.
