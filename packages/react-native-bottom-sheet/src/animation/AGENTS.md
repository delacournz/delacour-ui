# animation

How `base` moves, and how the JS thread hears about it.

## Files

| Path | What |
| --- | --- |
| `animation.types.ts` | `SheetAnimation` (the prop), `AnimateTo` / `JumpTo` / `SettleAt` (the worklets), `SettleListener` / `AnimateListener` (what JS hears) |
| `resolve-animation.ts` | Easing and reduce-motion names to Reanimated's values; `toReanimated` turns the core's resolved config into a `withSpring` / `withTiming` config |
| `use-animate-to.ts` | `animateTo(target, source, velocity)`, `jumpTo(target, source)` and `settleAt(target, source)`, hook-scope worklets |
| `use-settle-callbacks.ts` | The two JS listeners, stable for the sheet's lifetime, reading every prop through a ref |

## The shape

`selectAnimation` in the core picks the config as plain data — the consumer's
over the platform default, iOS a spring and everything else a timing, easing by
name. `resolve-animation.ts` is the one place a name becomes a Reanimated
function, and it runs on the JS thread once per config change.

`animateTo` cancels whatever owns `base`, records the target and the source in
the shared state, schedules `onAnimate` on JS, and hands `base` to the spring
or the timing. The completion callback settles only on `finished === true`:
a cancelled animation is someone else's now, and settling it would report an
index the sheet never reached. Settling writes `currentIndex` and schedules
`onSettle`.

`jumpTo` is `animateTo` without the motion — `forceClose`, a container resize,
`animateOnMount: false`.

`settleAt` is the completion alone: no `onAnimate`, no target recorded, `base`
written to the detent it is already within a settle tolerance of, then the same
`currentIndex` write and `onSettle`. The content pan uses it for a release the
list owns — the finger carried the sheet to the top and kept scrolling, so
nothing animated and nothing else would report the index.

## Reanimated 4

`scheduleOnRN` comes from `react-native-worklets`, not from Reanimated;
`cancelAnimation`, `withSpring`, `withTiming`, `Easing` and `ReduceMotion` from
Reanimated. Reanimated 4 replaced the spring's `restDisplacementThreshold` and
`restSpeedThreshold` with one relative `energyThreshold`, so those two fields
of the core's `IOS_SPRING` are kept as data and not forwarded; with
`overshootClamping` and a stiff spring, the default threshold
settles within a frame or two of them.

## The listeners

`useSettleCallbacks` returns two functions that never change identity. Every
prop they read goes through a ref, because `scheduleOnRN` calls the function
the worklet captured when it was built — a listener that closed over
`onIndexChange` directly would call the callback from the render the gesture
began in.

A settle at `-1` is where a physical close becomes state: `onClose`, then
`setOpen(false)` — the root's `onOpenChange(false)` — then `setPresented(false)`
and the portal's children unmount unless `keepMounted`. Any other settle reports
through `onIndexChange` only when the index moved.
