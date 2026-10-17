# MessageScroller — design spec

The scrolling conversation: a bottom-anchored list that keeps the newest message in view
while the reader is at the bottom, leaves them alone when they have scrolled up, offers
a "jump to latest" button with an unread count, loads older history when they reach the
top, rises with the keyboard, and draws date separators and an unread divider. Compound
root plus `MessageScroller.List`, `.JumpButton`, `.DateSeparator`, `.UnreadDivider`,
`.LoadingOlder` and a `useMessageScroller()` controller.

`import { MessageScroller } from "@delacour/react-native-ui/message-scroller";`

## 1. Purpose on mobile

- **It owns scroll behaviour, not message appearance.** A conversation list is hard in
  four specific ways: pinning to the end as content grows, not yanking the reader away
  from history they are reading, prepending older pages without the viewport jumping, and
  moving with the keyboard. The bubble is the app's `Message`; the scroller never
  imports it.
- **What does not translate from a desktop chat.** No scrollbar-driven "new messages"
  banner anchored to a window edge — the jump button floats above the composer and moves
  with the keyboard. No mouse wheel or keyboard paging; a thumb flick is the input and
  momentum must not fight a prepend. No infinite scroll sentinel `IntersectionObserver`:
  `onStartReached` from the list engine is the trigger. No hover on separators.
- **Relation to `Screen.ChatList`.** `Screen.ChatList` already ships a keyboard-aware
  legend/flat list wired to `Screen`'s composer footer insets. `MessageScroller` is the
  behaviour layer that works anywhere (a sheet, a split pane, a screen without
  `Screen`), and its pure logic and `JumpButton` are usable *with* `Screen.ChatList` via
  the controller (see API). It does not replace `Screen.ChatList` and does not import
  `Screen`.

## 2. Public API

```ts
type MessageScrollerRow<T> =
  | { kind: "message"; key: string; message: T; position: MessageRunPosition; isNew: boolean }
  | { kind: "date"; key: string; date: Date; label: string }
  | { kind: "unread"; key: string; count: number };

type MessageRunPosition = "single" | "first" | "middle" | "last";

type MessageScrollerProps<T> = {
  messages: readonly T[];                         // chronological, oldest first
  getKey: (message: T) => string;
  getDate: (message: T) => Date;
  getSenderId: (message: T) => string;
  viewerId?: string;                              // own messages never raise the unread count
  renderMessage: (info: {
    message: T;
    position: MessageRunPosition;                 // pass straight to <Message position>
    isNew: boolean;                               // arrived after first layout; gate entrance animation
    index: number;
  }) => ReactElement;
  runWindowMs?: number;                           // gap that breaks a run, default 5 * 60_000
  separateDates?: boolean;                        // default true
  formatDate?: (date: Date, now: Date) => string; // default: Today / Yesterday / weekday / date
  firstUnreadKey?: string;                        // renders UnreadDivider before it

  hasOlder?: boolean;                             // more history exists
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;                       // fired once per start-reach, guarded
  loadOlderThreshold?: number;                    // screens from top, default 1

  stickThreshold?: number;                        // points from end counted as "at bottom", default 80
  initialScrollTarget?: "end" | "unread";         // default "end"
  keyboardOffset?: number;                        // distance from list bottom to screen bottom
  bottomInset?: number;                           // composer clearance when not using Screen
  ListHeaderComponent?: ReactElement;
  ListEmptyComponent?: ReactElement;
  onAtEndChange?: (isAtEnd: boolean) => void;
  onScrollerReady?: (controller: MessageScrollerController) => void;
  className?: string;
  contentContainerClassName?: string;
  children?: ReactNode;                           // overlay parts: JumpButton, etc.
};

type MessageScrollerController = {
  scrollToEnd: (options?: { animated?: boolean }) => void;
  scrollToKey: (key: string, options?: { animated?: boolean; viewPosition?: number }) => void;
  isAtEnd: () => boolean;
};

type MessageScrollerState = {
  isAtEnd: boolean;
  unreadCount: number;          // messages appended while not at end, from others
  isLoadingOlder: boolean;
};

type MessageScrollerJumpButtonProps = {
  label?: string;                              // default "Jump to latest"
  placement?: "center" | "end";                // default "end"
  showCount?: boolean;                         // default true
  onPress?: () => void;                        // default: scrollToEnd
  children?: ReactNode;                        // replaces the default glyph + count
  className?: string;
};
```

