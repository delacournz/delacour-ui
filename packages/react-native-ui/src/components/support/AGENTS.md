# Support

Everything around a help conversation, not the conversation itself: who is answering, whether
anyone is there, the ways to reach them, what the problem is about, what happened to earlier
requests, and a thread's furniture — the agent, the ticket, a handoff, suggested replies, a note
above the composer and the closing question. Compound root plus seventeen optional parts.

`import { Support } from "@delacour/react-native-ui/support";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/support` |
| `support.tsx` | Root + the `Object.assign` compound surface of all seventeen parts |
| `support-header.tsx` | `Support.Header` — title, line, trailing slot for faces |
| `support-status.tsx` | `Support.Status` — the availability dot and line, one live element |
| `support-channels.tsx`, `support-channel.tsx` | `Support.Channels` card, `Support.Channel` row |
| `support-topics.tsx`, `support-topic.tsx` | `Support.Topics` radiogroup, `Support.Topic` card row |
| `support-conversations.tsx`, `support-conversation.tsx` | Past requests card and row |
| `support-articles.tsx`, `support-article.tsx` | Help-centre card and row |
| `support-section.tsx` | Internal titled-section leaf the four groups share (`DelacourUI.Support.Section`) |
| `support-agent.tsx` | `Support.Agent` — face, name, status line or typing |
| `support-typing.tsx` | Internal three-dot loop (`DelacourUI.Support.Typing`) |
| `support-ticket.tsx` | `Support.Ticket` — the request a thread belongs to |
| `support-handoff.tsx` | `Support.Handoff` — the change of hands, between turns |
| `support-note.tsx` | `Support.Note` — a quiet line above the composer |
| `support-replies.tsx`, `support-reply.tsx` | Suggested answers row and chip |
| `support-resolution.tsx` | `Support.Resolution` — the closing question and the caller's control |
| `support.context.tsx` | `SupportProvider`, `useSupport()`, `useSupportContext()`, `SupportTopicsProvider`, `useSupportTopics()` |
| `support.types.ts` | `SupportAvailability`, `SupportTicketStatus`, their tuples, `SupportSectionProps` |
| `support.variants.ts` | The slotted `tv()`, the badge/chip/icon-token constants, `resolveReplyColor` |
| `support.utils.ts` | Labels, spoken labels, the dot and the topic resolvers — no RN imports |
| `support.variants.test.ts`, `support.utils.test.ts` | |

## Scope

- **It never renders the transcript or the composer.** Turns belong to a message component and
  the composer to a text field; a second set of bubbles here would drift from them. Support renders
  what sits *around* them, and the app composes the turns between its parts. It imports no sibling
  media component — the playground's `thread` demo draws its turns with stand-in markup in the demo
  file.
- **A help screen is a short sequence of routes, not one.** Landing (status, channels, requests,
  articles), topic pick, then the thread. Support supplies the sections; the app owns routes. The
  thread wants its own route because it scrolls differently and needs keyboard handling.
- **Every part is optional.** No help centre, leave out `Articles`; one queue, leave out `Topics`.
- **It never opens anything.** A channel's `onPress` is the app's — `Linking`, a route, a sheet.
  `mailto:` anchors and a launcher bubble are web shapes that do not translate.
- **It never formats time.** `timestamp` is caller wording ("2h", "Yesterday"), so there is
  nothing to share with another component's relative-time helper.

## Availability

- **`availability` is decided once, on the root.** A screen that is half "we are here" and half
  "we are not" is worse than either, so `Status`, `Agent` and `Note` read it from context. Each also
  takes its own `availability` for the rare override.
- **`useSupport()` never throws — the one deliberate departure from throw-outside-root.** Outside a
  `<Support>` it returns `{ availability: "offline" }`. `Agent` and `Note` live on the thread route,
  which usually mounts no root; throwing would force every such route to wrap itself in a dummy
  `<Support>` just to render a name. `useSupportContext()` returns `null` for a caller that needs to
  know. `useSupportTopics()` does throw: a topic outside a group has no queue to pick.
- **The status dot snaps.** A change of availability is state, not an event, so the class swaps and
  nothing animates.

## Rows

- **Channel, Conversation and Article are `Item`s inside a `ListGroup`.** They take the group's
  metrics, dividers and `rounded-lg` card corner rather than restating them, so a help screen's
  cards match every other card in the app. There is no size axis for the same reason.
- **A shut channel stays on screen.** Dimmed, announced disabled, ignoring taps — but present. A
  reader who knows the phone line exists and finds it gone assumes the app is broken.
- **Two dots, two colours, and neither speaks.** `unread` is `bg-primary`, `updated` is
  `bg-muted-foreground`, and `unread` wins when both are set — two dots on one row would say
  neither. The dot slot keeps its width when there is none, so every title starts on one line.
  `resolveConversationA11yLabel` reads the whole row as one sentence, status and dot included,
  because colour must not be the only carrier.
