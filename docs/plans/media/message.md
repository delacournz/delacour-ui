# Message — design spec

One chat message: a bubble on the incoming or outgoing side, with an avatar gutter,
author and timestamp, content, delivery status, a reactions row and an actions slot.
Compound root plus `Message.Avatar`, `.Header`, `.Author`, `.Bubble`, `.Text`,
`.Attachments`, `.Timestamp`, `.Status`, `.Reactions`, `.Actions` and `.Typing`.

`import { Message } from "@delacour/react-native-ui/message";`

## 1. Purpose on mobile

- **It draws one message and nothing about the list around it.** Where it sits in a
  run of messages (`position`) is a prop the list computes; a bubble that looked at its
  neighbours would need the whole conversation in context and could not be recycled.
- **What does not translate from a desktop chat.** No hover toolbar (reply, react,
  more): the actions open on long-press via `onLongPress`, and a swipe-to-reply is an
  app gesture around the row, not part of the bubble. No inline edit-in-place and no
  text selection toolbar by default (`selectable` is opt-in because it steals the
  long-press). No fixed 60% max-width: width is `max-w-[80%]` of the row so a phone and
  a tablet both read as a bubble. No right-click.
- **Status is a delivery receipt, not a toast.** `sending` -> `sent` -> `delivered` ->
  `read`, plus `failed` with a retry affordance, drawn under the last bubble of a run.

## 2. Public API

```ts
type MessageDirection = "incoming" | "outgoing";
type MessagePosition = "single" | "first" | "middle" | "last"; // place in a run of one sender
type MessageTone = "default" | "accent" | "plain";             // plain = no fill (emoji, system)
type MessageSize = "sm" | "md" | "lg";                         // text step

type MessageStatus =
  | { type: "sending" }
  | { type: "sent" }
  | { type: "delivered" }
  | { type: "read"; readAt?: Date }
  | { type: "failed"; reason?: string };

type MessageProps = {
  direction: MessageDirection;                  // required: alignment and fill follow it
  position?: MessagePosition;                   // default "single"
  status?: MessageStatus;                       // outgoing only; ignored for incoming
  tone?: MessageTone;
  size?: MessageSize;                           // default "md"
  isSelected?: boolean;                         // long-press target highlight
  onPress?: () => void;
  onLongPress?: () => void;
  onRetry?: () => void;                         // failed state
  accessibilityLabel?: string;                  // overrides the composed one
  className?: string;
  children: ReactNode;
};

type MessageAvatarProps = { children?: ReactNode; className?: string };   // slot; spacer when absent
type MessageAuthorProps = { children: string; color?: "default" | "primary" };
type MessageTimestampProps = { date: Date; format?: (date: Date) => string; locale?: string };
type MessageStatusProps = { label?: string };                             // override spoken receipt
type MessageReactionsProps = { children: ReactNode; placement?: "overlap" | "below" };
type MessageTypingProps = { direction?: "incoming" };
```

- **`Message.Bubble`** holds `Text`/`Attachments`/anything and owns fill, padding and
  corners. `Message.Text` is a `Text` preset with the bubble's foreground baked in.
- **`Message.Avatar`** takes an `Avatar` (or anything) as children. It renders the
  children only for `position` `last | single` (incoming), else an equal-width
  spacer so bubbles in a run stay aligned. Message does not import Avatar.
- **`Message.Attachments`** is a layout slot (`gap`, rounded clip matching the bubble)
  that takes `Attachment` elements, or images, as children.
- **`Message.Reactions`** is a slot that takes chips/badges as children.
- **Hook:** `useMessage()` -> `{ direction, position, status, tone, size, isOutgoing,
  isInteractive, isSelected }`; `useMessagePart()` throws outside a root.

## 3. File map

