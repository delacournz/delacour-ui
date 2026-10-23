# Attachment

A file, image, video or recording riding along with a message, or waiting in a composer tray:
a thumbnail or type glyph, a name, a size, an upload state and a way to take it back out.
Compound root plus `Attachment.Preview`, `.Content`, `.Name`, `.Meta`, `.Progress`, `.Remove`,
`.Retry` and a horizontal `Attachment.Group`.

`import { Attachment } from "@delacour/react-native-ui/attachment";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/attachment` |
| `attachment.tsx` | Root + the `Object.assign` compound surface, the default parts, press and accessibility wiring, the error nudge |
| `attachment-preview.tsx` | `Attachment.Preview` — the glyph on its tint with the `Image` over it; `ATTACHMENT_KIND_ICON` |
| `attachment-content.tsx` | `Attachment.Content` — the name/meta column, a frosted strip on a tile |
| `attachment-name.tsx` | `Attachment.Name` — one line, cut in the middle |
| `attachment-meta.tsx` | `Attachment.Meta` — `2.4 MB · PDF`, a duration, or the error message |
| `attachment-progress.tsx` | `Attachment.Progress` — a `Progress` bar, on a veil for a tile |
| `attachment-remove.tsx` | `Attachment.Remove` — the cross |
| `attachment-retry.tsx` | `Attachment.Retry` — shown in error |
| `attachment-group.tsx` | `Attachment.Group` — the horizontal tray with enter, exit and slide |
| `attachment.context.tsx` | `AttachmentProvider`, `useAttachment()`, `useAttachmentPart()`, the group and group-item contexts |
| `attachment.types.ts` | `AttachmentMedia` (discriminated by `kind`) and the shared part prop types |
| `attachment.variants.ts` | The slotted `tv()`, the size points, the kind tones, `AttachmentStatus`, `resolveAttachmentParts` — no RN imports |
| `attachment.variants.test.ts` | |
| `attachment.utils.ts` | Sizes, durations, kind and extension inference, middle truncation, every accessibility string |
| `attachment.utils.test.ts` | |

## Design

- **Axes**: `layout` — `chip`, `tile`, `card`; `size` — `sm`, `md`, `lg`; `kind` — `image`,
  `video`, `audio`, `file`; `status` — `idle`, `uploading`, `error`, `done`; `isDisabled`.
  `Attachment.Group` adds `gap` — `sm`, `md`.
- **One component, two homes.** The composer tray (removable, uploading, errored) wants a `chip`
  or a `tile`; a message bubble (read-only, tappable to open) wants a `card`. One component with
  a `layout` rather than two, because the state and the accessibility surface are the same.
- **Upload is state the app owns.** The component never uploads: it draws `status` and reports
  `onRemove` / `onRetry`. One that started its own upload would lose it the moment a recycled
  list unmounted the row mid-scroll.
- **`AttachmentMedia` is discriminated by `kind`.** `source` is required for `image` and does not
  exist for `audio` or `file`, so a photo with no thumbnail is a type error rather than a blank
  square. A video's `source` is its poster frame and is optional. A file's `extension` is read
  from its `name` when omitted.
- **`AttachmentStatus` lives in `attachment.variants.ts`**, not `attachment.types.ts`, so the pure
  resolvers in `attachment.utils.ts` can read it without importing a file that names React Native
  types. `attachment.types.ts` re-exports it.
- **Default children are the 95% case.** No children renders preview, name and meta, the bar
  while uploading, retry in error and remove when there is an `onRemove`. Children replace that
  set entirely, as `Item` does, and land inside the press target.
- **Remove and retry are siblings of the press target, not children of it.** The root is a plain
  `Animated.View`; inside it the press target (`press` slot — a `Pressable` only when there is a
  handler) holds the preview and text, and the actions sit beside it. A tap on the cross is
  claimed by a detector that is not inside the one that opens the attachment, so it can never
  fire both. Press feedback is `fade` on the press target only — the cross stays put while the
  content dims. A caller who composes `Attachment.Remove` into custom children puts it inside the
  press target; the inner detector still claims the tap, as `Chip.CloseButton` relies on.
