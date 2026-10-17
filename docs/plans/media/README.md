# Media and motion — design specs

Plan `MEDIA-01`. Twelve new `@delacour/react-native-ui` components, each specified in its own
file here. A spec is the whole brief for the agent that builds it: API, file map, tests to write
first, demos, docs page and an acceptance checklist.

## Index

| Phase ID | Component | Spec | What it is |
| --- | --- | --- | --- |
| MEDIA-01-ATT | Attachment | [attachment.md](attachment.md) | A file, image or media tile — thumbnail, name, size, upload progress, remove and retry |
| MEDIA-01-MSG | Message | [message.md](message.md) | A chat bubble — side, avatar, author, timestamp, delivery status, run grouping |
| MEDIA-01-MSC | MessageScroller | [message-scroller.md](message-scroller.md) | A conversation list — bottom-anchored, sticks to latest, jump-to-latest, loads older |
| MEDIA-01-PST | Post | [post.md](post.md) | A social card — author, body, media, animated counts and votes |
| MEDIA-01-SUP | Support | [support.md](support.md) | The chrome around a help conversation — availability, channels, topics, tickets, agent, handoff |
| MEDIA-01-MRQ | Marquee | [marquee.md](marquee.md) | Content looping across its container at a speed in points per second |
| MEDIA-01-SCT | ScrollText | [scroll-text.md](scroll-text.md) | Text that resolves word by word as the screen scrolls |
| MEDIA-01-TXA | TextAnimation | [text-animation.md](text-animation.md) | Reveal, typing, rotating, counting and rolling text on one clock |
| MEDIA-01-CRT | CircularText | [circular-text.md](circular-text.md) | Text set on a circle, optionally spinning |
| MEDIA-01-CMP | Compare | [compare.md](compare.md) | Before/after, revealed by a draggable divider |
| MEDIA-01-FLP | FlipCard | [flip-card.md](flip-card.md) | Two faces, flipped by press, swipe or the app |
| MEDIA-01-QR | QrCode | [qr-code.md](qr-code.md) | A QR code from an in-house encoder, drawn as one SVG path |

## Build order

**One wave. Every component builds in parallel**, each on its own child branch off
`feature/cat-media`, and **no component imports a sibling**. Composition happens through
`children` and slots:

- `Message` takes an `Attachment`, an `Avatar` or reactions as children; it never imports
  `attachment`.
- `MessageScroller` takes `renderMessage`; its demos use plain bubbles until `Message` merges.
- `Post.Media` takes children, which is where an attachment gallery goes.
- `Support` leaves the transcript and composer to the app.

Once all twelve are merged here, an optional follow-up swaps the stand-in bubbles in the
`message-scroller` and `support` demos for the real `Message` and `Attachment`. That change touches
demos only, never library source.

## Category-wide decisions

These settle the open questions the specs raised. A child follows them over its own spec where
the two disagree.

1. **No new dependencies.** Every spec uses peers the package already declares (Reanimated,
   Gesture Handler, Worklets, `react-native-svg`, `@legendapp/list`, keyboard-controller, Pulsar,
   `expo-linear-gradient`). QR encoding is written in-house, in the component folder.
2. **Docs nav.** `apps/web/content/docs/native/components/meta.json` has a `---Media---` section,
   added on this branch. Each child adds its slug under it **in alphabetical order**, which keeps the
   merge conflicts mechanical.
3. **Registry category.** Every `ITEM_META` entry in `packages/cli/src/registry/config.ts` uses
   `categories: ["media"]`.
4. **Shared literal unions are restated, not shared.** `Message` and `MessageScroller` each declare
   `type MessagePosition = "single" | "first" | "middle" | "last"` locally. `ScrollText` and
   `TextAnimation` each keep a private `splitText` / `splitGraphemes` under the identical contract
   their specs fix. Hoisting either into `src/lib/` is a follow-up after integration, never on a
   child branch.
