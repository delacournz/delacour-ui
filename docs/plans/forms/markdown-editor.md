# MarkdownEditor

- **Status**: spec, not started
- **Wave**: 1 (independent)
- **Depends on**: `Textarea`, `Input` (ref, selection props), `Tabs`, `Text` presets, `Button`/`Pressable`/`ToggleButton`, `Field`, `Separator`, `Surface`. No new peers.

## Purpose on mobile
Write rich text as Markdown with a one-row formatting toolbar above the keyboard, and flip to a rendered preview. For notes, comments, descriptions, release notes. Single column; no side-by-side split on phones.

## Behaviour reference (summary)
- Write and Preview modes switched from the toolbar (controlled or uncontrolled mode).
- Toolbar actions: heading, bold, italic, inline code, code block, link, quote, bullet list, ordered list; configurable order/subset; two looks (full-width bar, floating icon-only pill).
- Selection behaviour: with a selection, inline actions wrap it and keep it selected; with a caret, they insert markers and place the caret between them. Applying the same action again undoes it (toggle). Line actions (heading, quote, lists) apply to every touched line. Inline markers never span a line break.
- Return continues a list (`- `, `1. `, `> `); Return on an empty item ends the list.
- Monospaced, autocorrect/autocapitalise off in the write pane. Rows control height.
- Preview renders the same small subset the toolbar can produce, using the library's `Text` presets, with an empty-state message.
- Disabled blocks editing and toolbar. Optional keyboard avoidance.
- Active-format state on toolbar buttons from caret position.
- Parser is plain JS, identical on iOS/Android.

## API

```ts
export type MarkdownHeadingLevel = 1 | 2 | 3;

/** Discriminated union: one member per toolbar action. */
export type MarkdownCommand =
  | { type: "bold" } | { type: "italic" } | { type: "code" } | { type: "strikethrough" }
  | { type: "codeBlock" } | { type: "quote" }
  | { type: "bulletList" } | { type: "orderedList" }
  | { type: "heading"; level: MarkdownHeadingLevel }
  | { type: "link"; url?: string };            // url omitted -> inserts "url" placeholder and selects it

export type MarkdownSelection = { start: number; end: number };   // start <= end, UTF-16 offsets as TextInput reports
export type MarkdownEdit = { text: string; selection: MarkdownSelection };

export function applyMarkdownCommand(text: string, selection: MarkdownSelection, command: MarkdownCommand): MarkdownEdit;
export function getActiveMarkdownCommands(text: string, selection: MarkdownSelection): readonly MarkdownCommand["type"][];
export function continueMarkdownList(prev: string, next: string): MarkdownEdit | null;

export type MarkdownMode = "write" | "preview";
export type MarkdownEditorSize = "sm" | "md" | "lg";
export type MarkdownEditorVariant = "primary" | "secondary";
export type MarkdownToolbarVariant = "bar" | "pill";

export type MarkdownEditorProps = {
  value?: string; defaultValue?: string;
  onValueChange?: (value: string) => void;
  mode?: MarkdownMode; defaultMode?: MarkdownMode;
  onModeChange?: (mode: MarkdownMode) => void;
  placeholder?: string;
  rows?: number;                          // default 8, Textarea semantics
  size?: MarkdownEditorSize; variant?: MarkdownEditorVariant;
  isDisabled?: boolean; isInvalid?: boolean; isReadOnly?: boolean;
  continueLists?: boolean;                // default true
  haptic?: false | HapticFeedback;
  onLinkPress?: (url: string) => void;    // preview; default Linking.openURL for safe schemes only
  ref?: Ref<MarkdownEditorHandle>;
  className?: string; children?: ReactNode;
};
export type MarkdownEditorHandle = { apply: (command: MarkdownCommand) => void; focus: () => void; getActive: () => readonly MarkdownCommand["type"][] };
export function useMarkdownEditor(): MarkdownEditorState;   // value, mode, setMode, apply, active, isDisabled…
```