- **Only the tile root clips.** A chip or card with `overflow-hidden` would clip its remove
  control's 44pt slop on Android, where a touch outside an `overflow: hidden` parent never lands.
  The picture rounds itself through the `image` slot instead, and a chip's upload bar sits in a
  `progressClip` layer — `absolute inset-0`, the chip's own `rounded-xl`, holding only the bar —
  so its ends follow the corner rather than hanging below the curve wherever a theme's `--radius`
  makes the corner wider than the bar's inset. A test pins `overflow-hidden` to the tile root.
- **Sizes are fixed points.** `ATTACHMENT_SIZE_POINTS` holds the preview square for chip and card,
  and the tile's own edge, and a test pins each to its `size-*` class. A tray of mixed
  attachments lines up whatever the reader's text size; the name and meta still scale. A chip is
  its preview plus `p-1`, also asserted.
- **Radii come off the generic scale.** `rounded-xl` for chip and tile, `rounded-lg` (the card
  corner) for card. No `--radius-attachment-*`.
- **A kind's tone is data.** `ATTACHMENT_KIND_TONE` maps each kind to a surface and its own
  foreground — `info-soft`, `warning-soft`, `success-soft`, `secondary` — the `kind` axis restates
  the surface as a class for Tailwind's scanner, and the glyph takes the foreground as a token. A
  test pins every pair to tokens both themes declare, the class to the map, and no two kinds to
  one tone. The glyph itself is `ATTACHMENT_KIND_ICON` in `attachment-preview.tsx` — kept out of
  the variants file because an icon import would drag React Native into it.
- **The glyph is painted first and the image mounts over it** — the `Avatar` rule. A slow or dead
  URL leaves the type glyph, never a hole. A failure is remembered by
  `resolveAttachmentSourceKey`, not by object identity: an inline `source={{ uri }}` is a new
  object every render, and keyed by identity a dead URL would retry, and flash, on every one.
- **A tile's text sits on `bg-card/85`, not on `bg-overlay`.** The overlay token is translucent
  black in both themes and no token is light in both, so text on it would be unreadable in one of
  them. A frosted card strip with `text-foreground` reads in both. The remove disc and the video
  play badge take the same `bg-card/85`. The upload veil is `bg-overlay` — it dims, and carries
  no text.
- **The name is cut in the middle by the platform.** `ellipsizeMode="middle"` measures the width
  it actually has, so the extension stays visible: `report-q3-fin…ial.pdf`. `truncateMiddle` is
  the character-budget version for places with no layout — a notification, a log line — and
  backs `Attachment.Name`'s `maxLength`.
- **A chip's press target grows, so the cross sits at the far edge.** Stretched by a column — a
  composer tray stacked vertically — a chip is wider than its content, and a press target that only
  shrank left the cross beside the name, mid-chip. `grow shrink` rather than `flex-1`: the basis
  stays the content's width, so a content-sized chip in a horizontal tray is unchanged, where
  `flex-1`'s zero basis would collapse it.
- **A chip is capped at `max-w-64`.** Inside a horizontal `ScrollView` a child has unbounded width,
  so without a cap a long name would stretch the chip rather than ellipsize.
- **No ring.** `Progress` draws bars only, so a tile shows a short bar centred on its dimming veil
  rather than a ring; drawing an arc would mean an SVG part for one layout. On a chip the bar is a
  2pt line inset along the bottom edge (`pointerEvents="none"`, outside the press target, so it
  never swallows a tap); on a card it sits under the meta line.
- **Sizes and durations follow a phone's own file browser.** `formatFileSize` steps in 1024s with
  `KB`/`MB` labels, one decimal at most, through `Intl.NumberFormat` for the separators — so the
  number matches the one the user saw when they picked the file. A size that would round to
  `1,024 KB` reads `1 MB`.

