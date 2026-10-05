# SearchBar

The query field at the top of a list or screen — a search glyph, a clear button, an
optional Cancel action and debounced change reporting, over `Input.Group`. Root plus
`SearchBar.Cancel`.

`import { SearchBar } from "@delacour/react-native-ui/search-bar";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/search-bar` |
| `search-bar.tsx` | Root + the `Object.assign` surface; the debounce, focus, clear and cancel wiring |
| `search-bar-cancel.tsx` | `SearchBar.Cancel`, the default ghost `Button` |
| `search-bar-cancel-reveal.tsx` | Internal: measures Cancel and animates its width in and out |
| `search-bar-clear.tsx` | Internal: the clear button in the box's trailing slot |
| `search-bar-tokens.tsx` | Internal: the horizontal row of token chips |
| `search-bar.context.tsx` | `SearchBarProvider`, `useSearchBar()`, `useSearchBarContext()`, `useSearchBarPart()` |
| `search-bar.responder.ts` | `claimSearchBarTouch` — why clear and the chips keep the keyboard |
| `search-bar.types.ts` | `SearchBarToken`, `SearchBarHandle` |
| `search-bar.variants.ts` | Pure `tv()` slots, size maps and the resolvers — no RN imports |
| `search-bar.variants.test.ts` | |
| `search-bar.debounce.ts` | `createDebouncer`, a debounce state machine with the clock injected |
| `search-bar.debounce.test.ts` | |

## Design

- **The box is `Input.Group`'s, and nothing here redraws it.** Border, fill, height,
  padding and focus ring all come from `inputVariants`' `root` slot; the `field` slot adds
  only the shape's corner. A second border or height would be a second definition of one
  box — exactly the drift [`Input`](../input/AGENTS.md) forbids — so a test asserts the
  slot carries no `border`, `bg-*`, `h-*` or padding.
- **Sizes and variants are `Input`'s tuples, not copies.** `SEARCH_BAR_SIZES` *is*
  `INPUT_SIZES`, so a search bar beside a plain field is the same height and a size added to
  `Input` arrives here with no edit. The default variant is `secondary`, the filled box
  with no heavy border, because a search bar is chrome at the top of a list rather than a
  form field waiting for an answer.
- **`pill` is a capsule; `rounded` adds nothing.** `resolveSearchBarCorner` returns
  `rounded-full` or an empty string, so `rounded` keeps the exact ramp a lone field draws —
  `rounded-md` at `sm`, `rounded-lg` above — rather than a restated copy of it.
- **The debouncer is a pure state machine with its clock injected.** `createDebouncer`
  takes `schedule` and `cancelSchedule`, so every rule — last value once, reset on change,
  `flush`, `cancel`, synchronous at `0`, `fireNow` — is tested exactly with a fake clock and
  no real timer. The component keeps one per `debounce` value and reads the latest
  `onDebouncedChange` through a ref: it is a dispatcher, not a query, so the stale-function
  hazard React Compiler creates for a memoised query does not apply.
- **Three paths skip the wait.** The search key flushes whatever is pending; clear and
  Cancel fire `""` at once. A results list that lagged 300 ms behind an emptied field would
  show a query nobody is searching for any more.
- **Clear keeps focus; Cancel ends the search.** Clearing is the start of the next query,
  so focus and the keyboard stay — and the field is refocused explicitly, because a bar in a
  scroll view whose taps dismiss the keyboard would otherwise lose it. Cancel empties the
  text, blurs the field and calls `Keyboard.dismiss()`; an already-empty field only drops a
  pending debounce, since it has nothing to report.
- **The trailing slot holds one thing, and `resolveSearchBarSuffix` decides which.** A
  spinner outranks clear while `isLoading` — a second control beside an unanswered query is
  a second thing to tap. Clear needs text and an editable field. Focus is not consulted: a
  filled bar whose keyboard was dismissed can still be cleared in one tap.
- **Cancel's `focus` mode follows focus alone, not the text.** A bar that keeps its query
  after the keyboard goes is a filter in place; a Cancel left beside it would offer to throw
  the filter away. `always` and `never` mean what they say, and a disabled bar shows none.
- **Cancel's width is measured once, out of the row.** Inside a zero-width clip a label
  wraps to nothing and reports the wrong size, so the first frame draws Cancel absolutely
  positioned and invisible, reads its natural width, then animates `0 → width` in a clip.
  The gap to the field is padding *inside* that width, so it collapses with Cancel rather
  than leaving eight points beside a hidden button. The reveal is keyed on `cancelLabel`,
  so a new label is measured afresh.
- **Calm motion snaps the width and keeps the fade.** Under reduce motion or an E2E
  build's `isMotionCalm`, the field does not slide narrower; Cancel fades in place. A
  hidden Cancel is out of the accessibility tree (`accessibilityElementsHidden`,
  `no-hide-descendants`) and takes no touches.
- **Only Cancel plays a haptic.** `selection` on Cancel, because it ends something; none on
  clear, which is pressed often, and none on typing.
- **Tokens are data, not a part.** `tokens` is a list the caller already holds — the active
  filters — so passing it is shorter than composing a chip per entry, and it leaves one
  composition model rather than two. Each is a static `Chip` with a remove control, which
  stays its own accessible element labelled `Remove {label}`.
- **Clear clears text, never tokens.** Tokens go one at a time, through their own remove
  control or Backspace on an empty field (`resolveTokenBackspace`) — the recipient-field
  move. Wiping every filter on a clear would punish the most common tap in the bar.
- **The token row is capped at 60% of the box and scrolls.** A long filter list would
  otherwise squeeze the text to nothing.
- **Clear and the token row claim the touch, or the keyboard drops.** `Pressable` is a
  Gesture Handler tap, which React Native's responder system never sees, so a `ScrollView`
  with `keyboardShouldPersistTaps="handled"` — every `Screen.ScrollArea`, and the token row
  itself — finds the tap unclaimed, becomes the responder and blurs the field on release.
  On a simulator that blurred the field on every clear and every chip removal, *after*
  `clear` had refocused it. The view around clear and around the chips answers
  `onStartShouldSetResponder` with `claimSearchBarTouch` (`search-bar.responder.ts`); the
  tap still reaches the gesture, which runs natively. Cancel does not claim it — blurring
  is its job.
- **The field announces itself as a search.** `accessibilityRole="search"`, named by the
  enclosing `Field.Label` when there is one and by the placeholder when not;
  `accessibilityState.busy` while loading. `returnKeyType` and `enterKeyHint` default to
  search, capitalisation and autocorrect off — all set before the caller's
  props, so each can be overridden. **`inputMode` is deliberately not `search`:** on iOS it
  selects the web-search keyboard, whose return key reads "go" whatever `returnKeyType`
  says — seen on a simulator, and fixed by leaving the keyboard type alone.
- **`testID` names the field, and the bar's own controls suffix it.** `{testID}-clear`,
  `{testID}-cancel`, `{testID}-token-{id}` and `{testID}-token-{id}-remove`, so a flow can
  reach every control from the one id a caller sets.
- **`inputRef` reaches the `TextInput`; `ref` is the handle.** `ref` gives `focus`, `blur`
  and `clear` — the three things a screen asks of a search bar. `inputRef` is for the node
  itself, which is what a sheet needs: spread `useBottomSheetInput()`'s `ref` there and its
  `onFocus`/`onBlur` onto the bar, and the sheet lifts for the keyboard.
- **There is no results panel.** An anchored suggestions surface needs a popover, and the
  library has none yet. The caller renders results in their own list, swapped in on
  `onFocusChange`.