- **A ticket status is a soft `Badge`**, via `badge.variants` only for its type: open `info`,
  pending `warning` (labelled "Waiting on you" — the one status that asks the reader to act),
  solved `success`, closed `default`. The test resolves every cell through `badgeVariants` and
  checks both themes declare the tokens.

## Topics

- **A radiogroup of radios.** One request goes to one queue, so it is announced as exclusive:
  `accessibilityRole="radiogroup"` on the group, `radio` with `checked` on each card, labelled
  `"Billing. Invoices, refunds and plans"`.
- **Its own state, not `Radio.Group`'s.** A topic is a card row with room for a description, not a
  labelled circle. `useControllableState` drives it, controlled or not.
- **A topic is never toggled off.** Pressing the selected one keeps it — a request needs a queue.
  A disabled topic is refused inside `select` too (`registerDisabled`), so a custom row calling
  `useSupportTopics().select` cannot pick one either.
- **Selection snaps.** Border and fill swap; no sliding highlight, which would imply an order the
  topics do not have. `Pressable` supplies the fade and a `selection` haptic.

## Thread furniture

- **`Agent` takes `title`, not `role`.** React Native's `role` is the ARIA role every `View` accepts;
  a `role="Support"` intersected it into a type error at the call site and fails Biome's
  `useValidAriaRole`. The spec said `role`; the collision is why it is not.
- **`Agent` while `typing` replaces its status line** with three dots and "Omar is typing" — the
  two answer the same question and the live one wins. The spoken label becomes
  `"Omar Haddad is typing"` and is announced **once**: a polite live region on Android and
  `announceForAccessibility` on iOS, which has no live regions. Never per dot frame.
- **The typing dots are the only loop**, and decorative. Under `useCalmMotion()` (reduce motion or
  `isMotionCalm`) they hold still at `1, 0.6, 0.3`, which still reads as typing. The timings run with
  `ReduceMotion.Never` on purpose: under `System` a `withTiming` completes instantly while reduce
  motion is on, and `withRepeat(-1)` would spin a zero-length animation forever. Calm is honoured
  one level up, by never starting the loop.
- **`Handoff` announces on mount** so a screen-reader user hears the change of hands exactly when it
  happens in the transcript. `announce={false}` is for a handoff loaded as history, so opening a
  thread does not read every past one. It fades in once.
- **`Note` sits above the composer, not in the transcript**, because it describes the next message,
  not a past one. Its default glyph follows availability — a moon offline, a clock away, none online.
- **`Reply` is a soft `Chip`.** The escalating one is primary-soft and adds the hint "Talk to a
  person"; the rest are neutral. The spec suggested `bg-tertiary`, but wrapping `Chip` keeps one chip
  in the library rather than two that drift, and `resolveReplyColor` is pinned against
  `chipVariants` by a test.
- **`Replies` scroll sideways with `keyboardShouldPersistTaps="handled"`**, so a chip lands while the
  keyboard is up. Each fades up on first mount with a 40ms stagger, skipped under reduce motion.
- **`Resolution` is a group, not one element.** `accessible={false}` with the question as its label,
  so the caller's `Rating` or `Button`s keep their own roles. The control is the caller's; swap the
  children for a thank-you once answered.

## Not here

- Swipe actions on a request row — the app's.
- A composer — `Textarea` stands in on the demos until a real one exists.
- Hover tooltips on agent faces, multi-column help-centre grids, keyboard shortcuts.

## Previews (follow-up)

No demo carries `capture` yet: a captured demo with no manifest entry fails `demos.test.ts`, and
the media are shot after integration. The five to capture, all `align: "stretch"`: `help-screen`
(**hero**), `availability` (flow `support/availability`), `topics` (flow `support/topics`),
`conversations`, and `thread` (flow `support/thread`). The three flows are already written under
`.argent/flows/previews/support/`. Add the `<Preview>` blocks to `support.mdx` in the same change —
a `<Preview id>` for an uncaptured demo throws at render.

## Simulator check (2026-10-05, iPhone 17, iOS dev client)

- `topics`: one topic checked at a time (`radio button, checked` / `unchecked`), re-pressing the
  selected one keeps it, Continue enables on the first pick.
- `thread`: `Support.Agent` reads "Omar Haddad is typing" with the dots, then "Omar Haddad, Support,
  online" once typing stops. Under OS Reduce Motion two frames 370ms apart are pixel-identical, the
  dots stepped `1, 0.6, 0.3`.
- `disabled-channel`: the shut "Call us" row is present, dimmed and `enabled: false`.
- `help-screen`: unread (accent) and updated (grey) dots differ, and both rows speak the dot and
  status in their label.
