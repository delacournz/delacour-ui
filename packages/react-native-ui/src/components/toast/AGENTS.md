# Toast

A brief, non-blocking message about something that just happened — "Link copied", "Saved",
"Upload failed — Retry" — shown from anywhere, including outside React, and gone on its own.
Anything that must be read or answered is an `Alert` or a `Dialog`, not a toast.

`import { Toast, ToastViewport, toast, useToast, useToastOffset } from "@delacour/react-native-ui/toast";`

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
| `toast.offset.ts` | **Pure.** `createToastOffsetStore` (per-edge chrome sources, newest wins) and `resolveToastEdgeLift` (a worklet) |
| `use-toast-offset.ts` | `useToastOffset` — registers shared values of its own while mounted: animated to a number, or following a caller's shared value |
| `toast.timer.ts` | **Pure.** The pausable auto-hide clock |
| `toast.variants.ts` | **Pure.** The slotted `tv()`, the constants and every resolver — duration, stack, depth, stacked height, stagger, drag, release, haptic, announcement |
| `toast-api.ts` | `toastStore`, `toast`, `useToast`, `toastOffsetStore`, `setToastOffset` |
| `toast-viewport.tsx` | `ToastViewport` — two stacks in the overlay `toast` band; insets, keyboard, `AppState`, screen reader |
| `toast-item.tsx` | One drawn toast: entrance, depth, exit, clock, swipe, announcement, haptic |
| `*.test.ts` | The store, the clock, the offset registry and the resolvers |
| `toast.render.test.tsx` | Mounted under Jest — the viewport drawing `toast()` calls, title/description, action and close, alert role and live region, assistive `activate`/`dismiss`, fake-timer auto-dismiss and the stagger, revival during an exit and after a swipe, a hidden queued toast, a disabled action, a VoiceOver double-tap, custom `render`, parts outside a `Toast`, each stack's lift from a shared value and from `useToastOffset`, and the hook following a shared value |

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
  leaving. The exit's callback reaches the JS thread a frame after it finishes, by when `show` may
  have revived the id, so the item dispatches `remove` with the `revision` it exited at: the
  reducer drops the toast only while it is still exiting at that revision, and the item calls
  `onHide` only when it did. A revived toast also resets its drag, which cancels a swipe-out that
  was carrying it off screen.
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
  every function takes `now`. Each new clock (a new `revision` or duration) adds what is left of the
  entrance stagger, so a toast late in a batch — or updated while it waits — is up for its full
  duration; once it has entered that wait is 0. The item runs one `setTimeout` per run and pauses — keeping what is
  left — while the app is not `active` and while a finger is on the toast (the pan's `onBegin`, which
  fires on touch-down, before the pan activates, so pressing the action pauses too).
- **Three drawn per edge, the rest queued.** `resolveToastStack` walks newest first; depth counts only
  toasts that are staying, so when one is hidden the ones behind move up and the next queued toast is
  drawn immediately while the hidden one fades out at the depth it left. A queued toast is never
  drawn, so no item can run its exit: hidden while queued, the viewport removes it at once and
  calls its `onHide`. Each older toast sits 8pt
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
- **Toasts lift clear of app chrome, and follow it.** A tab bar, a bottom toolbar or a custom header
  calls `useToastOffset({ bottom: height })` (or `setToastOffset` outside React) with how much of
  the screen edge it covers, measured from the edge like its layout height. The registry holds
  Reanimated shared values, and the hook always registers its own: a number animates it there
  (220ms, or straight there under reduce motion; a source's first value jumps, so a first
  measurement does not slide in from 0), and a shared value the caller drives — a bar's measured
  height written with `.set()` in `onLayout`, a bar that hides on scroll — is followed on the UI
  thread (`useAnimatedReaction`, no deps array: Reanimated 4 ignores one on native and warns), so
  the toasts follow with no state and no re-render. Owning the value is what lets every switch
  animate: before, a caller's shared value was registered as is, and focus loss dropped it to 0 at
  once. The newest registration wins per edge and releasing it restores the one before, so a pushed
  screen's toolbar and the tab bar under it need not know about each other. `null` slides every
  edge the hook showed back to 0, numeric or followed, but keeps its place, which is what a tab bar passes when its screen loses focus (JS tabs stay mounted under a
  pushed screen, so focus, not mount, is the signal); a shared value given again animates to its
  current value and then follows it. `resolveToastEdgeLift` lifts by the part above
  the safe area and takes the larger of chrome and keyboard — the keyboard draws over a tab bar, so
  they never add up. Each stack's animated style lists its source in its dependencies: without it,
  a source registered after the stack mounted was never read. The static `offset` prop still sets
  the gap.
