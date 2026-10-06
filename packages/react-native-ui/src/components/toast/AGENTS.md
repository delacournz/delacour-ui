# Toast

A brief, non-blocking message about something that just happened — "Link copied", "Saved",
"Upload failed — Retry" — shown from anywhere, including outside React, and gone on its own.
Anything that must be read or answered is an `Alert` or a `Dialog`, not a toast.

`import { Toast, ToastViewport, toast, useToast } from "@delacour/react-native-ui/toast";`

Three pieces: `toast` (a module-level function that writes to a store), `<ToastViewport />` (mounted
once, it draws the store) and `<Toast>` (the card, compound, also usable inside a custom `render`).

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/toast` |
| `toast.tsx` | `Toast` — the card root, one accessible element; the `Object.assign` names the parts |
| `toast-indicator.tsx` | `Toast.Indicator` — Alert's glyph for the status (`alert/alert-glyphs.ts`, a leaf) |
| `toast-content.tsx` | `Toast.Content` |
| `toast-title.tsx` | `Toast.Title` — coloured from Alert's token |
| `toast-description.tsx` | `Toast.Description` — muted |
| `toast-action.tsx` | `Toast.Action` — compact text button; registers itself as the card's `activate` |
| `toast-close.tsx` | `Toast.Close` — the ✕ |
| `toast.context.tsx` | **Leaf.** The card's context (`status`, `hide`, `registerAction`) and the viewport's per-item context |
| `toast.store.ts` | **Pure.** Types, `reduceToasts`, `normalizeToastInput`, `createToastStore`, `createToastApi` |
| `toast.timer.ts` | **Pure.** The pausable auto-hide clock |
| `toast.variants.ts` | **Pure.** The slotted `tv()`, the constants and every resolver — duration, stack, depth, stacked height, stagger, drag, release, haptic, announcement |
| `toast-api.ts` | `toastStore`, `toast`, `useToast` |
| `toast-viewport.tsx` | `ToastViewport` — two stacks in the overlay `toast` band; insets, keyboard, `AppState`, screen reader |
| `toast-item.tsx` | One drawn toast: entrance, depth, exit, clock, swipe, announcement, haptic |
| `*.test.ts` | The store, the clock and the resolvers |

## Design

- **`toast` is a function on a module-level store, not a hook.** A toast's most common caller is
  not a component — an API client, a mutation's `onError` — so `toast("Saved")` has to work with no
  provider and no hook. `toast-api.ts` holds the one store; `ToastViewport` and `useToast` read it
  with `useSyncExternalStore`. The store is `createToastStore()`, so a test (or an app wanting two
  viewports) can make its own and hand it to `<ToastViewport store>`.
- **The store is a pure reducer.** `add | update | hide | remove | hideAll`. `hide` only marks a toast
  `isExiting`, so the viewport can animate it out; `remove` drops it once the exit has run, and is
  the moment `onHide` fires. An action that changes nothing returns the same array, so nobody is
  notified. Showing with an existing `id` replaces that toast in place — and revives it if it was
  leaving.
- **`revision` is how an update reaches the screen.** Every update bumps it; the item restarts its
  clock, plays the haptic and announces again on a new revision. That is what makes
  `toast.promise` one toast: shown loading (a spinner for the glyph, `duration` 0), then updated in
  place to success or failure with a full duration, a haptic and a fresh announcement. `promise`
  returns the caller's promise, so `await` still sees the rejection.
- **`isLoading` is an option, beyond the four statuses.** A loading toast is not a fifth status — it
  says nothing about how things went — so it is a flag: a `Spinner` replaces the glyph, the ✕ is
  dropped, and the toast stays until updated unless `duration` says otherwise.
- **Statuses are Alert's.** `TOAST_STATUSES` *is* `ALERT_STATUSES` and the title reads
  `ALERT_FOREGROUND_TOKEN` (a test pins each class), and the glyph is Alert's — moved to the
  `alert-glyphs.ts` leaf for this. A toast and an alert saying the same thing look like one family.
  `toast.error` sets `destructive`, the token's name.
- **The card is a `popover` surface with a hairline and no shadow**, like every surface here, capped
  at 560pt and centred so it stays a toast on a tablet.
- **Durations: 4000, 6000 with an action, `0` until hidden, ≥10000 under a screen reader.** Reaching
  for a button takes longer than reading. A timed message must be readable in full before it leaves
  (WCAG 2.2.1), so `resolveToastDuration` stretches any timed toast to ten seconds while VoiceOver or
  TalkBack runs; `0` stays `0`.
- **The clock is data and pauses exactly.** `toast.timer.ts` keeps `{ remaining, startedAt }` and
  every function takes `now`. The item runs one `setTimeout` per run and pauses — keeping what is
  left — while the app is not `active` and while a finger is on the toast (the pan's `onBegin`, which
  fires on touch-down, before the pan activates, so pressing the action pauses too).
- **Three drawn per edge, the rest queued.** `resolveToastStack` walks newest first; depth counts only
  toasts that are staying, so when one is hidden the ones behind move up and the next queued toast is
  drawn immediately while the hidden one fades out at the depth it left. Each older toast sits 8pt
  further toward its entry edge, `1 − 0.05·depth` scale and `1 − 0.25·depth` opacity, scaled about
  that edge (`transformOrigin`) so the peek is exactly 8pt. Depth is animated, and linear, so moving
  up is smooth.
- **A toast behind takes the front toast's height.** Scaled about the edge, a taller older toast
  rose past the front card and showed its title above it — seen on the simulator with a one-line
  toast in front of a two-line one. The front item publishes its card height to a per-stack shared
  value; `resolveToastStackedHeight` gives the ones behind that height, clipped from the centre side
  so their edge-side border still peeks, and eases back to their own height as they move to the
  front. The card is measured inside the clip, so the clip never feeds back into its own size.
- **Toasts shown in one tick enter 220ms apart.** The store numbers toasts created before a microtask
  runs (`batchIndex`); `resolveToastEnterDelay` counts from `createdAt`, so a toast that sat in the
  queue enters as soon as it is drawn rather than paying its stagger late.
- **Swipe toward the entry edge or sideways dismisses; toward the centre rubber-bands.** Past 40% of
  the toast's own height or width, or a fling over 800pt/s. Toward the centre it follows the finger
  to at most 24pt and never dismisses — that is not where a toast goes. The pan activates only past
  10pt, so a tap still reaches the action and the ✕. Under reduce motion the entrance is a fade; the
  drag still follows the finger, which is direct manipulation, not decoration.
- **The viewport is `box-none` all the way down.** Two absolute stacks in `Overlay.Portal
  layer="toast"` — above every sheet, dialog and popover — and only a card takes a touch, so the app
  under the viewport stays tappable. It renders nothing while the store is empty, which keeps it out
  of the overlay registry. The top stack sits `insets.top + 8` down; the bottom one `insets.bottom +
  8` up and lifts with the keyboard by the part of the keyboard above the home-indicator inset.
  `offset` adds to either, to clear a tab bar.
- **One accessible element, never focused.** The card is `accessible`, so VoiceOver and TalkBack read
  the title and description as one message; the action is its `activate` action (registered by
  `Toast.Action` under its label) and the ✕ is `escape` plus a custom "Dismiss". `role="alert"` for a
  failure, a polite live region on Android. On show, and on every revision, the item announces
  `title. description` — on iOS a warning or failure with `queue: false`, so it cuts in. A toast
  never moves focus.
- **Haptics follow the status.** Success, warning and destructive play their notification preset
  (`playHaptic`, on the UI thread); default and info are silent; `haptic` overrides, `false` silences.
- **No back button.** The registry's `isTopOverlay` ignores the `toast` band, so Android back goes to
  whatever is under the toasts.
- **Custom toasts compose `<Toast>`.** `render(handle)` draws the whole card; a `<Toast>` inside it
  reads the viewport's per-item context and hides the right toast with no `onHide`. Outside the
  viewport — a static preview — pass `onHide` yourself.

## Mounting

```tsx
<DelacourProvider>
  <OverlayProvider>
    <BottomSheetProvider>
      <Stack />
      <ToastViewport />
    </BottomSheetProvider>
  </OverlayProvider>
</DelacourProvider>
```

`apps/playground/src/app/_layout.tsx` is the reference mount.

## Testing

`bun test` reaches the reducer, the store's batching, the api (including `promise` both ways), the
clock and every resolver. Motion, gestures, insets, the keyboard and announcements are verified on a
simulator through `/toast`.

## Preview capture (not yet shot)

No demo is marked `capture` — the capture tool is unavailable (see `docs/plans/overlays/README.md`).
The flows are in `.argent/flows/previews/toast/`. When it is back, set:

| Demo | `capture` |
| --- | --- |
| `statuses` | `{ flow: "toast/statuses", frame: "device", hero: true }` |
| `with-action` | `{ flow: "toast/with-action", frame: "device" }` |
| `placement` | `{ flow: "toast/placement", frame: "device" }` |
| `promise` | `{ flow: "toast/promise", frame: "device" }` |

`frame: "device"` because a toast draws in a portal, outside the demo's measured stage.
