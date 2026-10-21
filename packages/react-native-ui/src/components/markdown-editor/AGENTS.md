# MarkdownEditor

A Markdown field for a phone: a one-row formatting toolbar, a monospaced write
pane, and a rendered preview, shown one at a time. For notes, comments,
descriptions and release notes. Pattern B — a root with context and dot-notation
parts.

`import { MarkdownEditor } from "@delacour/react-native-ui/markdown-editor";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/markdown-editor` |
| `markdown-editor.tsx` | Root: value and mode (`useControllableState`), the selection, the `Field` cascade, the handle, `Object.assign` |
| `markdown-editor.context.tsx` | `MarkdownEditorProvider`, `useMarkdownEditor()`, `useMarkdownEditorPart()` |
| `markdown-editor.types.ts` | `MarkdownCommand` (one member per action), `MarkdownSelection`, `MarkdownEdit`, `MarkdownMode`, `MarkdownToolbarAction`, `MarkdownEditorHandle` |
| `markdown-editor.commands.ts` | **Pure:** `applyMarkdownCommand`, `getActiveMarkdownCommands`, `continueMarkdownList`, `getNextHeadingLevel`, `normalizeMarkdownSelection` |
| `markdown-editor.parse.ts` | **Pure:** `parseMarkdown`, `parseInline`, `isSafeUrl`, the fence patterns |
| `markdown-editor.variants.ts` | **Pure:** slotted `tv()`, the size maps, action labels and the toolbar resolvers |
| `markdown-editor-toolbar.tsx` | `MarkdownEditor.Toolbar` — `bar` or `pill`, actions, the mode switch |
| `markdown-editor-action.tsx` | Internal: one toolbar toggle |
| `markdown-editor-input.tsx` | `MarkdownEditor.Input` — the write pane, on `Textarea` |
| `markdown-editor-preview.tsx` | `MarkdownEditor.Preview` — the preview pane |
| `markdown-editor-render.tsx` | Internal: parsed blocks → `Text` presets |
| `*.test.ts` | Commands, parser, variants |

## Design

- **No Markdown library.** The subset is the one the toolbar writes, the parser
  is a few hundred lines of linear scanning, and a dependency would mean a
  catalog entry for something a consumer copies with `delacour add`. A test
  runs a 100k-character pathological line through the parser and fails past
  100 ms — the regex backtracking a general-purpose parser would risk is the
  thing that guards against.
- **Formatting is data in, data out.** `applyMarkdownCommand(text, selection,
  command)` returns `{ text, selection }` and imports nothing from React
  Native, so every rule below is unit-testable and the same on
  both platforms. Each command is a list of splices applied in one pass, with
  the selection's ends carried through the same list — no command works out by
  hand how far an earlier insertion pushed the caret.
- **Inline actions never span a line break, and toggle.** A selection across
  lines is wrapped per line; pressing the same action on wrapped text removes
  it. Applying twice restores the original text exactly — the commands test
  holds that over a sample set. `_x_` is italic and `**x**` bold, so the two
  never mistake each other, and `***x***` toggles either.
- **Line actions apply to every touched line.** Heading, quote and the two
  lists. A quote with every line quoted comes off; otherwise every line gets
  one. A list switches kind in place; numbering restarts at 1 across the
  touched lines; empty lines are skipped. Heading replaces only a heading
  marker, never a list or quote one. CRLF is not normalised.
- **One heading button, not three.** It steps one, two, three, off from the
  caret's line (`getNextHeadingLevel`). A phone's toolbar is one row, and three
  near-identical glyphs would push everything else off it. `#### ` and deeper
  is a paragraph to the parser.
- **The controlled selection is held for one round trip, then released.**
  React Native's `selection` prop fights typing if it stays set. After a
  command the root sets `pendingSelection`; the field takes it, reports the
  same range back through `onSelectionChange`, and the root clears it to
  `undefined`. If the range was already where the field had it, no event
  comes, so a `requestAnimationFrame` clears it instead. Commands read the
  latest text and selection from refs, not render state, because a press can
  land between a change and the render it schedules. Verify both paths on iOS
  and Android whenever this changes.
- **The toolbar claims the touch, or the keyboard drops.** Actions are Gesture
  Handler taps, invisible to React Native's responder system, so a
  `keyboardShouldPersistTaps="handled"` scroll view above the editor — every
  `Screen.ScrollArea` — takes the touch and blurs the field. The toolbar's
  `onStartShouldSetResponder` claims it, and the action row's own
  `ScrollView` persists taps `always`.
