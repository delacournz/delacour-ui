# Pressable

The interaction primitive every pressable component in this library builds on —
a Gesture Handler tap drives the press feedback and the haptic on the UI thread,
and only `onPress` and `onLongPress` cross back to JS.

`import { Pressable } from "@delacour/react-native-ui/pressable";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/pressable` |
| `pressable.tsx` | The gesture-hook primitive |
| `pressable.variants.ts` | Shared feedback vocabulary and screen-reader activation routing, no RN imports |
| `pressable.variants.test.ts` | Feedback, rest opacity, accessibility state, activation and action-dispatch matrices, minimum hit target and slop |
| `pressable.render.test.tsx` | Mounted under Jest — role and name, disabled and busy state, iOS tap and Android `activate` / `longpress` routing, caller-owned actions, `asChild` and its errors |

## Design

- **The tap carries `testID: ${testID}-press`** when the pressable has a `testID`, so a render test
  can fire a real touch through Gesture Handler's `fireGestureHandler` — the only way to press an
  `accessible={false}` pressable, which has no activation to fire. Gesture Handler drops the id
  in production. No visual effect.
- **`pressable.variants.ts` holds no `tv()`, on purpose.** Its values are
  opacity and scale *interpolation targets* read by a worklet on the UI thread
  (`1 - pressed.value * (1 - targetOpacity)`), not styles. A worklet cannot
  compile a className, so `tv` is the wrong tool here — a deliberate exception
  to pattern C, not an oversight.
- **`feedback` is the shared vocabulary**: `scale`, `fade`, `scale-fade`,
  `none`, defined once in `pressable.variants.ts`. Every pressable in the
  library resolves through it rather than keeping a private map. A control
  changes its **default** and nothing else — [`Button`](../button/AGENTS.md) to
  `scale`, [`ListGroup.Item`](../list-group/AGENTS.md) to `fade`. Neither
  narrows the union: a second definition of a prop the control does not change
  is a definition that can drift, which is why the button's own
  `ButtonFeedback` was removed.
- **`scale-fade` is composed, not spelled out.** Its scale comes from `scale`
  and its opacity from `fade`, so tuning either single-axis mode carries
  through and the name keeps describing what the mode does. A test asserts it.
- **`pressedScale` / `pressedOpacity` win on the axis they name**, and leave the
  other to `feedback`. They are the escape hatch for a value the named modes do
  not cover, not an alternative API — `??` is the merge, so an explicit `0` is a
  value rather than an absence.
- **The no-feedback fallback is unnamed on purpose.** A bare `Pressable` presses
  to `{ opacity: 0.9, scale: 0.97 }`, which fades less than `fade` does. Naming
  it would either change what a bare pressable has always done or force
  `scale-fade` to fade less than `fade`.
- **`disabled` vs `busy`.** Both block the gesture; only `disabled` announces
  the control as disabled. Use `busy` for a temporary state the component clears
  itself, so assistive tech reports a control that is momentarily unavailable
  rather than one that is inert. A caller who needs the announcement without
  the block passes `accessibilityState={{ busy: true }}` instead:
  `resolvePressableAccessibilityState` lets a caller's state add `true` to
  either key but never override a gating prop with `false`. Before it, the
  prop's default `false` overwrote a caller's `busy` silently —
  [`Marker`](../marker/AGENTS.md), a running step that must stay tappable,
  is the case that found it. Neither applies any opacity — that is the
  caller's variant's job, and the point below is what lets it do that job.
