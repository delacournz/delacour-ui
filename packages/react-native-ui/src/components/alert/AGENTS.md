# Alert

A status message on a `Surface`: a glyph picked from its status, a title, a
description and, optionally, an action row and a dismiss control. Compound root
plus `Alert.Indicator`, `Alert.Content`, `Alert.Title`, `Alert.Description`,
`Alert.Action` and `Alert.CloseButton`.

`import { Alert } from "@delacour/react-native-ui/alert";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/alert` |
| `alert.tsx` | Root + the `Object.assign` compound surface |
| `alert-indicator.tsx` | `Alert.Indicator` |
| `alert-glyphs.ts` | **Leaf.** `ALERT_GLYPHS`, the status → glyph map — `toast/` imports it |
| `alert-content.tsx` | `Alert.Content` |
| `alert-title.tsx` | `Alert.Title` |
| `alert-description.tsx` | `Alert.Description` |
| `alert-action.tsx` | `Alert.Action` |
| `alert-close-button.tsx` | `Alert.CloseButton`, the dismiss pressable |
| `alert.context.tsx` | `AlertProvider`, `useAlert()`, `useAlertContext()`, `useAlertPart()`; the context carries `registerText` |
| `alert.types.ts` | `AlertSlotProps`, shared by `Content` and `Action` |
| `alert.variants.ts` | The slotted `tv()`, `ALERT_FOREGROUND_TOKEN`, `ALERT_SURFACE_PADDING` and the pure resolvers (tint, surface variant, live region, `extractAlertText`, `resolveAlertAnnouncement`) — no RN imports |
| `alert.variants.test.ts` | |
| `alert.render.test.tsx` | Mounted under Jest — alert role, per-platform announcements (iOS, Android, web), change, re-open and opt-out, hidden indicator, dismiss button, controlled and uncontrolled open, `useAlert().dismiss`, parts outside a root throw |

## Design

- **Two axes: `status` and `variant`.** `status` says what the message means —
  `default`, `info`, `success`, `warning`, `destructive` — and `variant` says
  how loudly: `soft` (the default) washes the surface in the status's `-soft`
  fill, `surface` keeps a neutral fill and lets the glyph and title carry the
  colour. **Sizes**: `sm`, `md`, `lg`, which move padding, gap, type and glyph
  together. `destructive` rather than `danger`, per the package's token rule.
