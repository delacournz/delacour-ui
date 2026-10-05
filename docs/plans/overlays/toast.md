# OVL-P1-TOAST — Toast

`import { Toast, ToastViewport, toast, useToast } from "@delacour/react-native-ui/toast";`

## Purpose on mobile

A brief, non-blocking message about something that just happened — "Link copied", "Saved",
"Upload failed — Retry" — callable from anywhere, including outside React (an API client, a
mutation's `onError`). It needs no response and leaves on its own; anything that must be read or
acted on is an `Alert` or a `Dialog`.

## Builds on

- `@delacour/react-native-ui/overlay` (OVL-P0): `Overlay.Portal layer="toast"` (above dialogs),
  `useOptionalOverlay`. Read its `AGENTS.md` first. No scrim, no back handling.
- `alert/alert.variants.ts` — **a leaf, imported across folders (rule 3)**: `ALERT_STATUSES`,
  `ALERT_FOREGROUND_TOKEN`. Toast statuses are Alert's statuses so the two read as one family;
  read `alert.tsx`/`alert-indicator.tsx` for the glyph per status and reuse the same glyphs.
- Gesture Handler pan + Reanimated (swipe, stack), `react-native-safe-area-context`,
  `react-native-keyboard-controller` (bottom toasts ride above the keyboard), `AppState`,
  `AccessibilityInfo`, `Pressable`, `Text`, `Icon`, `playHaptic`.

No new peer dependency.

## API

```ts
type ToastStatus = AlertStatus; // "default" | "info" | "success" | "warning" | "destructive"
type ToastPlacement = "top" | "bottom";

type ToastOptions = {
	id?: string;                 // pass to update an existing toast in place
	status?: ToastStatus;        // "default"
	title: string;
	description?: string;
	action?: { label: string; onPress: (handle: ToastHandle) => void }; // pressing also hides
	duration?: number;           // ms; 0 = until hidden. Default 4000, 6000 with an action
	placement?: ToastPlacement;  // "bottom"
	haptic?: HapticFeedback | false; // default: success→"success", warning→"warning", destructive→"error", else false
	onHide?: () => void;
};
type ToastCustomOptions = Omit<ToastOptions, "title" | "description" | "action" | "status"> & {
	render: (handle: ToastHandle) => ReactNode;
};
type ToastHandle = { id: string; hide: () => void };

type ToastApi = {
	show(input: string | ToastOptions | ToastCustomOptions): ToastHandle;
	success(title: string, options?: Partial<ToastOptions>): ToastHandle; // + info, warning, error
	update(id: string, options: Partial<ToastOptions>): void;
	hide(id: string): void;
	hideAll(): void;
	promise<T>(p: Promise<T>, messages: { loading: string; success: string | ((v: T) => string); error: string | ((e: unknown) => string) }): Promise<T>;
};

export const toast: ToastApi;          // module singleton, usable outside React
function useToast(): { toast: ToastApi; toasts: readonly ToastItem[] };

/** Mount once inside OverlayProvider (beside the navigator). Draws the two stacks. */
<ToastViewport offset?={{ top?: number; bottom?: number }} />

/** The visual toast, also usable inside a custom `render`. */
<Toast status? onHide?>
  <Toast.Indicator /> <Toast.Content><Toast.Title /><Toast.Description /></Toast.Content>
  <Toast.Action /> <Toast.Close />
</Toast>
```

## Store & timers (pure, the heart of the tests)

- `toast.store.ts` — a tiny external store (`subscribe` / `getSnapshot`, read with
  `useSyncExternalStore`). Pure reducer `reduceToasts(state, action)` over
  `add | update | hide | remove | hideAll`; `hide` marks `isExiting` so the viewport can animate it
  out, `remove` drops it after the exit. Ids from a counter.
- `toast.timer.ts` — `createToastTimer` as pure functions over `{ remaining, startedAt }`:
  `start(now)`, `pause(now)`, `resume(now)`, `isExpired(now)`. The viewport pauses every timer
  when `AppState` leaves `active` and while a toast is being dragged or pressed, and resumes with
  the time left. `duration: 0` never expires.
- `resolveToastDuration(options, { isScreenReaderEnabled })` — default 4000 / 6000 with an action;
  under a screen reader at least 10000, because a timed message must be readable (WCAG 2.2.1).
- `resolveToastStack(items, placement)` — at most **3 visible** per placement, newest in front;
  each older one sits 8pt further back toward the entry edge and scales by `1 − 0.05·depth`,
  opacity `1 − 0.25·depth`; the 4th+ are queued, not drawn. Pure, returns `{ id, depth, isVisible }`.
- `resolveToastRelease({ placement, translation, velocity, height })` — swipe toward the entry
  edge (down for bottom, up for top) or horizontally past 40% / fling > 800 pt/s dismisses;
  toward the centre rubber-bands.

## Viewport

Two absolute stacks inside `Overlay.Portal layer="toast"`, `box-none`, so the app under them stays
interactive. Top stack pads the top safe-area inset; bottom stack pads the bottom inset and lifts
with the keyboard. New toasts enter from their edge (translate 16pt + opacity), staggered 220 ms
when several arrive in one tick. Without an `OverlayProvider` the viewport renders inline and
warns once in development.

## Variants (`toast.variants.ts`)

Slots: `viewport`, `stack`, `root` (`bg-popover`, `border border-border`, `rounded-lg`, shadow-free
like every surface here, row, gap, padding, `max-w-[560px]` centred), `indicator`, `content`,
`title` (colour from `ALERT_FOREGROUND_TOKEN[status]`), `description` (muted), `action`
(a compact `Button`-like pressable, `text-primary`), `close`. Tokens in both themes. A test pins
`title` colour to Alert's token per status.

## Accessibility

On show, `AccessibilityInfo.announceForAccessibility(title + ". " + description)`; destructive
and warning use `announceForAccessibilityWithOptions(…, { queue: false })` on iOS. Root
`accessibilityLiveRegion="polite"` (Android), `role="alert"` for destructive. The toast is a
single accessible group with the action and close exposed as `accessibilityActions`
(`activate` → action, `escape`/custom "Dismiss" → hide). Toasts never take focus. Durations stretch
under a screen reader (above).

## Pure logic to unit-test (write first)

`toast.store.test.ts` (add, update by id, hide then remove, hideAll, `promise` transitions loading
→ success/error with the same id), `toast.timer.test.ts` (pause/resume keeps remaining, zero never
expires), `resolveToastDuration`, `resolveToastStack` (≤3 visible, ordering, depth styles),
`resolveToastRelease`, `toast.variants.test.ts` (tokens, title colour = Alert's).

## Files

`index.ts`, `toast.tsx` (visual root + `Object.assign`), `toast.context.tsx`, `toast.store.ts`
(+ test), `toast.timer.ts` (+ test), `toast.variants.ts` (+ test), `toast-api.ts` (`toast`,
`useToast`), `toast-viewport.tsx`, `toast-item.tsx` (gesture + timer + motion per toast),
`toast-indicator.tsx`, `toast-content.tsx`, `toast-title.tsx`, `toast-description.tsx`,
`toast-action.tsx`, `toast-close.tsx`, `AGENTS.md`. Mount `<ToastViewport />` in
`apps/playground/src/app/_layout.tsx` inside `OverlayProvider`.

## Playground demos (`apps/playground/src/demos/toast/`)

`statuses` (hero, capture), `with-action` (undo, capture), `placement` (top/bottom, capture),
`promise` (capture), `stacking` (fire five quickly), `persistent` (`duration: 0`), `custom`
(`render`), `over-dialog` (only once Dialog is merged — otherwise omit). `testID`s.

## Docs

`toast.mdx` (including the `ToastViewport` mount and calling `toast` outside React), `meta.json`
under `---Overlays---`, `ITEM_META.toast` (dependencies `react-native-teleport`; it imports
`alert` so the registry pulls it), `registry:build`.

## Acceptance

- [ ] `toast("Saved")` from a button and from a plain module function both show.
- [ ] Five rapid toasts: three visible, newest in front, the rest appear as earlier ones leave.
- [ ] Auto-hide after its duration; timer pauses while backgrounded and while dragging.
- [ ] Swipe to the entry edge and sideways dismiss; toward centre rubber-bands.
- [ ] Action runs and hides; `toast.promise` morphs loading → success/error in place.
- [ ] Bottom toasts sit above the home indicator and the keyboard; top ones below the status bar.
- [ ] Draws above an open dialog and bottom sheet; the app under the viewport stays tappable.
- [ ] VoiceOver announces each toast; duration ≥10 s with a screen reader on.
- [ ] `bun test`, `bun run typecheck`, `bun run check` green; `gen-exports`, `gen-demos`,
      `registry:build`; package `AGENTS.md` row; folder `AGENTS.md`; changeset.
