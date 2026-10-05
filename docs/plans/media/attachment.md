# Attachment — design spec

A file, image, video or recording that rides along with a message or sits in a composer
tray: a thumbnail or type glyph, a name, a size, an upload state and a way to take it
back out. Compound root plus `Attachment.Preview`, `.Content`, `.Name`, `.Meta`,
`.Progress`, `.Remove`, `.Retry` and a horizontal `Attachment.Group`.

`import { Attachment } from "@delacour/react-native-ui/attachment";`

## 1. Purpose on mobile

- **It is the unit of "something I am about to send, or just received".** Two homes:
  the composer tray (removable, uploading, errored) and inside a message bubble
  (read-only, tappable to open). One component, two `layout`s, rather than two.
- **What does not translate from a desktop file row.** No hover reveal for the remove
  button — a mobile remove control is always visible, 44pt hit area (`hitSlop` on a
  smaller glyph). No drag-and-drop zone and no right-click menu; long-press is the
  menu trigger and is an `onLongPress` the app owns. No file-picker: picking is the
  app's `expo-image-picker` / `expo-document-picker` call, and this component only
  renders the result. No inline preview of arbitrary documents — `onPress` hands off to
  the app (QuickLook, a viewer route).
- **Upload is state the app owns.** The component never uploads; it draws
  `status` and reports `onRemove` / `onRetry`. A component that started its own upload
  would lose it on an unmount mid-scroll in a recycled list.

## 2. Public API

```ts
type AttachmentKind = "image" | "video" | "audio" | "file";
type AttachmentLayout = "chip" | "tile" | "card";   // composer pill | square thumb | full-width row
type AttachmentSize = "sm" | "md" | "lg";

type AttachmentStatus =
  | { type: "idle" }
  | { type: "uploading"; progress?: number }        // 0..1; omitted = indeterminate
  | { type: "error"; message: string }
  | { type: "done" };

type AttachmentMedia =
  | { kind: "image"; source: ImageSourcePropType; width?: number; height?: number }
  | { kind: "video"; source?: ImageSourcePropType; durationMs?: number }   // poster frame
  | { kind: "audio"; durationMs?: number }
  | { kind: "file"; extension?: string };                                  // "pdf" -> glyph + badge

type AttachmentProps = AttachmentMedia & {
  name: string;
  sizeBytes?: number;
  status?: AttachmentStatus;                        // default { type: "done" }
  layout?: AttachmentLayout;                        // default "chip"
  size?: AttachmentSize;                            // default "md"
  isDisabled?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onRemove?: () => void;                            // presence renders Attachment.Remove by default
  onRetry?: () => void;                             // presence enables Retry in error state
  removeAccessibilityLabel?: string;                // default `Remove ${name}`
  className?: string;
  children?: ReactNode;                             // replaces the default parts
};

type AttachmentGroupProps = Omit<ScrollViewProps, "horizontal"> & {
  size?: AttachmentSize;
  layout?: AttachmentLayout;
  gap?: "sm" | "md";
  className?: string;
  contentContainerClassName?: string;
  children: ReactNode;
};
```

- **Parts:** `Attachment` (root), `Attachment.Preview`, `.Content`, `.Name`, `.Meta`,
  `.Progress`, `.Remove`, `.Retry`, `Attachment.Group`.
- **Default children.** Passing no children renders `Preview + Content(Name, Meta) +
  Progress + Remove`, so the 95% call site is one element. Passing children replaces
  that set entirely, as `Item` does.
- **Hook:** `useAttachment()` returns `{ kind, layout, size, status, isInteractive,
  isDisabled, name }` so a custom child matches the root. `useAttachmentPart()` throws
  outside a root.
- **Discriminated by `kind`.** `source` is required for `image` and impossible for
  `audio`/`file`, so a missing thumbnail is a type error, not a blank square.

## 3. File map

