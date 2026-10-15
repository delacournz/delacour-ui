# Message

One chat message: a bubble on the incoming or outgoing side, with an avatar
gutter, author and timestamp, content, delivery receipt, reactions and actions.
Compound root plus `Message.Avatar`, `.Header`, `.Author`, `.Bubble`, `.Text`,
`.Attachments`, `.Timestamp`, `.Status`, `.Reactions`, `.Actions` and `.Typing`.

`import { Message } from "@delacour/react-native-ui/message";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/message` |
| `message.tsx` | Root: row and column, child partition, spoken-label composition, accessibility actions, status announcement, entrance, `Object.assign` |
| `message-avatar.tsx` | `Message.Avatar` — the gutter, or its equal-width spacer |
| `message-header.tsx` | `Message.Header` |
| `message-author.tsx` | `Message.Author` |
| `message-bubble.tsx` | `Message.Bubble` — fill, corners, padding, selected outline; `Pressable` when interactive |
| `message-text.tsx` | `Message.Text` |
| `message-attachments.tsx` | `Message.Attachments` |
| `message-timestamp.tsx` | `Message.Timestamp` |
| `message-status.tsx` | `Message.Status` (declared `MessageStatusRow`, the type owns the name) |
| `message-reactions.tsx` | `Message.Reactions` |
| `message-actions.tsx` | `Message.Actions` |
| `message-typing.tsx` | `Message.Typing` and its dot |
| `message.context.tsx` | `MessageProvider`, `useMessage()`, `useMessageContext()`, `useMessagePart()`, `useMessageLabelPart()` |
| `message.types.ts` | `MessageStatus` and the slot props |
| `message.variants.ts` | The slotted `tv()`, the corner and spacing resolvers, the fill and receipt token maps |
| `message.utils.ts` | Receipt label, time format, emoji check, spoken label and actions, label-part folding, child classification |
| `*.test.ts` | |

## Design

- **It draws one message and nothing about the list around it.** `position`
  (`single | first | middle | last`) is computed by the list from the
  neighbours. A bubble that looked at its neighbours would need the whole
  conversation in context and could not be recycled. `MessageScroller` restates
  the same literal union rather than importing it — the two agree by structure.
- **Corners are the heart of it.** `resolveMessageCorners` steps a corner to
  `sm` (`rounded-md`) only on the aligned side and only where it faces a
  neighbour, over a base `rounded-2xl`; `single` steps nothing. The run reads as
  one shape with a seam rather than a stack of pills. Base first, steps after:
  tailwind-merge drops a corner class an *earlier* `rounded-*` covers but keeps
  one written after it, and a test pins that through the `tv` merge.
- **Spike — logical corners compile.** Tailwind v4 emits `rounded-ss-md` as
  `border-start-start-radius`; Uniwind's `cssToRN` camel-cases a `border*`
  property without remapping it, giving `borderStartStartRadius`, which React
  Native (≥ 0.71) supports and flips under RTL. No `style` fallback is needed,
  so `resolveMessageCornerStyle` from the spec was not written. The `rtl` demo
  is the visual check.
- **Run spacing is the message's.** `first`/`middle` sit `mb-0.5`, `last`/`single`
  `mb-2`, through the `position` variant, so a list needs no separator logic.
- **Fill and foreground are a pair.** Outgoing `bg-primary` /
  `text-primary-foreground`; incoming `bg-muted` / `text-foreground`; `accent`
  moves incoming to `secondary`; `plain` drops the fill and padding for emoji and
  system lines. `MESSAGE_FILL_FOREGROUND` is the map, and a test reads every
  bubble's fill and text classes back through it. Text colour is never on the
  row or the bubble (rule 1) — the bubble publishes its `text` slot through
  `TextClassProvider`, so a bare `Text` inside still lands on the foreground.
- **The app decides emoji-only.** `isEmojiOnly` is exported; the component never
  calls it. It walks code points against fixed ranges, not `Intl.Segmenter` or
  `\p{Extended_Pictographic}`, which not every RN engine ships.
- **The avatar is found by `displayName`, not identity.** The root splits its
  children into the gutter and the column with `resolveMessageChildSlot`. A
  development bundle delivers component types wrapped, so `child.type ===
  MessageAvatar` would be false there and the avatar would land in the column.