- **Actions are ghost `ToggleButton`s, lit by the caret.** A format is on or
  off, and a toggle announces that; a plain button would only draw it.
  `isSelected` comes from `getActiveMarkdownCommands` at the caret, never from
  the press — the press runs the command, the command moves the caret, and the
  caret lights the button. Inside a fenced block the only active format is
  `codeBlock`. Sizes are the button's own `icon-*` steps
  (`MARKDOWN_EDITOR_ACTION_SIZE`), never a number.
- **The mode switch is a `Tabs` bar with no panels.** The root owns the mode
  and renders the active pane itself. A `Tabs.Content` pager would put the
  field inside a horizontal pan, which fights a text selection drag, and a
  panel's lifetime would decide whether the text survived. `isSwipeable` is
  off for the same reason. The switch stays usable when read-only, and
  disabled with the editor.
- **Only the active pane renders.** `Input` and `Preview` both return `null`
  for the other mode. The text lives in the root, so nothing is lost when the
  field unmounts. The preview fades in over 120 ms — decorative, skipped under
  `useCalmMotion()`.
- **A `bar` toolbar is the panes' lid.** It registers its look with the root
  (`registerToolbar`), and a pane under a `bar` drops its top corners
  (`resolveMarkdownPaneClass`) so bar and pane read as one box. A `pill` is a
  floating capsule above the pane and needs nothing from it; the capsule is
  the action scroller's own box, not its content's, so a row too long for the
  screen scrolls inside the capsule rather than having its end cut off.
- **The mode switch has a definite width per size.** Its triggers are
  `flex-1` in a bar that does not scroll, so with no width of its own it
  collapsed to its padding beside an action row that takes every point it is
  offered — seen on a simulator as an empty grey pill.
- **The preview restates the field's box.** `Input`'s `primary` is outlined
  on `bg-card` and its `secondary` filled `bg-secondary`, and its `etched` the same
  card fill with the highlight set into its edge; the preview draws the same
  three — a test reads `inputVariants` and fails if they part —
  so flipping modes never changes what kind of box is on screen. On the
  filled one an inline code run lifts to `bg-card`, or `Text.Code`'s muted run
  would vanish into it. Floored at the write pane's height
  (`resolveTextareaRowsHeight`) so flipping does not jump the screen. It is a
  plain view, never a scroller: a long document grows the pane and the screen
  scrolls, so there is no nested scroll to trap a thumb.
- **Heading three is `Text.Header` at `lg`.** One is `Text.Title`, two is
  `Text.Header`. The scale's next preset, `Text.Subheader`, is muted and
  deliberately not announced as a heading, so it would make a third-level
  heading a secondary line instead. All three carry the `header` role.
  Strikethrough has no `Text` preset and is a bare `Text` with `line-through`.
  A code block is a view around `Text.Code` with its own background cleared —
  the pattern `Text.Code`'s doc comment gives — but on `bg-card` with a
  hairline rather than `bg-muted`, which vanished into the filled preview on a
  simulator.
- **Links open only on an allow-list.** `isSafeUrl` passes `http`, `https`,
  `mailto` and `tel`; the parser drops anything else — `javascript:`, `data:`,
  `file:` — to its label as plain text, so there is nothing to press. The
  default `onLinkPress` checks again before `Linking.openURL`.
- **Autocorrect, autocapitalisation and spellcheck are off in the write pane.**
  Each rewrites markers as they are typed, and in source text a correction is
  a corruption.
- **`Field` cascades like `Input`.** An explicit `isDisabled`/`isInvalid` wins,
  then the enclosing `Field`'s. Disabled blocks the text, the toolbar and the
  mode switch; read-only keeps the text selectable, turns formatting off and
  leaves the mode switch working.
- **Every press is announced.** `AccessibilityInfo.announceForAccessibility`
  says "Bold applied" or "Bold removed", read from whether the format was
  active before the press. List items carry their marker in their accessible
  text, so a screen reader says "bullet" or "2." before the item.
- **`useMarkdownEditor()` is the custom-control hook.** A button of the
  caller's own can `apply` a command, read `active`, or `setMode`. A ref on the
  root reaches `apply`, `focus` (which switches to the write pane first) and
  `getActive`; `getActive` is rebuilt with the active set rather than read
  from a ref, because the React Compiler memoises a call on a stable
  function's identity.

## Out of scope

Tables, images, nested lists beyond indent preservation, task lists, HTML,
footnotes, syntax highlighting, live WYSIWYG rendering, mentions, an undo
stack beyond the OS's, a keyboard-accessory toolbar (needs a native
`InputAccessoryView`), a tablet split view, and HTML export.