- **It is built on `Surface`, and it adds only what a surface lacks.** The
  corner, the continuous curve, the padding (`ALERT_SURFACE_PADDING` maps each
  size onto the surface's own step) and the neutral fill all come from
  [Surface](../surface/AGENTS.md). `alertVariants`' root carries the row and the
  tint, and a test asserts it sets no padding of its own — a second one would
  fight the surface's through the merge.
- **Only a tinted alert names a fill.** `resolveAlertTinted` is true for `soft`
  plus a status, and those four cells swap `bg-card` for `bg-X-soft` and clear
  the card's hairline: a grey rule around a red wash reads as two components
  stacked. Every other alert leaves the surface's `variant` undefined
  (`resolveAlertSurfaceVariant`), so it steps from the plane it sits on — an
  alert inside a card lands on `secondary` rather than vanishing into the card.
  A tinted alert pins the surface to `default` instead, so what nests in it
  steps from a card like anything else.
- **One colour token per status, not per status and variant.**
  `ALERT_FOREGROUND_TOKEN` names `X-soft-foreground` for each status and the
  page's `foreground` for `default`; those are tuned to read on the soft fill
  and on the neutral fills alike. The title slot emits the same token as a
  class and the root publishes it through `IconDefaultsProvider`, so the glyph
  and the title are always one shade. A test pins the pair and asserts every
  token exists in both themes. The classes are written out literally —
  Tailwind's scanner is static, so a class assembled from the map at runtime
  would never be compiled.
- **The description is always muted.** A long explanation under a red title
  must not shout; the title carries the status.
- **`items-start`, and the indicator is as tall as the title's line.** A
  description that wraps to four lines must not drag the glyph to its middle.
  The indicator's height is the title's line height at each size (`h-5`/`h-6`/
  `h-7` against `text-sm`/`base`/`lg`), and it centres the glyph in that box, so
  the glyph sits level with the first line. Nothing else is a fixed height:
  `Text` respects OS font scaling, and a fixed box would clip a wrapped title.
- **Glyphs differ in shape, not just colour.** `warning` is a triangle and
  `destructive` a circle, so the two stay apart for anyone who cannot tell amber
  from red. `default` shares `info`'s circle. The map lives in
  `alert-glyphs.ts`, a leaf `Toast` shares, because the glyphs are RN SVG components and
  `alert.variants.ts` must stay free of React Native imports.
- **The indicator is hidden from assistive technology.** The title says what
  happened; "image" announced before it adds nothing. Children replace the
  glyph and inherit the alert's icon size and colour — a `Spinner` for a
  pending state needs nothing else.
- **Spoken once per platform, through the announcer — a live region alone is silent on iOS.**
  VoiceOver ignores `accessibilityLiveRegion`, and Android's live region does not reliably speak a
  view that has only just mounted, so an alert that appeared said nothing on iOS and often nothing
  on Android. The root calls `useAnnouncement` with `channel: "announcement"` and `onMount`: iOS and
  Android speak through the announcement API (live region `none`, so Android never speaks it
  twice), the web keeps the live region. The root keeps `accessibilityRole="alert"`.
  `resolveAlertLiveRegion` still picks the politeness — assertive for `warning` and `destructive`,
  polite (queued behind current speech) for the rest. The root is not made `accessible`: grouping
  it would swallow the close control and any action into one element.
- **The parts register their text; the alert speaks it.** `Alert.Title` and `Alert.Description`
  pass `extractAlertText(children)` to the context's `registerText` in an effect and clear it on
  unmount; `resolveAlertAnnouncement` joins the two ("Title. Description"). A change to either text
  is a new message and speaks again; a dismissed alert's parts unmount, so its message returns to
  null (closing says nothing) and re-opening speaks again. A part whose children are not plain text
  (a custom component fed by a prop) contributes nothing — put the words in `Title` and
  `Description` children, or pass `announce={false}` and speak it yourself.
- **It speaks on mount by default; `announce={false}` is for static content.** An alert that
  appears in response to something — a failed save, an expiring card — is a status message that
  WCAG 4.1.3 requires be perceivable without moving focus, so speaking on appearance is the point.
  An alert rendered as part of a screen's initial content is not a status change; it would
  interrupt the screen's own first read-out, so pass `announce={false}` there. The opt-out sets no
  live region either, on any platform. A burst of changes is coalesced by the announcer (first
  and last message heard), not spoken step by step.
- **Dismissal is controllable.** `isDismissible` composes an
  `Alert.CloseButton` in at the end. Uncontrolled, the alert hides itself when
  dismissed (`defaultOpen`); pass `isOpen` with `onOpenChange` to own it.
  `useAlert().dismiss` is on the context so an action ("Got it") can close the
  alert without the caller threading a setter down. A dismissed alert fades out
  over 150 ms rather than vanishing — the one `Animated.View` wrapper exists for
  that `exiting`, and a caller's `className` still reaches the surface.
- **The close glyph is muted, not the status colour.** The control is about the
  alert rather than part of what it says, and a red cross beside a red title
  reads as a second warning. It presses with `fade` — a spring on a glyph that
  small is a jitter — and carries `hitSlop={10}` to reach the 44-point target.
- **`closeTestID` reaches the composed close control.** The root's own `testID`
  names the alert's surface; the close part is a separate pressable with no id of its own
  unless the root forwards one, so a flow or test could only find it by its label.
  `closeTestID` is named like `closeAccessibilityLabel`, the other prop the root
  passes through to it.
- **Actions are the caller's.** `Alert.Action` is a wrapping row and styles
  nothing in it; a `Button` in there is sized and painted however the caller
  says. It wraps rather than overflowing, because two buttons and a long label
  outgrow a phone's width.
- **Parts are composed, not configured.** There is no `title` or `icon` prop:
  omit `Alert.Indicator` for a text-only alert, omit `Alert.Description` for a
  one-liner. The same reason `Button` and `Badge` compose their icons.