- **A screen reader's activation is wired to `onPress`, not left to the
  gesture.** A Gesture Handler tap only ever sees touches. VoiceOver's
  double-tap calls `accessibilityActivate`, which React Native answers only
  when `onAccessibilityTap` is set; without it UIKit synthesises a touch at the
  element's centre and the gesture happens to catch it. TalkBack's double-tap
  performs `ACTION_CLICK`, which React Native routes only to a listed
  `activate` action and otherwise drops into `View.performClick`, with no
  listener behind it. `resolvePressableActivation` decides per platform:
  `onAccessibilityTap` on iOS (an `activate` entry there would become a literal
  "activate" in every button's rotor, since Fabric lists every entry as a custom
  action), an appended `activate` action on Android. Both go through
  `isPressableInteractive`, the same guard the gesture uses, so a disabled or
  busy control consumes the activation and does nothing. Returning `YES` from
  `accessibilityActivate` also stops UIKit synthesising the touch, so one
  double-tap is one `onPress`. A caller that lists `activate` itself — the
  `NumberInput` stepper, `Message`, `FlipCard`, `SectionRail.Trigger`,
  `ProgressButton` — owns it on both platforms and the pressable wires nothing;
  a caller's own `onAccessibilityTap` wins the same way. A caller's other
  actions and its `onAccessibilityAction` are merged in, never replaced.
- **`accessible={false}` makes it layout that takes a touch, not a control.**
  It drops the `button` role, the `accessibilityState`, the appended
  `activate` / `longpress` and the iOS `onAccessibilityTap`, and defaults
  `importantForAccessibility` to `"no"` (a caller's value, such as a scrim's
  `"no-hide-descendants"`, still wins). Before, `accessible={false}` changed
  only the iOS merge: Android still saw a clickable `button` node, and TalkBack
  stopped on it, unnamed, in front of whatever it wrapped — a
  [`Field`](../field/AGENTS.md)'s row, an [`Input.Group`](../input/AGENTS.md)'s box.
  A caller's own `accessibilityActions` are left alone; they are the caller's
  to remove.
- **TalkBack's long press is wired to `onLongPress` the same way.**
  Double-tap-and-hold performs `ACTION_LONG_CLICK`, which React Native routes
  only to a listed `longpress` action and otherwise drops into an empty
  `View.performLongClick` — so on Android the pressable appends `longpress`
  whenever there is an `onLongPress`. iOS gets no entry: VoiceOver's
  double-tap-and-hold passes a held touch through, which the long-press gesture
  already recognises, and a `longpress` entry would only become a rotor custom
  action. A caller that lists `longpress` itself — `SelectionMode.Item`,
  `Attachment` — owns it, as with `activate`. The dispatch is two pure functions
  in `pressable.variants.ts`: `dispatchPressableAccessibilityAction` maps an
  action name to its handler, and `invokePressableHandler` is the
  `isPressableInteractive` gate every screen-reader path calls exactly once.
  A gated control consumes both actions and fires neither.
  `Button`, `ListGroup.Item`, `Screen.Navbar.BackButton`, `Dialog.Close`,
  `BottomSheet.Close` and every other `Pressable` consumer inherit it.
  Verified on an iOS simulator with `AXPress` through Simulator.app's
  accessibility bridge, which calls `accessibilityActivate` — `warden ui press`
  does not, it synthesises a touch, so it cannot tell the two paths apart.
- **`hitSlop` goes to the view and to the gestures, because each platform
  reads a different one.** On iOS the view's `hitSlop` is what gets a touch
  outside the bounds delivered at all; a gesture's slop alone never sees it. On
  Android Gesture Handler's orchestrator does its own hit test and reads only
  the gesture's slop, so a slop on the view alone did nothing there. `Pressable`
  normalises its `hitSlop` to four numbers (`normalizeHitSlop`) and hands it to
  the tap and the long press as well as the view, as primitives so the
  gesture's memo holds. Both were checked on a simulator and an emulator with
  a tap a few points outside a `sm` Pagination item.
- **On Android, slop does not reach past a pressable that clips.** The
  orchestrator only descends into a child that clips (`overflow-hidden`) when
  the touch is inside its bounds, so a pressable whose own root is
  `overflow-hidden` — `Button`, `Chip`, `Badge`, a Pagination item — keeps its
  drawn size there whatever its slop. A bare glyph (a ✕, a back chevron, a
  clear button) does not clip, and its slop works on both platforms. An
  ancestor that clips bounds the slop on both.