- **The gutter is a spacer mid-run.** `Message.Avatar` draws its children only
  where `shouldShowAvatar` says (incoming `last | single`) and an empty `w-8`
  otherwise, so every bubble in the run starts on one line. `w-8` is an `Avatar`
  at `size="sm"`. Outgoing drops the gutter entirely.
- **The receipt is under the last outgoing bubble only.** `Message.Status`
  renders nothing elsewhere (`shouldShowStatus`). `read` uses `info`, `failed`
  `destructive`, the rest `muted-foreground`; the glyph's token
  (`MESSAGE_STATUS_TOKEN`) and the label's class are pinned together by a test.
  `failed` also edges the bubble with `border-destructive`, `sending` dims it to
  `opacity-70`, and an `onRetry` adds a Retry control beside the receipt.
- **`isMedia` is the app's call.** A bubble holding only `Message.Attachments`
  drops its padding and clips; the bubble does not inspect its children.
- **No Avatar, Attachment, Chip, Badge or MessageScroller import.** They come in
  as children. Message imports `pressable`, `text` and `icon` only.

## Accessibility

- **One element per message.** The root is `accessible`, and its label is
  composed by `resolveMessageAccessibilityLabel`: "Aria, 9:41 AM, Are we still
  on for tonight?" — plus the receipt on your own last message. Outgoing reads
  as "You" whatever author was given.
- **Parts report their words; the root composes.** The root cannot read its
  parts' props at depth, so `Author`, `Text`, `Timestamp`, `Status` (its `label`)
  and `Typing` each call `useMessageLabelPart`, which reports a
  `MessageLabelPart` on mount and withdraws it on unmount.
  `resolveMessageLabelParts` folds them: every text in order, first author and
  time. That costs one extra render on mount, which is the price of a label
  nobody has to pass twice. `accessibilityLabel` on the root replaces it.
- **Role is `button` only with `onPress`;** otherwise `text`.
- **Gestures have actions.** `onLongPress` is offered as `longpress` (TalkBack's
  gesture) and a named `more` (VoiceOver's rotor); `onRetry` on a failed message
  adds `retry`. `resolveMessageAccessibilityActions` builds the list.
- **Only a turn into `failed` is announced.** `shouldAnnounceStatusChange` —
  a receipt ticking over every time would be noise, and a message that mounts
  already failed (history, a recycled cell) stays quiet.
- **`isCompound` is the escape hatch.** A message holding a control of its own —
  a link, a pressable attachment, buttons in `Message.Actions` — would have that
  control hidden inside the merged element. `isCompound` leaves the root and the
  bubble non-accessible so each part is read on its own; exposing the message's
  own press and long press is then the app's job.
- **Typing** is read as "Aria is typing" when an author is given and sits in a
  polite live region.

## Motion

- **Entrance** — `FadeInDown.duration(160)` only with `animateEntrance`, which
  the scroller passes for a message that arrived after first layout. History and
  recycled cells never animate. Off under `useCalmMotion()`. No
  `LinearTransition` on the row: shifting siblings is the list's business, and a
  layout transition on every recycled cell is a cost the list pays on scroll.
- **Press** — the bubble eases to 0.98 through `Pressable`.
- **Receipt glyph** — keyed on the status type with a 120ms `FadeIn`, stilled
  when calm.
- **Typing dots** — three `withRepeat(withSequence(…))` opacity pulses staggered
  by 120ms on the UI thread; under calm motion they rest at full opacity.
- **Reactions** — a child added after the row mounts springs in with `ZoomIn`;
  the ones present at mount do not, so history scrolled back into view is still.
  Stilled when calm.

## Out of scope

Menu / context menu (the long-press menu is app code; `isSelected` is the visual
seam), toast, markdown and link detection (pass nested `Text`), swipe to reply,
an image viewer, text selection by default (`selectable` steals the long press).

## Previews

Five demos are captured: `status` (**hero**, a clip — the receipt walks sending →
read, the failed one retries and fails again), `typing` (a clip of the dots),
and stills of `directions`, `runs` and `reactions`, all but `typing` at
`align: "stretch"`. The Retry control carries no `testID`, so
`.argent/flows/previews/message/status.yaml` taps it by its text.