| File | Holds |
| --- | --- |
| `index.ts` | -> `@delacour/react-native-ui/attachment` |
| `attachment.tsx` | Root + `Object.assign` compound surface, default parts, press wiring |
| `attachment-preview.tsx` | Thumbnail (`Image` over a painted type glyph) |
| `attachment-content.tsx` | Name/meta column |
| `attachment-name.tsx` | Single-line, middle-truncated name |
| `attachment-meta.tsx` | "2.4 MB · PDF", duration, or the error message |
| `attachment-progress.tsx` | Upload bar / ring, wraps `Progress` |
| `attachment-remove.tsx` | Icon `Pressable` |
| `attachment-retry.tsx` | Icon `Pressable` shown in error |
| `attachment-group.tsx` | Horizontal `ScrollView` with gap and edge fade padding |
| `attachment.context.tsx` | `AttachmentProvider`, `useAttachment()`, `useAttachmentPart()` |
| `attachment.types.ts` | `AttachmentKind`, `AttachmentStatus`, `AttachmentMedia`, prop types |
| `attachment.variants.ts` | `tv()` slots + pure resolvers (no RN imports) |
| `attachment.variants.test.ts` | |
| `attachment.utils.ts` | `formatFileSize`, `formatDuration`, kind/extension inference, spoken label |
| `attachment.utils.test.ts` | |
| `AGENTS.md` | Decisions and the failure each prevents |

## 4. Variants and sizes

One slotted `tv()` (`attachmentVariants`): `root`, `preview`, `previewFallback`,
`glyph`, `content`, `name`, `meta`, `progress`, `action`, `scrim`, `group`.

- **Axes:** `layout` (`chip` / `tile` / `card`), `size` (`sm` / `md` / `lg`), `status`
  (`idle` / `uploading` / `error` / `done`), `interactive`, `disabled`.
- **`chip`:** `h-12 rounded-xl border border-border bg-card` (sm `h-10`, lg `h-14`),
  preview a `rounded-lg` square at the leading edge, remove at the trailing edge.
- **`tile`:** square, `size-20 / size-24 / size-32`, `rounded-xl overflow-hidden
  bg-muted`; name and meta collapse into the scrim; remove floats top-end on
  `bg-overlay`. Image fills the tile; non-images show the glyph centred.
- **`card`:** full width, `rounded-lg border border-border bg-card p-3`, meta and
  progress under the name. The message-bubble home.
- **Tokens only.** `bg-card`, `bg-muted`, `border-border`, `text-foreground`,
  `text-muted-foreground`, `bg-overlay`, `text-destructive`, `border-destructive`,
  `bg-destructive-soft`, `bg-primary` (progress fill), `bg-success-soft`. No raw
  palette, no hex.
- **Glyph tint per kind** is data, not four branches: `ATTACHMENT_KIND_GLYPH` maps
  `kind` to a Central Icon and a `-soft` colour pair; a test pins every pair to tokens
  that exist in both themes.
- **Radii follow the generic scale.** Chip/card step off `--radius` (`rounded-lg`,
  `rounded-xl`); no new `--radius-attachment-*`.
- **Sizes are fixed points, not font-scaled,** for the preview square and the tile
  (`ATTACHMENT_SIZE_POINTS`), so a tray lines up; the name and meta use `Text` and do
  scale. `ATTACHMENT_SIZE_POINTS` is pinned against the classes by a test.

## 5. States

- **idle** — queued, nothing sent. Preview as-is, meta shows size.
- **uploading** — determinate (`progress` 0..1) or indeterminate. Chip/card: a 2pt
  bar along the bottom edge. Tile: a dim scrim plus a ring `Progress` centred.
  Remove stays enabled (cancel); it reads "Cancel upload" while uploading.
- **error** — `border-destructive`, meta replaced by `message` in `text-destructive`,
  Retry replaces the progress slot when `onRetry` is given; Remove stays.
- **done** — plain.
- **pressed** — `Pressable` feedback on the whole root when `onPress` is set; the
  remove/retry buttons are siblings of that press target, not children of it, so their
  taps never fire the root.
- **disabled** — 50% opacity, no press, remove disabled.
- **image loading / failed** — glyph is painted underneath first and the `Image`
  mounts over it (the Avatar rule), so a dead URL leaves the type glyph, not a hole.
- **long names** — middle truncation keeps the extension visible (`report-q3-fin…ial.pdf`).

## 6. Accessibility

- **The root is one accessible element** with a composed label from
  `resolveAttachmentAccessibilityLabel`: "Photo, vacation.jpg, 2.4 megabytes,
  uploading 40 percent". `accessibilityRole="button"` only when `onPress` exists,
  otherwise `"image"` for images and `"text"` for the rest.
- **Remove and retry are accessibility actions, not a second element** — the Chip
  pattern: the buttons are hidden from the AX tree (`accessibilityElementsHidden`,
  `importantForAccessibility="no-hide-descendants"` on the button views) and the root
  declares `remove` / `retry` actions with `onAccessibilityAction`. Otherwise iOS folds
  them into the root and VoiceOver users cannot reach them.