- **A small control reaches the minimum target with `hitSlop`, sized from what
  it draws.** `resolveMinimumHitSlop(size, min)` gives half the shortfall to each
  side of a short axis — a number for a square, insets for anything else,
  `undefined` at or above `min`. `min` is 44 (`MIN_HIT_TARGET`, the HIG), or 48
  on Android when the app opts into Material (`resolveMinimumHitTarget`,
  `DelacourProvider isMaterialHitTarget`); components read it through
  `useMinimumHitSlop` in `hooks/use-minimum-hit-target.tsx`. Its `cap` bounds
  each side for targets packed tighter than the slop: React Native hit-tests
  the later sibling first, so overlapping slop gives the press to whichever
  sits later in the tree. Cap at half the gap; the target then falls short of
  44, which is the honest trade for a layout that dense. No pixel moves.
- **Size the slop from the resolved theme, never from a default token.** A
  control whose drawn size is a token (`--spacing-button-*`, `--spacing-input-*`,
  `--spacing-icon-*`) reads it with `useThemeLength(name, fallback)`, which
  resolves the live value through Uniwind's `useCSSVariable` and
  `resolveThemeLength` (a number, `px`, `rem` or a bare number; anything else
  falls back to the default). A constant restating the default shrinks out
  from under its slop the moment an app applies a denser style: a `sm` button
  at 32 with 4pt of slop computed for 36 reaches only 40. The fallback is the
  default token, so an app that never retunes gets exactly what it had.
- **A className's opacity is multiplied into the press, never overwritten.**
  The press feedback is an animated style, and an animated style owns every key
  it writes on the view — so its resting `opacity: 1` silently replaced a
  variant's `opacity-50`, and a disabled `Button`, `Badge`, `Checkbox`,
  `ListGroup.Item` or `Input.Group` never faded while blocking taps correctly.
  The root now resolves its own `className` with Uniwind's
  `useResolveClassNames` and animates `rest * press` instead, with
  `resolveRestOpacity` guarding the value. A press still fades relative to the
  rest — a disabled control cannot be pressed, so the two never compound. No
  unit test could have seen the bug; it was found on a simulator.
- **The tap and the long press are both mounted, always.** Gesture Handler 3's
  gestures are hooks, and a hook cannot be skipped on the render where
  `onLongPress` is absent, so a pressable with no long press still holds one —
  `enabled: false` — composed with the tap through `useSimultaneousGestures`. A
  disabled gesture never begins, so it costs the tap nothing.
- **`onPress` fires from the tap's `onDeactivate`, guarded by `!event.canceled`.**
  `onDeactivate` runs on every path out of an *active* tap, including the one
  where the finger slid off or another gesture won, and neither of those is a
  press. The long press fires from `onActivate`, the moment its duration elapses,
  which is when a native long press reports too.
- **A worklet crosses back to JS with `scheduleOnRN`**, imported from
  `react-native-worklets` — never Reanimated's `runOnJS`, which since Reanimated 4
  is a deprecated shim that forwards to exactly that call. `scheduleOnRN(fn, ...args)`
  takes the arguments itself, so there is no second call: `runOnJS(onPress)()`
  becomes `scheduleOnRN(onPress)`. The same rename covers `runOnUI` →
  `scheduleOnUI`, which `use-keyboard-state-sync` already uses. A Biome
  `noRestrictedImports` rule in `@delacour/biome-config` fails the build on the
  deprecated names, so this cannot regress quietly.
- **A worklet's body must be self-contained.** The press feedback runs on the UI
  thread and cannot rely on a module-scope helper: factoring its
  `Math.min(1, Math.max(0, …))` clamp into a `clampUnit` helper — itself marked
  `"worklet"` — crashes the UI thread with `undefined is not a function`, because
  the helper is not captured into the worklet's closure. No unit test sees it,
  since on the JS thread the helper resolves perfectly.
  [`Screen`](../screen/AGENTS.md)'s border ramps write the same clamp out twice
  for this reason.
- **`asChild` reads its child with `Children.toArray`, not `Children.only`.**
  `Children.only` throws React's own "expected to receive a single React element child"
  for a text child, so the `isValidElement` check below it, with its documented
  message, was unreachable. The count is already checked to be 1, so the first
  entry is the child; a text child or fragment now reaches the documented error. A
  render test pins it.