5. **`Post` keeps `formatRelativeTime` private.** Do not add a time helper to `src/lib/` on a
   child branch.
6. **`ScrollText` may use a bounded scroll host in its demos.** It is the one exception to the
   "no scroll view" rule in `apps/playground/src/demos/AGENTS.md`; that child adds the exception
   to that file with its reason, and also ships a slider-driven `progress` demo that needs no
   scrolling. `useScreenContext()` already returns `null` outside a `Screen`, so `source: "screen"`
   needs no new hook.
7. **Preview media is recaptured by the lead, after integration.** Children mark `capture` and
   `hero` in each demo's `meta` and do **not** run `bun run previews` — it needs a simulator lease
   for minutes and the argent flow files for clips. Where a spec lists a clip flow, the child
   writes the flow file but does not run it.
8. **Calm motion is an acceptance item for every looping component.** Marquee, CircularText,
   TextAnimation, Support's typing indicator and Post's count roll each state what they do under
   `useCalmMotion()` / reduce motion, and the simulator check confirms it.
9. **The QR tile is literal dark-on-light in both themes.** This departs from the token rule on
   purpose (inverted codes fail many scanners), and `qr-code/AGENTS.md` says so.

## Shared files every child edits

These conflict at merge, by design. The lead resolves them in `feature/cat-media`:

| File | Rule |
| --- | --- |
| `packages/react-native-ui/AGENTS.md` Components table | Insert the row alphabetically |
| `packages/react-native-ui/package.json` `exports` | Never hand-merge — re-run `bun run gen-exports` |
| `apps/playground/src/demos/registry.ts` | Never hand-merge — re-run `bun run gen-demos` |
| `apps/playground/src/app/index.tsx` | Add the row alphabetically within its group |
| `apps/web/content/docs/native/components/meta.json` | Alphabetically under `---Media---` |
| `packages/cli/src/registry/config.ts` | `ITEM_META` alphabetically |
| `registry/` | Never hand-merge — re-run `bun --filter delacour run registry:build` |
| `apps/web/src/registry/install.ts` | Never hand-merge — re-run `cd apps/web && bun run gen-install` |
| `apps/web/src/lib/components.ts` | `COMPONENTS` / `PLAYGROUND_SLUGS` entry alphabetically |

## Cross-category gaps (scoped out)

None of these exist yet, and no media component waits for one:

| Missing | Who wanted it | Seam left instead |
| --- | --- | --- |
| Popover / Menu / ContextMenu | Message, Post, Attachment | `onLongPress` / `onPress` handed to the app |
| Toast | Attachment, Message | The app reports errors; the component shows its own `error` state |
| Dialog / image viewer | Post, Attachment, Compare | `onPress` on the media |
| Composer / Input Group | Message, Support | `Textarea` stands in on demos |
| Swipe (swipeable row) | Message (swipe to reply) | Deferred |
| Image primitive | Compare, QrCode logo | Arbitrary children |

## Spikes to record in the component's AGENTS.md

- **Message:** whether Uniwind compiles logical corner classes (`rounded-ss-*`) for RTL; fallback
  is a style prop.
- **MessageScroller:** that the registry builder classifies the `@legendapp/list/keyboard`
  subpath; otherwise list it explicitly.
- **CircularText:** that `react-native-svg` honours `textLength` / `lengthAdjust` on iOS and
  Android, and that the Uniwind font family renders inside SVG text.
- **TextAnimation:** tabular figures for `Rolling`; `Counting`'s animated `TextInput` metrics match
  `Text`, else fall back to `Rolling`'s wheels.
- **FlipCard:** nested-tap arbitration — a button on a face must not also flip the card.
- **QrCode:** the Reed–Solomon, format-word and version-word vectors in the spec were written from
  memory; verify each against the standard before trusting it as a test oracle. The registry
  builder must skip `qr-code.test-helpers.ts` and `qr-code.fixtures.ts`.