- **Why one root plus parts.** `MessageScroller` (root) is a context provider and the
  positioned container; `MessageScroller.List` draws the list inside it; `.JumpButton`
  floats over it and reads state from context. Props above live on the root; `List` is
  parameterless so an app can place overlay parts as siblings.
- **Hooks:** `useMessageScroller()` returns `{ state, controller, onScroll,
  onContentSizeChange, onLayout }`. With `Screen.ChatList`, an app calls the hook, spreads
  `onScroll`/`onContentSizeChange` onto it, and renders `MessageScroller.JumpButton`; the
  hook is also the standalone path `List` uses internally. `useMessageScrollerPart()` is
  the throwing variant.
- **Generic over `T`**, so the app's message type flows through `renderMessage` with no
  casts and no `any`. The default export is cast once at the module boundary (the
  `withUniwind` generic-collapse pattern already used in `screen-chat-list.tsx`).

## 3. File map

| File | Holds |
| --- | --- |
| `index.ts` | -> `@delacour/react-native-ui/message-scroller` |
| `message-scroller.tsx` | Root + `Object.assign`; context provider and container |
| `message-scroller-list.tsx` | The `KeyboardAwareLegendList` wiring, row dispatch |
| `message-scroller-jump-button.tsx` | Floating button with count badge |
| `message-scroller-date-separator.tsx` | Centred label with hairlines |
| `message-scroller-unread-divider.tsx` | "N new messages" rule |
| `message-scroller-loading-older.tsx` | Header spinner row |
| `message-scroller.context.tsx` | `MessageScrollerProvider`, `useMessageScroller()`, `useMessageScrollerPart()` |
| `message-scroller.types.ts` | Row union, props, controller |
| `use-message-scroller-state.ts` | The scroll-tracking hook (pure transitions in utils) |
| `message-scroller.variants.ts` | `tv()` slots, jump button placement resolvers |
| `message-scroller.variants.test.ts` | |
| `message-scroller.utils.ts` | `buildMessageRows`, `shouldStickToBottom`, `resolveUnreadCount`, `formatSeparatorDate` |
| `message-scroller.utils.test.ts` | |
| `AGENTS.md` | Decisions and the failure each prevents |

## 4. Variants and sizes

`messageScrollerVariants` slots: `root`, `content`, `jumpButton`, `jumpCount`,
`dateSeparator`, `dateLabel`, `dateRule`, `unreadDivider`, `unreadLabel`, `unreadRule`,
`loadingOlder`.

- **No size axis on the list.** A scroller has no intrinsic size; sizing is the
  caller's `className`. Content gutter is `px-screen-gutter`, matching `Screen.ChatList`'s
  `CHAT_CONTENT_CLASS`, with no vertical padding (the bubbles carry their rhythm and the
  bottom reserve is computed).
- **Jump button:** `placement` axis (`center` / `end`), absolutely positioned
  `bottom-3`, pill `h-9 rounded-full border border-border bg-card shadow-sm`, label
  `text-card-foreground`, count chip `bg-primary text-primary-foreground`. Uses semantic
  tokens only; the offset above the composer comes from `bottomInset` + the keyboard
  shared value, not a class.
- **Date separator:** `text-xs text-muted-foreground` label, `bg-border h-px` rules,
  `py-3`. **Unread divider:** `text-xs text-primary` label, `bg-primary/40` rule.
- **Row spacing is the bubble's** (`Message` position variants), never the scroller's —
  one source of vertical rhythm.

## 5. States