Parts (Pattern B): `MarkdownEditor.Toolbar` (`variant`, `actions`, `showModeSwitch`), `.Input` (the write pane), `.Preview` (`emptyText`, `className`), plus internal `.Action`. Bare `<MarkdownEditor />` renders Toolbar + Input + Preview (only the active pane shown).

```tsx
<Field>
  <Field.Label>Description</Field.Label>
  <MarkdownEditor defaultValue="# Title" rows={8} onValueChange={setDoc}>
    <MarkdownEditor.Toolbar actions={["bold", "italic", "link", "bulletList"]} />
    <MarkdownEditor.Input placeholder="Write something..." />
    <MarkdownEditor.Preview emptyText="Nothing to preview" />
  </MarkdownEditor>
</Field>
```

Parser (pure, in `markdown-editor.parse.ts`):
```ts
export type MarkdownInline =
  | { type: "text"; value: string } | { type: "bold"; children: MarkdownInline[] }
  | { type: "italic"; children: MarkdownInline[] } | { type: "strikethrough"; children: MarkdownInline[] }
  | { type: "code"; value: string } | { type: "link"; url: string; children: MarkdownInline[] };
export type MarkdownBlock =
  | { type: "heading"; level: MarkdownHeadingLevel; children: MarkdownInline[] }
  | { type: "paragraph"; children: MarkdownInline[] }
  | { type: "quote"; children: MarkdownBlock[] }
  | { type: "list"; ordered: boolean; start: number; items: MarkdownInline[][] }
  | { type: "codeBlock"; language: string | null; value: string };
export function parseMarkdown(source: string): MarkdownBlock[];
```
Preview mapping: heading 1/2/3 -> `Text.Title`/`Text.Header`/`Text.Subheader` (Subheader is muted; use `Text.Label` bold? DECISION: h3 = `Text.Paragraph` with `Strong` and larger weight via preset `Text.Header` size `sm` if supported; the implementer picks and records it in AGENTS.md); paragraph -> `Text.Paragraph`; bold/italic -> `Text.Strong`/`Text.Emphasis`; code -> `Text.Code`; link -> `Text.Link`; quote -> View with `border-l-2 border-border pl-3` around muted paragraph; code block -> `Surface`-like `bg-muted rounded-lg p-3` View + `Text.Code`; list -> rows with marker Text + content.

## Variants & sizes
- `size` `sm|md|lg`: field text step (`text-input-*`), toolbar button size (Button `icon-*` sizes), pane padding.
- `variant`: `primary|secondary` pass-through to the Textarea (filled vs outlined) and to the preview container (`bg-muted` vs bordered).
- Toolbar `bar`: row on `bg-card`/`border-border` top-attached to the pane, horizontally scrollable when actions overflow, mode switch pinned at the end. `pill`: floating capsule (`bg-elevated`) icon-only, centred above the pane.
- Mode switch is `Tabs` variant primary (sizes mapped), two triggers "Write" / "Preview", `isSwipeable={false}` (the pager would fight text selection). Tabs.Content panels hold the Input and Preview; verify that the Input keeps its text/selection when unmounted-by-pager: Tabs panels stay mounted? If not, keep value in the root and render panes outside Tabs (switch only the TabsList). **Decision**: use `Tabs` only for the list (`Tabs.List` + `Tabs.Trigger`, no `Tabs.Content`), root owns mode and renders the active pane. Record in AGENTS.md.

## States
default; focused (Textarea focus ring; toolbar buttons never take focus from the field: `onPressIn` applies, no blur); pressed (Pressable feedback); active (toolbar button `isSelected` look via ToggleButton semantic); disabled; invalid (Field cascade); readOnly (Input readOnly, formatting actions disabled, mode switch still works); empty preview (`emptyText` Caption); long content (preview scrolls inside parent, no nested scroll trap: preview is a plain View, the screen scrolls).

