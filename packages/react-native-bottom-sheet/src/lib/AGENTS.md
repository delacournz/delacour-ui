# lib

Four utilities copied from `@delacour/react-native-ui`, with the one thing
this package must not have removed.

## Files

| Path | What |
| --- | --- |
| `slot.tsx` | `Slot` — renders its props into its single child; what backs every `asChild` |
| `merge-props.ts` | Child props win; event handlers chain slot-first; `style` arrays flatten with the child last |
| `compose-refs.ts` | Fans one node out to several refs, honouring React 19 cleanup returns |
| `use-controllable-state.ts` | Controlled or uncontrolled from one hook; the mode is locked in on first render |

## What changed in the copy

`merge-props.ts` in the skin also merges class strings through its `cn`. This
package has no class strings to merge — `src/no-classname.test.ts` — so the
branch is gone and nothing here imports `cn`. Everything else is the same
file, and should stay the same file: a fix in one belongs in both.

## Why copied rather than imported

`@delacour/react-native-ui` is the skin over this engine, and it depends on
the engine as an optional peer. The engine importing the skin's `lib` would
close that cycle, and a published package cannot reach into a sibling
workspace's `src` anyway. Four small files is the price of a clean direction.

## Slot and animated styles

Do not pass a Reanimated style through `Slot`. React Native deep freezes style
props on a non-animated component in development, and Reanimated's effect then
throws trying to write to the frozen object. No part here does; a part that
needs to would render the child through an animated counterpart of its own
type, the way the skin's `Pressable` does.
