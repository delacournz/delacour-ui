# steps

`BottomSheet.Steps` and `BottomSheet.Step` — a body whose contents change
with a machine, and whose height glides between them — plus the hooks that
run the machine and read it.

## Files

| Path | What |
| --- | --- |
| `steps.types.ts` | `SheetStepController` (a snapshot plus `send`, `can`, `matches`, `reset`, `direction`), `UseSheetMachineOptions`, the two parts' props |
| `use-sheet-machine.ts` | `useSheetMachine(machine, { onTransition?, onRejected? })` — the machine as React state |
| `steps.context.tsx` | `SheetStepContext` (the controller, untyped at the boundary) and `StepsLayoutContext` (what `Steps` tells each `Step`) |
| `use-sheet-step.ts` | `useSheetStep<S, C, E>()` / `useOptionalSheetStep()` — the controller with its generics asserted back on |
| `bottom-sheet-steps.tsx` | The body: `Content` with an animated-height stack inside, the `contentHeight` write, the per-step override, the reset on close |
| `bottom-sheet-step.tsx` | One step: absolutely positioned, measured while current, framed by `stepFrame` |

The machine itself — `defineSheetMachine`, `transition`, `stepFrame`,
`stepOverride` — is pure and lives in `core/machine`.

## The model

```tsx
const machine = defineSheetMachine<Step, Context, Event>({ initial: "details", context, states: { … } });

function Form() {
  const controller = useSheetMachine(machine);
  return (
    <BottomSheet>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Container>
          <BottomSheet.Handle />
          <BottomSheet.Steps controller transition="crossfade">
            <BottomSheet.Step name="details">…</BottomSheet.Step>
            <BottomSheet.Step name="confirm">…</BottomSheet.Step>
          </BottomSheet.Steps>
          <BottomSheet.Footer><Actions /></BottomSheet.Footer>
        </BottomSheet.Container>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

function Actions() {
  const { send, can, matches } = useSheetStep<Step, Context, Event>();
  …
}
```

- **`useSheetMachine` is `useState` over `machine.transition`, not
  `useReducer`.** A reducer has to be pure and React may run it twice;
  `onRejected` is a side effect a form wants exactly once. The latest snapshot
  is also kept in a ref so two `send`s in one tick chain. `direction` is
  `machine.directionOf(from, to)` of the last change of step, and a `reset`
  reads as `back`.
- **`Steps` is `Content` with a stack inside.** It renders `Content` itself,
  so the content pan, the `contentArea` clamp, the detached clamp and the
  footer spacer are all the same code; the stack is an `Animated.View` whose
  height is a shared value. Only the current step and, during a change, the
  one leaving are rendered; each is absolutely positioned across the top of
  the stack, measured by its `onLayout` while current.
- **The height glides because the detent moves once.** When the current step
  measures, `Steps` writes the number to the sheet's `contentHeight` straight
  away and springs the stack's height to it. The dynamic detent re-derives on
  the UI thread, the root's detent-change reaction (`state/use-sheet-intents.ts`)
  animates `base` to the same index in the new list with the sheet's own
  animation, and — because the stack's spring is resolved from the same
  config — the panel's top edge and the body's bottom edge move together. A
  sheet resting on an explicit detent does not move at all. If the sheet was
  busy when the detent moved (a step change mid-open), the stack animation's
  completion nudges `base` onto its detent.
- **`Content` stops measuring.** The internal context's
  `contentHeightSource` reads `steps` while a `Steps` body is mounted, and
  `Content`'s `onLayout` returns early; its layout events would otherwise be
  the stack mid-animation, a frame stale. The unmount reset to `UNMEASURED`
  still runs, so the next open waits for the first step to measure again.
- **A step's `snapPoints` replace the root's, and turn dynamic sizing off,
  while it is current.** A step that names its detents is sized by them.
  `dismissible: false` switches off pan-down-to-close and the overlay's press
  for that step — `Close` and the ref still work. Both go through
  `setStepOverride` on the root (`components/bottom-sheet.tsx`), because the
  overlay is not a descendant of the body.
- **Transitions are `stepFrame` over one `progress`.** `crossfade` fades
  the two across each other, `slide` moves them a container-width apart along
  `direction`, `none` swaps them. `progress` runs `0 → 1` on the incoming
  step's first layout, with the same animation as the height, and the outgoing
  step is dropped when it completes.
- **`resetOnClose` resets from two places.** The `isOpen` flip, for a body
  that stays mounted (inline, `keepMounted`), and the unmount cleanup, for one
  the portal takes down — a close settles, the root sets `isOpen` false and
  `presented` false in one render, and only the cleanup runs.
- **`useSheetStep` reaches a `Footer`.** The footer is written beside the
  body, not inside it, so `Steps` also registers its controller with the root
  through `setStepController`; the hook reads the context first and the
  registration second. Anywhere inside the `BottomSheet` works once the body
  has mounted.
- **Vertical padding goes on the `Step`, not on `Steps`.** `Steps`'s `style`
  lands on `Content`'s inner view around the stack, and the sheet's height is
  what the step measures — padding around the stack is not counted.