## Accessibility
- Input label from Field; toolbar `accessibilityRole="toolbar"`; each action `accessibilityRole="button"`, label ("Bold", "Italic", "Heading 1"...), `accessibilityState={{ selected: active }}`.
- Mode switch is Tabs (role tab, selected state, announced "Preview, tab 2 of 2").
- Preview: headings carry `accessibilityRole="header"` (Text.Title/Header do), links `role="link"`, list items "bullet" / "1." prefixed in the accessible text; preview container labelled "Preview".
- Dynamic Type: pane honours font scale; toolbar buttons min 44pt hit area.
- After an action, `AccessibilityInfo` announces "Bold applied/removed" (brief).

## Motion & haptics
- Mode change reuses Tabs' indicator spring (behavioural). Pane swap is an instant swap with a 120ms opacity fade (decorative, skipped under `useCalmMotion()`).
- Haptic: Pulsar selection tick on each toolbar action; none on typing. `haptic={false}` disables.
- Toolbar in `pill` slides with the keyboard via the existing `lib/keyboard-animation` leaf when `avoidKeyboard`-style behaviour is wanted (see out of scope: keep v1 to Field/Screen keyboard handling; the toolbar is rendered above the pane, not as a keyboard accessory).

## Reuses / new internal pieces / peer deps
- Reuses: `Textarea` (rows, autoGrow optional; passes `ref`, `selection`, `onSelectionChange`, `autoCorrect={false}`, `autoCapitalize="none"`, `spellCheck={false}`, mono font via `className="font-mono"`), `Tabs` (list only), `Button`/`ToggleButton` or `Pressable` for actions, `Text` presets, `Icon` (Central: bold, italic, code, link, quote, list glyphs; verify names in `icons/central`), `Field` context, `Separator`.
- Selection control caveat: RN's controlled `selection` fights the user's typing. Pattern: after `apply`, set `selection` state, then clear it to `undefined` on the next `onSelectionChange` that equals it (or after one frame). Pin the sequence in AGENTS.md and verify on both platforms in the playground.
- New: `markdown-editor.commands.ts` (pure), `markdown-editor.parse.ts` (pure), `markdown-editor-render.tsx` (maps blocks to Text), `markdown-editor-action.tsx`.
- Peer deps: none new. No markdown library (explicitly rejected: catalog rules, size, and the subset is tiny). `Linking` is react-native core.

## Files
```
components/markdown-editor/
  AGENTS.md  index.ts
  markdown-editor.tsx             root, value + mode (useControllableState), selection ref, Object.assign
  markdown-editor.context.tsx     context, useMarkdownEditor(), useMarkdownEditorPart()
  markdown-editor.types.ts        MarkdownCommand, MarkdownSelection, MarkdownEdit, handle, shared props
  markdown-editor.commands.ts     PURE: applyMarkdownCommand, getActiveMarkdownCommands, continueMarkdownList
  markdown-editor.commands.test.ts
  markdown-editor.parse.ts        PURE: parseMarkdown, isSafeUrl
  markdown-editor.parse.test.ts
  markdown-editor.variants.ts     slotted tv() + resolvers; NO RN imports
  markdown-editor.variants.test.ts
  markdown-editor-toolbar.tsx  markdown-editor-input.tsx  markdown-editor-preview.tsx
  markdown-editor-action.tsx  markdown-editor-render.tsx   (internal)
```
Plus brief's repo-wide checklist (AGENTS row, gen-exports, demos, route, index row, gen-demos, docs mdx + meta.json, registry ITEM_META/PACKAGE_INSTALL + registry:build, changeset minor ui + delacour).