| File | Holds |
| --- | --- |
| `index.ts` | -> `@delacour/react-native-ui/message` |
| `message.tsx` | Root row: alignment, press target wiring, a11y composition, `Object.assign` |
| `message-avatar.tsx` | Gutter slot / spacer |
| `message-header.tsx` | Author + timestamp row |
| `message-author.tsx` | |
| `message-bubble.tsx` | Fill, corners, padding, selected ring |
| `message-text.tsx` | Foreground-aware `Text` |
| `message-attachments.tsx` | Clipped media/attachment stack inside or under the bubble |
| `message-timestamp.tsx` | |
| `message-status.tsx` | Receipt icon + label |
| `message-reactions.tsx` | Overlapping / trailing row slot |
| `message-actions.tsx` | Row of buttons under the bubble (retry, reply) |
| `message-typing.tsx` | Three animated dots in a bubble |
| `message.context.tsx` | `MessageProvider`, `useMessage()`, `useMessagePart()` |
| `message.types.ts` | `MessageDirection`, `MessagePosition`, `MessageStatus`, part props |
| `message.variants.ts` | `tv()` slots and pure resolvers, no RN imports |
| `message.variants.test.ts` | |
| `message.utils.ts` | `resolveMessageStatusLabel`, `formatMessageTime`, `isEmojiOnly`, spoken label |
| `message.utils.test.ts` | |
| `AGENTS.md` | Decisions and failures prevented |

## 4. Variants and sizes

One slotted `tv()` (`messageVariants`): `root`, `column`, `gutter`, `bubble`, `text`,
`header`, `author`, `timestamp`, `status`, `attachments`, `reactions`, `actions`,
`typingDot`.

- **`direction`** — `outgoing`: `items-end`, bubble `bg-primary`, text
  `text-primary-foreground`; `incoming`: `items-start`, bubble `bg-muted`, text
  `text-foreground`. A test pins each text colour to its bubble's foreground pair and
  checks both exist in both themes.
- **`tone`** — `default` as above; `accent` swaps incoming to `bg-secondary
  text-secondary-foreground`; `plain` drops the fill (`bg-transparent`, no padding) for
  emoji-only and system lines.
- **`position` x `direction` -> corners** — the heart of the file. Base `rounded-2xl`;
  the *joined* corners step down to `rounded-md` so a run reads as one stack:
  - outgoing `first`: tail-less top; `middle`: `rounded-se-md rounded-ee-md`; `last`:
    `rounded-se-md` (tail corner tight on the bottom-end); `single`: all `rounded-2xl`.
  - incoming mirrors with `ss` / `es` logical corners.
  - **Logical corner classes (`rounded-ss-*`, `rounded-ee-*`)** so RTL mirrors for free;
    if Uniwind cannot compile them, fall back to a `style` of
    `borderStartStartRadius` etc. produced by `resolveMessageCornerStyle` (pure, numeric
    from `--radius`, restated and pinned by a test). Decide in a spike before writing
    the variants file; record the outcome in `AGENTS.md`.
- **`size`** — `sm`/`md`/`lg` text steps (`text-sm` / `text-base` / `text-lg`), padding
  `px-3 py-1.5` / `px-3.5 py-2` / `px-4 py-2.5`.
- **Semantic tokens only:** `bg-primary`, `bg-muted`, `bg-secondary`, `bg-destructive-soft`,
  `border-destructive`, `ring-ring`, `text-muted-foreground` (timestamp, receipt),
  `text-info` (read receipt), `text-destructive` (failed).
- **Run spacing:** `middle`/`first` sit `mb-0.5`, `last`/`single` `mb-2`, expressed as
  `position` variants so the list needs no separator logic.

## 5. States

- **incoming / outgoing**, each x **position** (4) — the corner matrix above.
- **status** (outgoing, last of run only): `sending` (clock glyph, dim bubble at
  `opacity-70`), `sent` (single check), `delivered` (double check, muted), `read`
  (double check, `text-info`), `failed` (exclamation in `text-destructive`, bubble
  gets `border border-destructive`, Retry action row appears when `onRetry` set).
- **pressed** — bubble scales to 0.98 via `Pressable` feedback when interactive.
- **selected** — `ring-2 ring-ring` plus row tint `bg-accent`, for a long-press menu
  host to highlight the source row.
- **emoji-only** — `isEmojiOnly(text)` lets the app pass `tone="plain"` and `size="lg"`;
  the component does not guess.
- **typing** — `Message.Typing` three dots.
- **disabled** — n/a; a message is not disabled. Not-interactive is simply no handlers.
- **with attachments only** — bubble padding drops (`p-0 overflow-hidden`) when the
  bubble's only child is `Message.Attachments`, via a `hasMediaOnly` variant the app
  sets with `isMedia` on `Message.Bubble`.

## 6. Accessibility

- **One element per message.** The root is `accessible` with a label composed by
  `resolveMessageAccessibilityLabel({ author, direction, text, time, status })`:
  "Kate, 9:41 AM, Are we still on for tonight?, read". Children are hidden from the AX
  tree when the root is accessible, so receipts and timestamps are not read twice. When
  a message holds interactive children (a link, an attachment with its own `onPress`),
  `accessible={false}` is passed through `isCompound` so those stay reachable — the
  default is the single element, and the flag is the escape hatch.
