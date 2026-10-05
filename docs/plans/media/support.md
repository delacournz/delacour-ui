# Support — design spec

Everything around a help conversation, not the conversation itself: who is answering, whether anyone is there, the ways to
reach them, what the problem is about, what happened to earlier requests, and the thread's furniture (agent, ticket,
handoff, suggested replies, wait note, resolution). Compound root plus 17 optional parts.

`import { Support } from "@delacour/react-native-ui/support";`

## 1. Purpose on mobile

- **A help screen is a short sequence of screens, not one.** Landing (status, channels, past requests, articles), topic
  pick, then the thread. Support supplies the sections and the thread furniture; the app owns routes. Keep the thread
  its own route: it scrolls differently and wants keyboard handling.
- **It never renders the transcript or the composer.** Turns belong to a message component and the composer to a text
  field; a second set of bubbles inside Support would drift from them. Support renders what sits *around* them.
- **`availability` is decided once, on the root.** A screen that is half "we are here" and half "we are not" is worse
  than either, so `Status`, `Agent` and `Note` read it from context.
- **Every part is optional.** No help centre, leave out `Articles`; one queue, leave out `Topics`.
- **Does not translate from the web:** hover tooltips on agent faces, multi-column help-centre grids, live-chat
  widget launcher bubble, mailto anchors (the app opens `Linking`), keyboard shortcuts.