- **Swipe toward the entry edge or sideways dismisses; toward the centre rubber-bands.** Past 40% of
  the toast's own height or width, or a fling over 800pt/s. Toward the centre it follows the finger
  to at most 24pt and never dismisses — that is not where a toast goes. The pan activates only past
  10pt, so a tap still reaches the action and the ✕. A pan the system cancels — the notification shade, an alert — is
  not a release: the toast springs back to rest, however far it was dragged. Under reduce motion the entrance is a fade; the
  drag still follows the finger, which is direct manipulation, not decoration.
- **The viewport is `box-none` all the way down.** Two absolute stacks in `Overlay.Portal
  layer="toast"` — above every sheet, dialog and popover — and only a card takes a touch, so the app
  under the viewport stays tappable. It renders nothing while the store is empty, which keeps it out
  of the overlay registry. The top stack sits `insets.top + 8` down; the bottom one `insets.bottom +
  8` up and lifts with the keyboard by the part of the keyboard above the home-indicator inset.
  `offset` adds a fixed gap to either; chrome that can change registers with `useToastOffset`.
- **One accessible element, never focused.** The card is `accessible`, so VoiceOver and TalkBack read
  the title and description as one message; the action is its `activate` action (registered by
  `Toast.Action` under its label, and not at all while it is `disabled`) and the ✕ is `escape` plus a
  custom "Dismiss". A VoiceOver double-tap calls `onAccessibilityTap`, not `activate`, so the card
  sets it to the registered action as well (and still calls a caller's own); with no action it stays
  unset. Likewise VoiceOver's two-finger escape (the "Z" scrub) calls `onAccessibilityEscape`,
  not the `escape` action, so the card sets it to `hide` and still calls a caller's own. `role="alert"` for a
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

Lift toasts above a tab bar from the bar itself, only while its screen is focused. The height lives
in a shared value, so a layout pass re-renders nothing; write it with `.set()` rather than `.value =`,
which the React Compiler's lint rejects in a callback created during render:

```tsx
function TabBar(props: BottomTabBarProps) {
  const isFocused = useIsFocused();
  const height = useSharedValue(0);
  useToastOffset(isFocused ? { bottom: height } : null);
  return <View onLayout={(event) => height.set(event.nativeEvent.layout.height)}>{tabs}</View>;
}
```

## Testing

A unit test reaches the reducer, the store's batching, the api (including `promise` both ways), the
clock, the offset registry and every resolver. A render test checks each stack's lift from a shared
value and from `useToastOffset`, including the slide back on `null`, a followed shared value, and the
release on unmount; and the lifecycle edges — a revival during an exit or after a swipe, a hidden
queued toast, the clock across the entrance stagger, a disabled action and a VoiceOver double-tap. Motion, gestures, insets, the keyboard and announcements are verified on a
simulator through `/toast`.

## Preview capture

The <!-- registry:omit -->bodies are in `apps/playground/e2e/previews/toast.e2e.ts`; the <!-- /registry:omit -->captured demos are:

| Demo | `capture` |
| --- | --- |
| `statuses` | `{ flow: true, frame: "device", hero: true }` |
| `with-action` | `{ flow: true, frame: "device" }` |
| `placement` | `{ flow: true, frame: "device" }` |
| `promise` | `{ flow: true, frame: "device" }` |

`frame: "device"` because a toast draws in a portal, outside the demo's measured stage.