## Pure logic to unit-test
`applyMarkdownCommand` (text, selection -> {text, selection}); `|` = caret, `[ ]` = selection:
- bold: `[hi]` -> `**[hi]**`; again on `**[hi]**` (selection inside markers or including them) -> `[hi]`; caret `|` -> `**|**`; again -> removed; selection across a newline wraps per line (markers never span a line break); selection already wrapped partially extends/normalises.
- italic `_x_` vs bold `**x**` do not confuse each other (`**[hi]**` + italic -> `**_[hi]_**`); `***x***` toggles correctly.
- code `` `x` ``; strikethrough `~~x~~`; codeBlock: fences with newlines, language-less, toggle off; caret on empty line inserts fenced template with caret inside.
- link: selection `[text]` -> `[[text]](url)` with `url` selected; no selection -> `[](|)`-style template per spec; selection that is a URL -> `[link](url)`; toggle off when inside `[t](u)` -> `t`.
- heading level n: sets `#`*n + space on every touched line; same level again removes; different level replaces; strips existing list/quote marker? (no: heading replaces only heading marker); CRLF not supported (normalise nothing, document).
- quote: `> ` prefix per touched line; toggle off when every line quoted; mixed lines -> add to the unquoted ones only? DECISION: if all quoted remove, else add to all.
- bullet/ordered: per-line `- ` / `1. 2. 3.` numbering restarts at 1 across touched lines; switching bullet<->ordered replaces the marker; toggle off; empty lines skipped.
- selection invariants: always `0 <= start <= end <= text.length`; reversed input selection normalised; selection after line commands covers the transformed lines; works at start/end of text and on empty text; surrogate pairs/emoji not split.
- `getActiveMarkdownCommands`: caret inside `**x**` -> bold; inside `_x_` -> italic; on `# ` line -> heading; on `- ` line -> bulletList; inside fenced block -> codeBlock; multiple results.
- `continueMarkdownList(prev, next)`: `"- a"` -> `"- a\n"` returns `"- a\n- "` caret after marker; `"1. a\n"` -> `"2. "`; `"> a\n"` -> `"> "`; Return on empty item (`"- a\n- "` + `\n`) removes the marker and ends list; non-newline edits -> null; paste of multi-char text -> null; nested indent preserved (`"  - a"`).
- `parseMarkdown`: each block kind; `#`..`###` (4+ hashes treated as paragraph or level 3: DECISION treat as paragraph); blank-line paragraph splitting; soft line breaks inside a paragraph join with `\n`; fenced code with/without language and unterminated fence (runs to end); nested inline (`**bold _both_**`); `*` and `_` intraword (`snake_case_name` not italic); escaped `\*`; links with parens-free urls, unsafe schemes (`javascript:`) dropped to plain text via `isSafeUrl` (allow http, https, mailto, tel); unclosed markers stay literal; ordered list start number; empty input -> `[]`; very long line performance (linear, no catastrophic regex backtracking: test a 100k-char pathological string finishes < 100ms).
- `variants.test`: tokens exist in both themes; size tables; state ladder; `bar|pill` slots.

## Playground demos (`apps/playground/src/demos/markdown-editor/`)
`basic` **hero**+capture; `preview-mode` capture (starts in preview with rich sample); `custom-toolbar` capture (subset actions); `pill-toolbar` capture; `in-field` (invalid + error); `controlled-mode`; `disabled-readonly`.

## Docs page outline
Intro/hero; Installation; Usage (basic, Field, controlled mode); Toolbar actions & variants; Supported Markdown subset (table, and what is NOT supported); Imperative handle / custom controls; `applyMarkdownCommand` and `parseMarkdown` as standalone exports; Security note (link schemes); Accessibility; API tables.

## Out of scope / follow-ups
Tables, images, nested lists beyond indent preservation, task lists, HTML, footnotes, syntax highlighting, live (WYSIWYG) rendering, mentions/slash commands, undo stack beyond the OS's, keyboard-accessory toolbar (needs native `InputAccessoryView`: follow-up), split view on tablets, export HTML.

## Acceptance checklist
- [ ] commands and parser pure, no RN imports, tests above green
- [ ] Toggle-twice restores the original text exactly (property test on a sample set)
- [ ] Selection stays correct after every command on iOS and Android (manual matrix in playground)
- [ ] Toolbar press never dismisses the keyboard
- [ ] Return list continuation works with hardware and soft keyboards
- [ ] Preview matches parser output; unsafe links not pressable
- [ ] Mode switch has no swipe conflict with text selection
- [ ] Field cascade + label; disabled/readOnly semantics
- [ ] VoiceOver/TalkBack: toolbar, tabs, preview headings
- [ ] displayName everywhere, AGENTS.md + table row, exports, demos, docs, registry, changeset
- [ ] No JSX comments, no `any`, semantic tokens only