- **Native additions:** `Support.Reply` chips scroll horizontally above the keyboard, haptic on topic selection and
  resolution, a typing indicator that follows the calm-motion rule, and ticket/unread state as swipe-less rows
  (swipe actions are the app's, via `Item.Actions`-style trailing slot).

## 2. Public API

```ts
import type { ReactElement, ReactNode } from "react";
import type { ViewProps } from "react-native";
import type { PressableProps } from "@delacour/react-native-ui/pressable";

export type SupportAvailability = "online" | "away" | "offline";
export type SupportTicketStatus = "open" | "pending" | "solved" | "closed";

export type SupportProps = ViewProps & {
	availability?: SupportAvailability; // "offline"
	className?: string;
};

export type SupportHeaderProps = Omit<ViewProps, "children"> & {
	title: string;
	description?: string;
	/** Trailing slot for the faces of the people who answer (an Avatar.Group). */
	trailing?: ReactNode;
	className?: string;
};

export type SupportStatusProps = Omit<ViewProps, "children"> & {
	/** Caller wording ("Typically replies in under an hour"). Absent => the availability's own label. */
	replyTime?: string;
	/** Override the availability from context for one status (rare). */
	availability?: SupportAvailability;
	className?: string;
};

type SectionProps = Omit<ViewProps, "children"> & {
	title?: string;
	description?: string;
	children: ReactNode;
	className?: string;
};
export type SupportChannelsProps = SectionProps;
export type SupportConversationsProps = SectionProps;
export type SupportArticlesProps = SectionProps;

export type SupportChannelProps = Omit<PressableProps, "asChild" | "children"> & {
	icon: ReactElement;
	label: string;
	description?: string;
	/** What it costs in waiting: "~1h". */
	detail?: string;
	/** Real but shut (out of hours, not on this plan): rendered dimmed, announced disabled, still present. */
	isDisabled?: boolean;
	className?: string;
};

export type SupportTopicsProps = Omit<ViewProps, "children"> & {
	title?: string;
	description?: string;
	value?: string | null; // controlled
	defaultValue?: string | null;
	onValueChange?: (value: string) => void;
	children: ReactNode;
	className?: string;
};
export type SupportTopicProps = Omit<PressableProps, "asChild" | "children" | "onPress"> & {
	value: string;
	icon?: ReactElement;
	label: string;
	description?: string;
	isDisabled?: boolean;
	className?: string;
};

export type SupportConversationProps = Omit<PressableProps, "asChild" | "children"> & {
	title: string;
	preview?: string;
	status: SupportTicketStatus;
	reference?: string; // "#4821"
	/** Caller wording: "2h", "Yesterday". */
	timestamp?: string;
	/** A reply nobody has read (accent dot). Mutually independent of `updated`. */
	unread?: boolean;
	/** The thread moved but nothing new to read (grey dot). `unread` wins when both are set. */
	updated?: boolean;
	className?: string;
};

export type SupportArticleProps = Omit<PressableProps, "asChild" | "children"> & {
	title: string;
	collection?: string;
	className?: string;
};

export type SupportAgentProps = Omit<ViewProps, "children"> & {
	name: string;
	role?: string;
	avatar?: ReactElement;
	/** Replaces the status line while true: the two answer the same question and the live one wins. */
	typing?: boolean;
	availability?: SupportAvailability;
	className?: string;
};

export type SupportTicketProps = Omit<PressableProps, "asChild" | "children"> & {
	title: string;
	reference?: string;
	status: SupportTicketStatus;
	className?: string;
};

export type SupportHandoffProps = Omit<ViewProps, "children"> & {
	/** "You were passed to Khalid, who can see everything you told the assistant." */
	children: string;
	className?: string;
};

export type SupportNoteProps = Omit<ViewProps, "children"> & {
	children: string;
	icon?: ReactElement;
	className?: string;
};

export type SupportRepliesProps = ViewProps & { children: ReactNode; className?: string };
export type SupportReplyProps = Omit<PressableProps, "asChild" | "children"> & {
	label: string;
	icon?: ReactElement;
	/** The way out to a person. Styled as primary-soft and announced as such. */
	escalates?: boolean;
	className?: string;
};

export type SupportResolutionProps = Omit<ViewProps, "children"> & {
	question?: string; // "Did that help?"
	/** The control that takes the answer is the caller's: a Rating, or two Buttons. */
	children: ReactNode;
	className?: string;
};

export type SupportContextValue = { availability: SupportAvailability };
export function useSupport(): SupportContextValue; // outside <Support>: returns { availability: "offline" }, never throws
```

`Support.Topics` also publishes `useSupportTopics(): { value: string | null; select(value: string): void }`.
Parts that only need availability read it from `support.context` and fall back to their own `availability` prop, so
`Agent` and `Note` work on a thread screen that never mounts a `Support` root. Therefore `useSupport()` does **not**
throw: it returns the default `"offline"`. Document this in AGENTS.md (the one deliberate departure from
throw-outside-root, with the failure it prevents: a thread route would otherwise need a dummy root).

## 3. File map

`packages/react-native-ui/src/components/support/`

| File | Holds |
| --- | --- |
| `index.ts` | -> `@delacour/react-native-ui/support` |
| `support.tsx` | Root + `Object.assign` of all 17 parts, `displayName: "DelacourUI.Support"` |
| `support-header.tsx`, `support-status.tsx` | landing top |
| `support-channels.tsx`, `support-channel.tsx` | ways in |
| `support-topics.tsx`, `support-topic.tsx` | single-select group (radiogroup) |
| `support-conversations.tsx`, `support-conversation.tsx` | past requests |
| `support-articles.tsx`, `support-article.tsx` | help-centre pages |
| `support-section.tsx` | internal titled-section leaf shared by Channels/Conversations/Articles/Topics (`DelacourUI.Support.Section`) |
| `support-agent.tsx`, `support-typing.tsx` | agent row; internal animated three-dot leaf |
| `support-ticket.tsx`, `support-handoff.tsx`, `support-note.tsx` | thread furniture |
| `support-replies.tsx`, `support-reply.tsx` | suggested answers |
| `support-resolution.tsx` | end question + slot |
| `support.context.tsx` | `SupportProvider`, `useSupport()`, `SupportTopicsProvider`, `useSupportTopics()` |
| `support.types.ts` | `SupportAvailability`, `SupportTicketStatus`, shared slot props |
| `support.variants.ts` | slotted `tv()` + pure resolvers |
| `support.variants.test.ts` | |
| `support.utils.ts` | `resolveAvailabilityLabel`, `resolveStatusA11yLabel`, `resolveTicketStatus`, `resolveConversationDot`, `resolveConversationA11yLabel`, `resolveAgentStatusLine`, `resolveNextTopic` |
| `support.utils.test.ts` | |
| `AGENTS.md` | |

Seventeen parts across ~14 files is the compound norm (one file per part). The two section leaves keep the rows
free of title-markup duplication; they never import the root (rule 3).

## 4. Variants & sizes

One slotted `tv()` (`supportVariants`), slots: `root`, `header`, `title`, `description`, `statusRow`, `statusDot`,
`statusLabel`, `section`, `sectionTitle`, `row`, `rowIcon`, `rowTitle`, `rowDescription`, `rowDetail`, `topic`,
`topicIndicator`, `conversationDot`, `ticketBadge`, `agent`, `agentStatus`, `typingDot`, `handoff`, `handoffRule`,
`handoffLabel`, `note`, `replies`, `reply`, `resolution`.

Axes:

- `availability` — `online | away | offline`: dot `bg-success | bg-warning | bg-muted-foreground`.
- `status` (ticket) — `open | pending | solved | closed`. Rendered as a soft `Badge`-family colour: open `info`,
  pending `warning` (waiting on the reader), solved `success`, closed `default`. Reuse Badge's colour pairings through
  the `badge.variants` leaf only if exporting them is clean; otherwise restate the six `-soft` token pairs and pin them
  with a test to the Badge's (the Avatar pattern).
- `dot` (conversation) — `unread | updated | none`: unread `bg-primary`, updated `bg-muted-foreground`.
- `selected` (topic) — border `border-primary bg-tertiary`, rest `border-border bg-card`.
- `escalates` (reply) — `bg-tertiary text-tertiary-foreground`, else `bg-muted text-foreground`.
- `isDisabled` — `opacity-50` (Pressable multiplies it into press feedback).
- No `size` axis: rows follow `Item`'s `md` metrics. Rows are `rounded-lg` when grouped in a card, per the card-corner rule.

## 5. States

- Status: online / away / offline, with and without `replyTime`.
- Channel: rest, pressed, disabled ("shut").
- Topic: unselected, selected, disabled; group empty vs preselected.
- Conversation: unread, updated, neither; each of 4 ticket statuses; long title/preview truncation (title 1 line, preview 2).
- Agent: online, away, offline, typing (status line replaced).
- Handoff: single, repeated in one thread.
- Replies: one, many (horizontal scroll), with an escalate reply.
- Resolution: unanswered (children interactive), answered (caller swaps children).

## 6. Accessibility

- **Topics is `accessibilityRole="radiogroup"`; each Topic is `radio`** with `accessibilityState={{ checked }}` and a
  label of `"Billing. Invoices, refunds and plans"`. One request goes to one queue, so it must be announced as exclusive.
- **Status is one live element:** `accessibilityRole="text"`, `accessibilityLiveRegion="polite"`, label
  `"Online. Typically replies in under an hour"`. The dot is decorative (`importantForAccessibility="no"`), because
  colour alone must not carry availability.
- **Conversation announces everything the dots draw:** `resolveConversationA11yLabel` ->
  `"Refund for order #4821, solved, unread reply, 2 hours ago. We've issued the refund..."`. Dots never speak.
- **Agent:** `"Khalid Abdi, Support, online"`; while `typing` the status becomes `"Khalid Abdi is typing"` with a
  polite live region so it is read once, not on every dot frame.
- **Handoff** is `accessibilityRole="text"` with a polite live region on mount so a screen-reader user hears the change
  of hands exactly when it happens in the transcript.
- **Note** is plain text above the composer; role `text`.
- **Reply** is a `button`; an `escalates` reply adds hint "Talk to a person".
- **Resolution** is a group (`accessible={false}` on wrapper, children keep roles) labelled by its `question`.
- **Reduced motion:** the typing indicator is a decorative loop -> `useCalmMotion()`; held still it shows three static
  dots at stepped opacity. No other motion is behaviour-critical.

## 7. Motion

- **Typing dots** (`SupportTyping`): three `Animated.View`s, staggered `withRepeat(withSequence(withTiming(1), withTiming(0.3)))`
  opacity, 900ms cycle, driven by shared values on the UI thread. Gated by `useCalmMotion()`: when calm, cancel and set
  static opacities `[1, 0.6, 0.3]`. This is the only loop, and the only reason an E2E build needs the calm flag here.
- **Status dot** colour change on availability change: `withTiming` on a colour interpolation is overkill; swap the
  class and let it snap. No animation, deliberately: it is state, not an event.
- **Topic selection:** border/background swap is instant (class change); `Pressable` supplies `fade` feedback and
  `selection` haptic. No sliding highlight, which would imply ordering that does not exist.
- **Reply enter:** `FadeInDown` with a small stagger on first mount only (`entering` on `Support.Reply`), using
  `ReduceMotion.System`.
- **Handoff:** `FadeIn` once on mount.

## 8. Reuses

`Item` + `ListGroup` (Channel, Conversation, Article rows are `Item`s inside a `ListGroup`-style card: context is read
through the `item.context` / `list-group.context` leaves only, rule 3), `Avatar` (Agent face; `Avatar.Badge` for the
presence dot), `Badge` leaf variants (ticket status), `Chip` (Reply's look; if its API fits, wrap it, else a Pressable
with the same `tv` tokens), `Radio` semantics (Topics uses its own `useControllableState`, not `Radio.Group`: Topic is
a card row with room for a description, not a labelled circle), `Text` presets, `Icon` (chevron, per-channel icons
come from the caller as elements), `Separator` (Handoff rule), `Pressable`, `Skeleton` for loading rows (demo only),
`useControllableState`, `useCalmMotion`, `cn`, `tv` from `lib/tv`.

## 9. Dependencies

- **New deps: none.** Only `react-native-reanimated` (existing required peer) and Pulsar via `Pressable`.
- Catalog/peer rules: nothing added to `workspaces.catalog`; nothing repeated per workspace.
- Registry:
  ```ts
  support: {
  	title: "Support",
  	description: "A help section: availability, channels, topics, past requests and the furniture around a support thread.",
  	categories: ["display"],
  },
  ```
  The builder derives intra-library dependencies (`item`, `list-group`, `avatar`, `badge`, `chip`, `pressable`, `text`,
  `icon`, `separator`); confirm `bun run registry:build` lists them under `registryDependencies`. `PACKAGE_INSTALL`
  needs no change.
- Changeset: `@delacour/react-native-ui` minor.

## 10. Sibling / cross-category dependencies

- **Ideal sibling compositions:** `Message` + `MessageScroller` (the transcript the furniture wraps); `Attachment` (a
  paperclip/upload reply). **Not imported.**
- **Decision: (a) children/slots only, buildable in wave 1.** Support has no code path that needs a sibling. The
  thread is demonstrated by the *consumer* composing `Support.Agent`, `Support.Ticket`, a list of turns and
  `Support.Note`. In wave 1 the demo renders turns with a small module-scope `Text`/`View` bubble helper *inside the demo
  file* (permitted: helper components are welcome), labelled as stand-in markup. When `Message`/`MessageScroller` merge,
  a wave-2 follow-up swaps the demo's helper for the real components; the library source does not change.
- **Why not wave 2 for the library itself:** importing `Message` would couple Support's merge to a branch that may
  restyle or rename it, and the root AGENTS.md forbids a sibling import without a declared ordering.
- **Missing from other categories, and how they are scoped:**
  - *AI input / chat composer* — not in this library; the thread's composer is the existing `Textarea` (+ `Button`) in
    the app/demo. Defer a real composer to its own component.
  - *Select / Combobox* — not needed; Topics is its own list.
  - *Dialog / Toast / Popover / Menu* — not needed. "Contact sent" feedback is the app's (Toast, once it exists).
  - *Input Group* — not needed; the composer demo uses `Input.Group` if present at merge time, else a plain row.
  - *Rating* — exists; `Support.Resolution` takes it as `children`, so no import from Support.
  - *Deep links / mailto / tel* — app-owned `onPress`.
  - *Relative time* — Support never formats time: `timestamp` is caller wording, so there is nothing to share with Post.

## 11. Pure logic to unit-test (TDD)

In `support.utils.ts` / `support.variants.ts`, no RN imports. Tests first.

```ts
resolveAvailabilityLabel(availability: SupportAvailability, replyTime?: string): string
// ("online", "Typically replies in under an hour") -> that string (caller wording wins)
// ("online") -> "We're online"; ("away") -> "We're away"; ("offline") -> "We're offline"; ("online", "") -> "We're online" (empty is absent)

resolveStatusA11yLabel(availability, replyTime?): string
// ("away", "Back tomorrow") -> "Away. Back tomorrow"; ("online") -> "Online"

resolveTicketStatus(status: SupportTicketStatus): { label: string; color: "info" | "warning" | "success" | "default"; needsReader: boolean }
// open -> "Open", info; pending -> "Waiting on you", warning, needsReader true; solved -> "Solved", success; closed -> "Closed", default

resolveConversationDot(input: { unread?: boolean; updated?: boolean }): "unread" | "updated" | "none"
// (unread) unread; (updated) updated; (both) unread; (neither) none

resolveConversationA11yLabel(input: { title: string; status: SupportTicketStatus; dot: "unread" | "updated" | "none";
	timestamp?: string; preview?: string }): string
// -> "Refund for order #4821, solved, unread reply, 2h. We've issued the refund."
// updated -> "..., updated"; no timestamp/preview segments are omitted with no dangling punctuation

resolveAgentStatusLine(input: { role?: string; availability: SupportAvailability; typing?: boolean; name: string }):
	{ text: string; live: boolean }
// typing -> { "Khalid is typing", live true } (first name only); else role + " · " + availability label; no role -> label only

resolveNextTopic(current: string | null, pressed: string, options: { disabledValues: readonly string[] }): string | null
// disabled pressed -> current unchanged; same value pressed -> same value (a topic is not toggled off: a request needs a queue)

resolveTypingOpacities(isCalm: boolean): readonly [number, number, number]
// calm -> [1, 0.6, 0.3]; moving -> [1, 1, 1] start values (animation takes over)
```

`support.variants.test.ts` asserts: every ticket `status` and `availability` cell resolves a token that exists in **both**
variants of `theme.css`; no `self-*` on `root`; no `dark:`/raw palette classes; `unread` and `updated` dots resolve to
different classes (the two-dot rule); text colour is on label slots, never on `root`/`row`.

## 12. Playground demos

`apps/playground/src/demos/support/` (route `(components)/support.tsx`):

| File | Description | Meta |
| --- | --- | --- |
| `help-screen.tsx` | Header, status, three channels, two past requests (unread vs updated dots) | `capture`, **`hero`** |
| `availability.tsx` | online / away / offline status in caller wording and fallback; tap cycles | `capture` (flow: `support/availability`) |
| `topics.tsx` | Single-select topics; Continue disabled until one is picked | `capture` (flow: `support/topics`) |
| `conversations.tsx` | All four ticket statuses, unread vs updated | `capture` |
| `thread.tsx` | Agent (typing toggle), ticket, handoff, stand-in turns, replies, note | `capture` (flow: `support/thread`) |
| `escalation.tsx` | Replies with an escalate reply; tap inserts the handoff | gallery only |
| `articles.tsx` | Help-centre rows with collection captions | gallery only |
| `resolution.tsx` | Resolution with a `Rating` and with two Buttons | gallery only |
| `disabled-channel.tsx` | A shut channel dimmed, announced disabled | gallery only |

`testID`s: `support-channel-message`, `support-topic-billing`, `support-reply-human`, `support-typing`.
Demos import only from `@delacour/react-native-ui/*`; Rating and Textarea are real imports (they already exist), the
message bubbles are the in-file stand-in.

## 13. Docs page

`apps/web/content/docs/native/components/support.mdx`: `title: Support`, `description: A help section: availability,
channels, topics, requests and the furniture around a support thread.`, `icon: LifeBuoy`.
Outline: `<Preview id="support/help-screen" title={null} />`; Installation; Usage; Composition tree; The ways in
(Channels); Whether anyone is there (availability on the root); Routing to a queue (Topics, controlled/uncontrolled);
What happened to the last one (status vs unread vs updated); The conversation itself (furniture around a
transcript; note that turns and composer are the app's); Handing off to a person (escalate reply + Handoff);
Accessibility; Notes (why rows not tiles, why `Note` sits above the composer, why separate routes); API reference per
part. Joins `meta.json` under **Data Display** after `item` (or the shared "Media and Motion" heading if the lead adds it).

## 14. Acceptance checklist

- [ ] Tests first, failing then passing: `bun test packages/react-native-ui/src/components/support`
- [ ] `bun run typecheck` clean (no `any`; availability/status as string unions)
- [ ] `bun run check` (Biome) clean; no comments in JSX
- [ ] `support/AGENTS.md` + row in the Components table of `packages/react-native-ui/AGENTS.md`
- [ ] `displayName` on all 17 parts, providers and the section/typing leaves; `bun test` display-name passes
- [ ] `bun run gen-exports`
- [ ] Demos listed in `demos/support/index.ts`, `bun run gen-demos`; 4-6 `capture`, one `hero`
- [ ] Route `apps/playground/src/app/(components)/support.tsx` + row in `src/app/index.tsx`
- [ ] Docs page `support.mdx` + `meta.json` entry
- [ ] `ITEM_META.support` added; `bun run registry:build` clean
- [ ] Changeset (react-native-ui minor)
- [ ] Simulator check via `warden claim ios --json` + `agent-device` (open `/support`, snapshot, press a topic, `wait`
      for Continue enabled, toggle typing, `close`, `warden release`)
- [ ] Component-specific:
  - [ ] Only one Topic is ever selected; VoiceOver announces radio group and checked state
  - [ ] Unread and updated dots are visibly different colours and both spoken in the row label
  - [ ] `Support.Agent typing` replaces the status line and announces once
  - [ ] Typing dots hold still under Reduce Motion and with `isMotionCalm` (E2E build idle-waits)
  - [ ] A shut Channel is dimmed, present, announced disabled, and ignores taps
  - [ ] `Agent`/`Note` render correctly on a route with no `<Support>` root (offline default, no throw)
  - [ ] Handoff sits between turns and reads on mount
  - [ ] Imports no sibling component (grep for `message`, `message-scroller`, `attachment`, `post` under `support/`)