- **Role:** `accessibilityRole="button"` only with `onPress`; otherwise `"text"`.
- **Actions:** `onLongPress` is mirrored as an `accessibilityActions` entry (`"activate"`
  and a named `more` action) so VoiceOver/TalkBack can reach it without a long press.
  `onRetry` adds a `retry` action.
- **Status changes are announced once,** via `AccessibilityInfo.announceForAccessibility`
  on a `sending -> failed` transition only; `sent`/`delivered`/`read` ticks are not
  announced (a read receipt every time would be noise). A test-covered pure
  `shouldAnnounceStatusChange(prev, next)` decides.
- **Contrast:** `primary` / `primary-foreground` and `muted` / `foreground` pairs are
  already the library's checked pairs; no custom colour here.
- **Typing indicator:** `accessibilityLabel="Kate is typing"`, `accessibilityLiveRegion=
  "polite"`.
- **Reduced motion:** typing dots hold at a static 3-dot rest state under
  `useCalmMotion()`.

## 7. Motion

- **Entrance** — a new message mounts with `FadeInDown.duration(160)` +
  `LinearTransition` on siblings; off (renders immediately) under `useCalmMotion()` and
  when `animateEntrance={false}`. Only applied to messages that arrive after first
  layout (the scroller passes `animateEntrance`), never to initial history, or a long
  recycled list would animate every cell on scroll.
- **Press** — inherited from `Pressable`.
- **Status glyph swap** — cross-fade between receipt icons, 120ms, `withTiming`, stilled
  when calm.
- **Typing dots** — three `withRepeat(withSequence(...))` opacity pulses staggered by
  120ms on the UI thread; stilled to static dots when `useCalmMotion()` (decorative).
- **Reactions** — `ZoomIn` spring on a newly added child, stilled when calm.

## 8. Reuses

`Pressable` (bubble), `Text`, `Icon` + Central Icons (clock, check, double check,
exclamation), `useCalmMotion`, `useIconDefaults`, `cn`, `tv`, Reanimated layout
animations. Reads `Avatar`, `Badge`, `Chip` and `Attachment` as children only; imports
none of them.

## 9. Dependencies

- **None new.**
- **Registry:** `ITEM_META.message = { title: "Message", description: "A chat bubble
  with direction, run-aware corners, delivery status, reactions and an avatar gutter.",
  categories: ["messaging"] }`. No `PACKAGE_INSTALL` change. Derived dependencies:
  `pressable`, `text`, `icon`.

## 10. Sibling / cross-category dependencies

- **Ideal composition:** `Avatar` in `Message.Avatar`, `Attachment` in
  `Message.Attachments`, `Chip`/`Badge` in `Message.Reactions`, and `Message` inside
  `MessageScroller`.
- **(a) Composes via children and slots only. No import of `attachment`,
  `message-scroller`, `post` or `support`.** Avatar and Pressable are existing merged
  components; Message imports `pressable`, `text`, `icon` only. Wave 1, parallel-safe.
- **Contract with `message-scroller`:** both agree on the identical literal union
  `"single" | "first" | "middle" | "last"` for `position`. Each declares it in its own
  `*.types.ts` (structural typing makes them interchangeable); neither imports the
  other. A sync test is impossible across the boundary, so the README should record the
  union as shared vocabulary.
- **Gaps:** *Menu / ContextMenu / Popover* — absent; the long-press menu is app code and
  `isSelected` is the visual seam. *Toast* — absent; failure stays inline. *Markdown /
  link detection* — out of scope; `Message.Text` renders what it is given, and linkified
  content is passed as nested `Text`. *Swipe-to-reply* — defer to a gesture wrapper
  (`Swipe`), not built here. *Image viewer* — defer.

## 11. Pure logic to unit-test (TDD)

`message.utils.ts`:

- `resolveMessageStatusLabel(status: MessageStatus): string` — `sending -> "Sending"`,
  `sent -> "Sent"`, `delivered -> "Delivered"`, `read -> "Read"`, `failed with reason ->
  "Failed: <reason>"`, failed without -> `"Failed to send"`.
- `formatMessageTime(date: Date, now?: Date, locale?: string): string` — same day ->
  `"9:41 AM"`, yesterday -> `"Yesterday"`, within a week -> weekday, else short date.