## States

- **idle** — queued, nothing sent. Read as "not sent".
- **uploading** — a bar, determinate with `progress` 0..1 or looping without. Remove stays
  enabled and reads "Cancel upload". `accessibilityState.busy` is set.
- **error** — `border-destructive` (a 2pt border on a tile, which has none otherwise), the meta
  line replaced by the app's `message` in `text-destructive`, retry in the actions when `onRetry`
  is given, remove kept.
- **done** — plain. The default.
- **disabled** — `opacity-50` on the root, the press target and both controls disabled, and the
  remove and retry actions withdrawn.

## Accessibility

- **The root is one accessible element.** `resolveAttachmentAccessibilityLabel` composes "Photo,
  vacation.jpg, 2.4 megabytes, uploading". The role is `button` with a handler — disabled
  included, as a dimmed button — otherwise `image` for a picture and `text` for the rest.
- **The percentage is the value, not the label.** `accessibilityValue` carries the upload in
  ten-percent steps (`resolveProgressAnnouncement`), so the label stays still while the value
  moves, and an upload reporting every 1% is heard eleven times rather than a hundred.
- **Remove and retry are accessibility actions, not elements.** The buttons are hidden
  (`accessibilityElementsHidden`, `no-hide-descendants`, `accessible={false}`) and the root
  declares `remove` and `retry`, labelled, with `onAccessibilityAction` calling the handlers.
  Otherwise iOS folds them into the root, where a VoiceOver user could not reach them. Because the
  press target is a child of the root rather than the root, `activate` and `longpress` are
  declared too and routed to `onPress` / `onLongPress`; the inner `Pressable` is
  `accessible={false}` and `importantForAccessibility="no"` so TalkBack does not stop on it twice.
- **An error is announced once, on entry.** iOS gets an
  `AccessibilityInfo.announceForAccessibility`; Android gets `accessibilityLiveRegion="polite"`
  while in error. Mounting in error — a row scrolling back into view — announces nothing.
- **Hit areas.** The remove and retry discs are 24pt (`ATTACHMENT_ACTION_EDGE`) with
  `ATTACHMENT_ACTION_HIT_SLOP` on every side, which a test holds at 44pt or more.
- **The group is a list.** `Attachment.Group` is `accessibilityRole="list"`, labelled
  "Attachments" by default, and each attachment's hint is "2 of 5" from the group-item context
  the group wraps every child in. A caller's own hint wins.

## Motion

- **Progress fill** — `Progress.Fill`, unchanged: a transform on the UI thread, one timing per
  value. The bar is behaviour, so it keeps moving under reduce motion; an indeterminate upload
  breathes in place rather than sweeping, which is `Progress`'s own rule.
- **Error nudge** — one three-leg `withSequence` of `ATTACHMENT_ERROR_NUDGE` (4pt, 60ms a leg) on
  entering `error`. Decoration, so it does not run under `useCalmMotion()`.
- **Group enter, exit and slide** — each child sits in an `Animated.View` with `FadeIn`,
  `FadeOut` and `LinearTransition` at `ATTACHMENT_GROUP_FADE_MS`, so removing one slides the rest
  along. Under calm motion the cells take none of the three, and an item appears and vanishes at
  once. Children need stable keys, or the slide reads backwards.
- **Press** — `Pressable`'s `fade`, on the press target only.

## Composition

- **No sibling Media import.** `Attachment` imports nothing from `message` or any other Media
  component; a message bubble takes it as children. The playground's `in-message` demo puts a
  `card` inside a plain bubble `View` to prove the seam.
- **Seams left for components that do not exist yet.** `onPress` is where an image viewer or
  QuickLook goes, `onLongPress` where a context menu goes; an error is shown inline rather than
  as a toast. Picking is the app's own picker call — this component only renders the result.
  Audio shows its glyph and duration; a waveform is out of scope.