- **Progress announcements are throttled.** The root sets `accessibilityValue` with
  rounded 10% steps (`resolveProgressAnnouncement`); a live region firing on every 1%
  tick would drown speech. Error state sets `accessibilityLiveRegion="polite"` on
  Android and posts an announcement on iOS once, on entry.
- **Hit areas.** Remove/retry glyph is `size-icon-sm` with `hitSlop` to 44pt.
- **Group** is `accessibilityRole="list"` with a label prop (`accessibilityLabel`,
  default "Attachments") and each child announces "n of m" via `accessibilityHint`
  set from the group's context index (children register with `Children.map` index).
- **Reduced motion.** Progress bar width changes are the behaviour, so they keep
  animating (shorter timing); the error shake is decoration and stills under
  `useCalmMotion()`.

## 7. Motion

- **Progress fill** — a Reanimated shared value driven by `withTiming(progress, 180ms)`
  on the width; same approach as `Progress.Fill`, and delegated to it (see Reuses).
- **Indeterminate** — Progress's own indeterminate loop; it is behaviour, so it keeps
  running under reduced motion, per the `calmMotion` rule.
- **Enter / exit in a group** — `entering={FadeIn}` / `exiting={FadeOut}` +
  `LinearTransition` on the group's children so removing one slides the rest. Stilled
  (no layout transition, instant) when `useCalmMotion()` is true.
- **Error** — one 2-step horizontal `withSequence` nudge on entry, decoration, stilled
  when calm.
- **Press** — inherited from `Pressable`; nothing added.

## 8. Reuses

`Pressable` (root and buttons), `Icon` + Central Icons (`IconFile`, `IconImage`,
`IconVideo`, `IconMicrophone`, `IconCrossSmall`, `IconRetry` — verify names against
`icons/central.ts`), `Text` (`Text.Label`, `Text.Caption` presets), `Progress` (bar and
ring fill, indeterminate), `Spinner` (not used; Progress covers it), `cn`, `tv`,
`useCalmMotion`, `useIconDefaults` provider for glyph sizing. React Native `Image` for
the thumbnail, `ScrollView` for the group. No `expo-image` (not a peer).

## 9. Dependencies

- **None new.** Everything is already a peer or a first-party component.
- **Registry:** `ITEM_META.attachment = { title: "Attachment", description: "A file,
  image or recording chip with a thumbnail, size, upload progress and remove control.",
  categories: ["messaging"] }`. `categories` is free-form (`z.array(z.string())`), but
  confirm no docs/registry test enumerates the closed set. `PACKAGE_INSTALL` needs no
  entry; the import scan sees only existing packages. The item's registry dependencies
  derive to `progress`, `pressable`, `icon`, `text`.

## 10. Sibling / cross-category dependencies

- **Ideal composition:** lives inside `Message` (as `Message.Attachments` content) and
  inside a future composer/`InputGroup` tray.
- **(a) Composes via children only. No import of `message`, `message-scroller` or
  any sibling.** Wave 1; can merge in any order. `Message` accepts it as children.
- **Other-category gaps and scoping:**
  - *Input Group / Composer* — absent. Attachment ships the tray element only; the
    composer stays app code. Defer.
  - *Image viewer / lightbox* — absent. `onPress` is the seam; defer.
  - *Menu / ContextMenu* — absent. `onLongPress` is the seam; defer.
  - *Toast* — absent. Error is shown inline, not as a toast.
  - Audio waveform preview — out of scope; audio shows glyph and duration only.

## 11. Pure logic to unit-test (TDD)

In `attachment.utils.ts` (write tests first):

- `formatFileSize(bytes: number, locale?: string): string` — `0 -> "0 B"`,
  `1023 -> "1,023 B"`, `1024 -> "1 KB"`, `1536 -> "1.5 KB"`, `2_516_582 -> "2.4 MB"`,
  `-1 | NaN -> ""`. Decimal (1000) vs binary (1024) pinned to 1024 with KB/MB labels.
- `formatDuration(ms: number): string` — `0 -> "0:00"`, `65_000 -> "1:05"`,
  `3_725_000 -> "1:02:05"`, negatives clamp to `0:00`.
- `resolveAttachmentKind(mimeType: string | undefined, name: string): AttachmentKind` —
  `"image/png" -> image`, `"video/mp4" -> video`, `"audio/m4a" -> audio`, unknown ->
  by extension (`.heic -> image`), else `file`.