- `isEmojiOnly(text: string): boolean` — `"😀"` true, `"😀😀😀"` true, `"hi 😀"` false,
  `""` false, ZWJ sequences (`"👨‍👩‍👧"`) true, keycap `"1️⃣"` true; > 3 emoji false.
- `resolveMessageAccessibilityLabel(input: { author?: string; direction: MessageDirection;
  text?: string; time?: string; status?: MessageStatus }): string` — author omitted for
  outgoing ("You"), status only for outgoing last-of-run.
- `shouldAnnounceStatusChange(prev: MessageStatus | undefined, next: MessageStatus):
  boolean` — only `-> failed`.
- `shouldShowStatus(position: MessagePosition, direction: MessageDirection): boolean` —
  outgoing `last | single` only.
- `shouldShowAvatar(position, direction): boolean` — incoming `last | single` only.

`message.variants.ts` resolvers, tested in `message.variants.test.ts`:

- `resolveMessageCorners(direction, position): CornerRadii` — full 2 x 4 matrix, e.g.
  `("outgoing","middle") -> { topStart: "lg", bottomStart: "lg", topEnd: "sm",
  bottomEnd: "sm" }`; incoming mirrored; `single` all large.
- `resolveMessageSpacing(position): string` — `middle` tighter than `last`.
- Class tests: bubble text colour equals its fill's foreground pair; no `self-*` on the
  root; `max-w-[80%]` only on the column; every token exists in both themes.

## 12. Playground demos (`apps/playground/src/demos/message/`)

| File | Description |
| --- | --- |
| `directions.tsx` | incoming vs outgoing single bubbles with avatar and timestamp. **capture, hero** |
| `runs.tsx` | five consecutive messages showing first / middle / last corner stacking. **capture** |
| `status.tsx` | sending -> sent -> delivered -> read cycling, and failed with retry. **capture** |
| `reactions.tsx` | overlap vs below reactions with `Chip` children. **capture** |
| `typing.tsx` | typing indicator bubble |
| `with-attachments.tsx` | image-only bubble, file bubble (plain `View` stand-ins, no sibling import) |
| `long-press.tsx` | selected state on long-press, host menu is an `Alert` |
| `emoji-and-plain.tsx` | `tone="plain"` emoji and a system line |
| `rtl.tsx` | forced RTL, corners mirror |
| `index.ts` | ordered `defineDemoGroup("message", {...})` |

Capture count 4 (`directions` hero, `runs`, `status`, `reactions`).

## 13. Docs page

`apps/web/content/docs/native/components/message.mdx`, `title: Message`, `icon:
MessageCircle`. Outline: Preview hero, Installation, Usage (one message), Direction,
Runs and `position` (with the "compute it in the list" rule and a snippet showing
neighbour comparison inline), Status, Avatar gutter, Attachments and reactions (children
slots), Typing, Long-press and actions, Accessibility, API tables, `useMessage`. Joins
`---Messaging---` in `meta.json` (new section; lead adds the header once across the three
sibling branches).

## 14. Acceptance checklist

- [ ] `message.utils.test.ts` and `message.variants.test.ts` written first, failing, then passing
- [ ] `bun run typecheck`; `MessageStatus` discriminated union; no `any`
- [ ] `bun run check`; no comments in JSX
- [ ] `AGENTS.md` + Components table row in `packages/react-native-ui/AGENTS.md`
- [ ] `displayName` `DelacourUI.Message.<Part>` on every part
- [ ] `bun run gen-exports`
- [ ] Demos + `bun run gen-demos`
- [ ] Route `apps/playground/src/app/(components)/message.tsx` + row in `src/app/index.tsx`
- [ ] `message.mdx` + `meta.json`
- [ ] `ITEM_META.message` + `bun run registry:build`
- [ ] Changeset
- [ ] Simulator check via `warden` + `agent-device`
- [ ] Logical-corner spike resolved (class vs style) and recorded in `AGENTS.md`
- [ ] A run of 5 reads as one stack in both directions, and mirrors in RTL
- [ ] Avatar gutter keeps middle bubbles aligned (spacer width equals avatar width)
- [ ] VoiceOver reads one element per message; long-press and retry reachable as actions
- [ ] Failed -> retry works; receipt colours legible in light and dark
- [ ] Entrance animation does not fire on initial history, and is off under reduce motion
- [ ] No imports of `attachment` or `message-scroller` in this folder