- **empty** — `ListEmptyComponent` (the app's `EmptyState`), centred, still keyboard-aware.
- **loading initial** — app passes a `Skeleton` empty component; scroller has no state
  for it (a skeleton list is not a conversation).
- **at end** — new messages append and scroll follows (animated if within one screen,
  instant if large).
- **scrolled up** — new messages append silently; `unreadCount` increments only for
  messages whose sender differs from the viewer (compared against `viewerId`) and `JumpButton` appears.
- **jump visible / hidden** — visible when `!isAtEnd`; hysteresis (appears at 1.5 x
  `stickThreshold`, hides at `stickThreshold`) so it does not flicker at the boundary.
- **loading older** — `LoadingOlder` header row; further `onLoadOlder` calls suppressed
  until `isLoadingOlder` returns to false.
- **no more older** — `hasOlder=false` removes the header, and the first message sits at
  the top with no phantom space.
- **keyboard open** — content translates by `keyboardHeight - keyboardOffset`; if the
  reader was at the end they stay at the end, if they were reading history their position
  is preserved relative to the content under their thumb.
- **prepend** — older page lands without the viewport moving (maintain visible content
  position on the first visible key).
- **own message sent** — always scrolls to end, even from history, with animation.

## 6. Accessibility

- **The list is `accessibilityRole="list"`** with a label ("Conversation") and rows are
  announced in natural reading order (oldest to newest). Alignment-to-end is a layout
  trick; the AX order must not be reversed. Using LegendList's non-inverted
  `alignItemsAtEnd` keeps DOM/AX order equal to visual order, which an inverted list
  would break (VoiceOver would walk the conversation backwards).
- **New messages while at end** — each arriving message from another sender triggers one
  polite announcement ("New message from Kate") through a throttled
  `announceForAccessibility`; with several within 1.5 s it coalesces to "3 new messages".
  `shouldAnnounceNewMessages` is pure.
- **Jump button** — `accessibilityRole="button"`, label "Jump to latest, 3 unread",
  `accessibilityLiveRegion="polite"` on the count (Android) so the badge change is spoken;
  large hit area (44pt).
- **Date separator** — `accessibilityRole="header"` so rotor/heading navigation walks
  days; the unread divider is also a header.
- **Focus after load older** — focus is not moved; the preserved visible key keeps
  VoiceOver's cursor valid.
- **Reduced motion** — scroll-to-end is `animated: false`, jump button fades instead of
  sliding, loading header appears without a height animation, all under `useCalmMotion()`.

## 7. Motion

- **Scroll follow** — `scrollToEnd({ animated })` where `animated` comes from
  `resolveFollowAnimation(distance, viewport, isCalm)`: animate only for a delta under one
  viewport; jumping across a long conversation animates nothing.
- **Jump button** — Reanimated shared value `visible` driving `opacity` and `translateY`
  (`withTiming(…, 160ms)`); bound to a derived value from the list's scroll offset on the
  UI thread (`useAnimatedScrollHandler` through `Animated` `onScroll`) so it never waits on
  a JS round-trip. State that React needs (`isAtEnd`, `unreadCount`) is reported back with
  `scheduleOnRN` from `react-native-worklets`, throttled to boundary crossings only, not
  every frame.
- **Keyboard** — `KeyboardAwareLegendList` from `@legendapp/list/keyboard`, the same
  engine `Screen.ChatList` uses, backed by `react-native-keyboard-controller`; offset
  from `keyboardOffset`.
- **Row entrance** — delegated to the row (`isNew` is the flag), never done by the list.
- **Loading older** — spinner row; no layout animation (a height tween during a prepend
  fights `maintainVisibleContentPosition`).
- **Calm** — `useCalmMotion()` turns off follow animation, the jump slide and the fade-in.

## 8. Reuses

`LegendList` via `@legendapp/list/keyboard` (`KeyboardAwareLegendList`) and
`@legendapp/list/reanimated` where an animated scroll handler is needed; its
`maintainScrollAtEnd`, `maintainScrollAtEndThreshold`, `alignItemsAtEnd`,
`maintainVisibleContentPosition`, `onStartReached` / `onStartReachedThreshold`, and
`anchoredEndSpace` props. `react-native-keyboard-controller`, Reanimated,
`react-native-worklets`, `Pressable`, `Icon`, `Text`, `Badge` (count chip, if its API fits;
otherwise a local slot), `Spinner`, `useCalmMotion`, `cn`, `tv`, `composeRefs`. Reads the
shape of `screen-chat-list.tsx` and `use-screen-scroll-insets.ts` for the keyboard-inset
approach; does not import them (Screen's composer insets are Screen-private).

**LegendList, not ScrollView or FlatList.** A conversation is the case virtualisation
exists for (thousands of variable-height rows), LegendList is already an optional peer and
the chat list's engine, and its end-anchoring props (`alignItemsAtEnd`,
`maintainScrollAtEnd`, `maintainVisibleContentPosition`) are exactly this component's
job. `FlatList inverted` is rejected: it reverses AX order, flips touch handling for
horizontal gestures on rows, and makes date-separator placement and prepend semantics
backwards. A plain `ScrollView` is rejected: no virtualisation, and it cannot keep
scroll position on prepend without manual measurement.

## 9. Dependencies

- **None new.** `@legendapp/list` is already an optional peer (`>=3.3`, catalog,
  `expo install`); `react-native-keyboard-controller`, Reanimated and Worklets already
  required peers. If the host app omits LegendList, importing this subpath fails at
  resolution — acceptable and consistent with `Screen.LegendList`, and documented.
- **Registry:** `ITEM_META["message-scroller"] = { title: "Message Scroller",
  description: "A bottom-anchored conversation list: sticks to the newest message, jumps
  to latest with an unread count, loads older history, rises with the keyboard.",
  categories: ["messaging"] }`. `@legendapp/list` is already `expo` in `PACKAGE_INSTALL`;
  the import scan picks up `@legendapp/list/keyboard`, so verify the builder normalises
  deep subpaths (`config.ts` classifies by package). If not, add
  `dependencies: ["@legendapp/list", "react-native-keyboard-controller",
  "react-native-reanimated", "react-native-worklets"]`.

## 10. Sibling / cross-category dependencies

- **Ideal composition:** `Message` rows via `renderMessage`, `Attachment` inside those,
  `EmptyState` as the empty view, `Skeleton` for first load, an input composer below.
- **(a) Composes via `renderMessage` only. No import of `message`, `attachment`, `post`
  or `support`.** `MessageRunPosition` is declared locally as the literal union
  `"single" | "first" | "middle" | "last"`; `Message` declares the same union and the two
  are structurally interchangeable. Wave 1, parallel-safe with `message` and
  `attachment`; end-to-end demos use plain `View` bubbles until all three merge, then a
  follow-up chore swaps the demos to the real `Message` (not a dependency of the library
  code).
- **Run computation lives here, corner computation lives in `message`.** `buildMessageRows`
  decides who is first/middle/last; `Message` decides what that means for corners. Neither
  repeats the other.
- **Gaps:** *Composer / Input Group* — absent; the app supplies the composer, and
  `bottomInset` / `keyboardOffset` are the seams. *Menu / ContextMenu* — absent. *Toast* —
  absent (no new-message toast; the jump button is the notification). *Search / jump-to-
  message* — `controller.scrollToKey` is the seam. *Pull-to-refresh at the top* — not used;
  load-older is automatic. *Swipe-to-reply* — row-level, deferred.
- **Follow-up (not in scope):** have `Screen.ChatList` adopt `useMessageScroller` so the
  two share one stick-to-bottom implementation. Cross-component refactor, separate PR.

## 11. Pure logic to unit-test (TDD)

`message-scroller.utils.ts`:

- `shouldStickToBottom(input: { offset: number; contentHeight: number; viewportHeight:
  number; threshold: number }): boolean` — `distance = contentHeight - viewportHeight -
  offset <= threshold`. Cases: exact end true; 79 off with threshold 80 true; 81 false;
  content shorter than viewport true; negative `offset` (overscroll) true.
- `resolveJumpVisibility(input: { distanceFromEnd: number; wasVisible: boolean;
  threshold: number }): boolean` — hysteresis: show at distance > 1.5 x threshold, hide at <= threshold,
  in between keep `wasVisible` (threshold 80: 100 with `wasVisible=false` -> false; 100 with
  `true` -> true; 121 -> true; 80 -> false).
- `buildMessageRows<T>(messages: readonly T[], options: { getKey; getDate; getSenderId;
  runWindowMs; separateDates; now: Date; formatDate; firstUnreadKey? }):
  MessageScrollerRow<T>[]` — cases: empty -> `[]`; one -> date row + `single`; three
  from one sender 1 minute apart -> `first/middle/last`; same sender but a 10 minute gap
  breaks the run; sender change breaks it; date change inserts a separator and breaks the
  run even for the same sender; `firstUnreadKey` inserts one `unread` row before that
  message and breaks the run; unstable input order is **not** sorted (caller's job) and a
  decreasing timestamp does not throw.
- `resolveUnreadCount(input: { previousKeys: readonly string[]; nextKeys: readonly
  string[]; isOwn: (key: string) => boolean; isAtEnd: boolean; previousCount: number }):
  number` — appends only count; prepends (older load) do not; own messages do not; at end
  resets to 0; shrinking list never goes negative.
- `detectChange(prevKeys, nextKeys): "append" | "prepend" | "replace" | "none"` — the
  discriminator the above and the maintain-position choice rely on.
- `formatSeparatorDate(date: Date, now: Date, locale?: string): string` — `Today`,
  `Yesterday`, weekday inside 6 days, `"12 Sep"` same year, `"12 Sep 2025"` otherwise;
  midnight and DST boundaries use calendar days, not 24h blocks.
- `isSameCalendarDay(a: Date, b: Date): boolean` — local time zone, DST day.
- `shouldRequestOlder(input: { hasOlder: boolean; isLoadingOlder: boolean;
  alreadyRequestedForKey: string | undefined; firstKey: string | undefined }): boolean`
  — guards the double-fire a threshold crossing causes; same `firstKey` requested once.
- `resolveFollowAnimation(input: { distance: number; viewportHeight: number; isCalm:
  boolean }): boolean` — calm false; under one viewport true; over false.
- `shouldAnnounceNewMessages(input: { count: number; lastAnnouncedAt: number; now: number
  }): "none" | "single" | "batch"` — coalescing window.
- `resolveJumpButtonLabel(unreadCount: number, base?: string): string` — `0 -> "Jump to
  latest"`, `1 -> "Jump to latest, 1 unread"`, `120 -> "... 99+ unread"` (cap).
- `formatUnreadCount(count: number): string` — `0 -> ""`, `7 -> "7"`, `100 -> "99+"`.

`message-scroller.variants.test.ts`: slot classes for each `placement`; no `self-*`; no
`overflow-hidden` on the list root; tokens exist in both themes; the content gutter class
equals `Screen.ChatList`'s (`px-screen-gutter`).

## 12. Playground demos (`apps/playground/src/demos/message-scroller/`)

| File | Description |
| --- | --- |
| `basic.tsx` | 40 seeded messages with plain bubbles, anchored to the bottom. **capture, hero** |
| `stick-to-bottom.tsx` | a "send" button appends messages; follows at the end, holds when scrolled up. **capture** |
| `jump-to-latest.tsx` | simulated incoming messages while scrolled up; button with unread count. **capture** |
| `load-older.tsx` | pull history on reaching the top, page of 20, 3 pages, then `hasOlder=false`. **capture** |
| `date-separators.tsx` | messages spanning five days, Today / Yesterday / weekday labels |
| `unread-divider.tsx` | `firstUnreadKey` with "3 new messages", `initialScrollTarget="unread"` |
| `keyboard.tsx` | a composer `TextInput` at the bottom, keyboard open and close preserving position |
| `empty.tsx` | `ListEmptyComponent` with `EmptyState` |
| `index.ts` | ordered `defineDemoGroup("message-scroller", {...})` |

Capture count 4 (`basic` hero, `stick-to-bottom`, `jump-to-latest`, `load-older`).
Video clips for the interactive ones, per the playground's preview convention.

## 13. Docs page

`apps/web/content/docs/native/components/message-scroller.mdx`, `title: Message
Scroller`, `icon: MessagesSquare`. Outline: Preview hero; Installation (call out the
LegendList and keyboard-controller peers via `<ComponentInstall>`); Usage; Stick to
bottom; Jump to latest; Loading older messages (the guard and `hasOlder`); Date
separators and the unread divider; Keyboard (`keyboardOffset`, `bottomInset`);
Rendering a message (`renderMessage` and `position`, with a `Message` snippet); Using the
controller with `Screen.ChatList`; Accessibility (why not inverted); API tables for the
root, `JumpButton`, parts, `useMessageScroller`. Joins `---Messaging---` in `meta.json`.

## 14. Acceptance checklist

- [ ] `message-scroller.utils.test.ts` and `message-scroller.variants.test.ts` written first, failing, then passing
- [ ] `bun run typecheck`; generic `T` flows through `renderMessage`; `MessageScrollerRow` is a discriminated union; no `any`
- [ ] `bun run check`; no comments in JSX
- [ ] `AGENTS.md` + Components table row in `packages/react-native-ui/AGENTS.md`
- [ ] `displayName` `DelacourUI.MessageScroller.<Part>` on the root and every part
- [ ] `bun run gen-exports`
- [ ] Demos + `bun run gen-demos`
- [ ] Route `apps/playground/src/app/(components)/message-scroller.tsx` + row in `src/app/index.tsx`
- [ ] `message-scroller.mdx` + `meta.json`
- [ ] `ITEM_META["message-scroller"]` + `bun run registry:build` (verify deep-subpath import classification)
- [ ] Changeset
- [ ] Simulator check via `warden` + `agent-device`, iOS and Android
- [ ] Appending at the bottom follows; appending while scrolled up does not move the viewport
- [ ] Loading a page of older messages does not jump the viewport; `onLoadOlder` fires once per reach
- [ ] Jump button appears with the right count, hides at the end, resets the count
- [ ] Keyboard open/close keeps the reader's position; sending always scrolls to end
- [ ] Initial render lands at the end with no flash from the top (seed insets as `Screen.ChatList` does)
- [ ] VoiceOver walks oldest to newest, date headers are navigable, new messages announced once per burst
- [ ] No imports of `message`, `attachment`, `screen` in this folder
- [ ] Performance check on 5,000 messages: no dropped frames scrolling, row recycling does not reset animated state