- `resolveFileExtension(name: string): string | undefined` — `"a.tar.gz" -> "gz"`,
  `".env" -> undefined`, `"noext" -> undefined`, lowercases.
- `truncateMiddle(name: string, max: number): string` — keeps the extension:
  `("report-q3-final.pdf", 12) -> "repo…nal.pdf"`-style, never longer than `max`,
  short names unchanged.
- `clampProgress(value: number | undefined): number | undefined` — `1.2 -> 1`,
  `-1 -> 0`, `NaN -> undefined`.
- `resolveProgressAnnouncement(progress: number): number` — rounds to 10% steps;
  `0.44 -> 40`, `0.46 -> 50`.
- `resolveAttachmentAccessibilityLabel(input): string` — each kind x status cell.
- `resolveAttachmentInteractive({ onPress, isDisabled, status })` — an uploading
  attachment with `onPress` stays interactive; disabled never is.

In `attachment.variants.test.ts`: every slot class resolves for each axis cell; no
`self-*`, no `w-*` + `h-*` pair (use `size-*`); every colour token exists in both
themes (via `theme-tokens` reader); `ATTACHMENT_SIZE_POINTS` matches the classes;
`overflow-hidden` is on `tile` root only.

## 12. Playground demos (`apps/playground/src/demos/attachment/`)

| File | Description |
| --- | --- |
| `kinds.tsx` | image / video / audio / file in `chip` layout. **capture** |
| `layouts.tsx` | chip, tile, card side by side. **capture, hero** |
| `upload-states.tsx` | idle -> uploading (live progress) -> done, and error with retry. **capture** |
| `composer-tray.tsx` | `Attachment.Group` of removable chips that slide out on remove. **capture** |
| `sizes.tsx` | sm / md / lg in each layout |
| `truncation.tsx` | long names, no size, no extension |
| `in-message.tsx` | a `card` attachment inside a plain bubble `View` (children only) |
| `pressable-and-disabled.tsx` | open on press, disabled, long-press |
| `index.ts` | ordered `defineDemoGroup("attachment", {...})` |

Capture count 4; hero is `layouts`.

## 13. Docs page

`apps/web/content/docs/native/components/attachment.mdx`, frontmatter `title:
Attachment`, `icon: Paperclip`. Outline: `<Preview id="attachment/layouts" title={null}
/>`; Installation (`<ComponentInstall name="attachment" />`); Usage; Kinds; Layouts;
Upload states (controlled by the app, with a snippet using `onRemove`/`onRetry`);
Composer tray (`Attachment.Group`); Custom parts; Accessibility; API reference tables
(root, Group, parts, `useAttachment`). Joins a new `---Messaging---` section in
`meta.json` placed after Data Display, containing `attachment`, `message`,
`message-scroller`. Three sibling branches all add that header; the lead adds it once.

## 14. Acceptance checklist

- [ ] `attachment.utils.test.ts` and `attachment.variants.test.ts` written first, failing, then passing (`bun test packages/react-native-ui/src/components/attachment`)
- [ ] `bun run typecheck` clean; no `any`; `AttachmentMedia` and `AttachmentStatus` are discriminated unions
- [ ] `bun run check` (Biome) clean; kebab-case files; no comments inside JSX
- [ ] `AGENTS.md` in the folder; Components table row added in `packages/react-native-ui/AGENTS.md`
- [ ] `displayName` `DelacourUI.Attachment.<Part>` on the root and every part (`display-name.test.ts`)
- [ ] `bun run gen-exports` run and `package.json` exports committed
- [ ] Demos written, `bun run gen-demos`, `demos.test.ts` passes
- [ ] Route `apps/playground/src/app/(components)/attachment.tsx` + row in `src/app/index.tsx`
- [ ] Docs page `attachment.mdx` + `meta.json` entry
- [ ] `ITEM_META.attachment` added; `bun run registry:build` passes
- [ ] Changeset (`bun run changeset`, minor, `@delacour/react-native-ui`)
- [ ] Simulator check via `warden claim ios` + `agent-device`, release the lease
- [ ] Remove tap never fires the root `onPress`
- [ ] VoiceOver reads one element per attachment and offers Remove / Retry as actions
- [ ] Progress 0 -> 1 animates smoothly, error nudges once, both honour reduced motion
- [ ] Dead image URL leaves the glyph; long name keeps its extension
- [ ] Group scrolls horizontally, removing an item slides the rest, last item is not clipped by the edge
- [ ] Works inside a `Message` bubble (children only) with no import between the two folders
