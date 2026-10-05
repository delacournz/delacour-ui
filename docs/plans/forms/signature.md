# Signature

- **Status**: built on `feature/forms-signature`. Verified on an iOS simulator; previews captured from the dev client (2 stills, 3 clips)
- **Wave**: 1 (independent)
- **Depends on**: `Field`, `Pressable`, `Button`, `Text`, `Icon`, `Surface` conventions; `react-native-svg`, Gesture Handler, Reanimated, Pulsar. No new peers.

## Purpose on mobile
Capture a handwritten signature with a finger or stylus (consent forms, delivery proof, contracts) and hand back SVG path data or a full SVG string. Sits inside a `Field` like any control.

## Behaviour reference (summary)
- Finger-drawn strokes on a pad with an optional baseline guide and caption ("Sign here"); placeholder text shown while empty, hidden on first touch.
- Quadratic-curve smoothing so strokes look inked, not polylines; points closer than `minDistance` are dropped.
- Undo (last stroke), redo (restore undone stroke), clear (all). New stroke after an undo discards the redo stack.
- Imperative handle: `undo()`, `redo()`, `clear()`, `isEmpty`, `strokeCount`, `toSVG()` (pure string), `toPaths()`.
- Events: begin, end, change (stroke count).
- Sizes `sm|md|lg|full`; configurable stroke colour and width (default 2.5pt).
- Drawing is on the UI thread; finished strokes become static paths.
- Optional escape hatch `onRequestAlternative` ("Can't sign? type your name") for inclusive flows.
- Screen readers: announces empty/non-empty, exposes undo/redo/clear as actions. A drawn signature is inherently path-dependent: an a11y label alone does not make it accessible, so an alternative route must be offered.

## API

```ts
export type SignaturePoint = { x: number; y: number; t?: number };   // t = ms since stroke start, for optional width easing
export type SignatureStroke = readonly SignaturePoint[];
export type SignatureSize = "sm" | "md" | "lg" | "full";
export type SignatureVariant = "primary" | "secondary";

/** Serialisable model: portable, can be persisted and re-hydrated. */
export type SignatureValue = {
  width: number; height: number;           // pad size the strokes were drawn in
  strokes: readonly SignatureStroke[];
};

export type SignatureHandle = {
  undo: () => void; redo: () => void; clear: () => void;
  readonly isEmpty: boolean; readonly strokeCount: number;
  toSVG: (options?: SignatureExportOptions) => string;
  toPaths: () => readonly string[];
};

export type SignatureExportOptions =
  | { background?: "transparent" }                       // default
  | { background: string };                              // literal colour
  // plus: strokeColor?: string (literal; default #000000 since an export has no theme), strokeWidth?: number, padding?: number, viewBox?: "tight" | "pad"

export type SignatureProps = {
  value?: SignatureValue | null;
  defaultValue?: SignatureValue | null;
  onValueChange?: (value: SignatureValue | null) => void;   // fires at stroke end, undo, redo, clear; null when empty
  onBegin?: () => void; onEnd?: (value: SignatureValue) => void;
  size?: SignatureSize;
  variant?: SignatureVariant;           // primary: filled pad (bg-muted); secondary: outlined
  strokeColor?: string;                  // token name or literal; resolved via useThemeColor/isLiteralColor. Default token "foreground"
  strokeWidth?: number;                  // default 2.5
  minDistance?: number;                  // default 1.5
  hasGuideline?: boolean;                // default true
  guidelineLabel?: string;               // e.g. "Sign above the line"
  placeholder?: string;                  // default "Sign here"
  isDisabled?: boolean; isInvalid?: boolean; isReadOnly?: boolean;
  haptic?: false | HapticFeedback;
  onRequestAlternative?: () => void;     // renders Signature.Alternative link when provided
  ref?: Ref<SignatureHandle>;
  className?: string; padClassName?: string;
  children?: ReactNode;
};
export function useSignature(): SignatureState;  // value, isEmpty, strokeCount, canUndo, canRedo, undo, redo, clear, isDisabled…
```

Parts (Pattern B): `Signature.Pad` (the drawing surface; default child), `Signature.Toolbar`, `Signature.Undo`, `Signature.Redo`, `Signature.Clear`, `Signature.Alternative`. A bare `<Signature />` renders Pad + Toolbar(Undo, Clear).

```tsx
<Field isInvalid={!!error}>
  <Field.Label>Signature</Field.Label>
  <Signature ref={ref} size="md" onValueChange={setSig} onRequestAlternative={openTypeName}>
    <Signature.Pad />
    <Signature.Toolbar>
      <Signature.Undo /><Signature.Redo /><Signature.Clear />
    </Signature.Toolbar>
  </Signature>
  <Field.Error>Please sign</Field.Error>
</Field>
```
Undo/Redo/Clear default to icon-only `Button` (`variant` ghost/secondary) with Central icons; children override labels. Disabled automatically when nothing to do.

## Variants & sizes
- `size`: pad height `sm` 120, `md` 180, `lg` 240 pt (new `--spacing-*`? NO: use fixed `h-30/h-45/h-60` utilities; revisit if a token is wanted), `full` fills parent (`flex-1`, min height 180). Width always parent width. Toolbar buttons use Button `sm|md` stepped from the same size.
- `variant`: `primary` pad on `bg-muted` + border-input; `secondary` transparent + dashed-free 1px `border-border`. Corner `rounded-lg` (card step, per root AGENTS).
- Guideline: `border-border` 1px line at 72% of height, label `Text` caption `text-muted-foreground`.

## States
default (placeholder shown); drawing (placeholder fades, guideline stays); has-value; disabled (0.5 opacity, no gesture, toolbar disabled); invalid (destructive border, from Field, own wins); readOnly (shows value, no gesture, toolbar hidden); focused n/a (touch only; pad exposes a11y focus ring on iOS via VoiceOver outline); loading n/a; empty = placeholder + Undo/Redo/Clear disabled.

## Accessibility
- Pad: `accessible`, `accessibilityRole="image"` when it has a value ("Signature, drawn, N strokes") else `"none"`-labelled "Signature pad, empty. Double tap and drag to draw." with `accessibilityHint`. Label from `useFieldContext().label`.
- `accessibilityActions`: `undo`, `redo`, `clear` (only those currently possible), handled in `onAccessibilityAction`.
- Announce "Signature captured" on first stroke end and "Signature cleared" on clear (`AccessibilityInfo.announceForAccessibility`).
- Always document and demo `onRequestAlternative` (typed-name flow). Spec states plainly: a pad is not accessible to some users; offer an alternative.
- Toolbar buttons have labels "Undo", "Redo", "Clear signature".

## Motion & haptics
- Live stroke: `Gesture.Pan().minDistance(0)` (so a dot/tap registers), points pushed to a UI-thread shared value; the in-progress path is an animated `Path` `d` via `useAnimatedProps`, rebuilt by the worklet version of the smoother. On `onEnd`, `scheduleOnRN` commits the stroke to React state (one re-render per stroke, never per move).
- Pad starts in `onBegin` (house rule, mirrors Slider); `onFinalize` closes the stroke on every path including cancel.
- Placeholder opacity fade on first touch (decorative; skipped under `useCalmMotion()`). Clear: strokes fade out 150ms (decorative; instant when calm).
- Haptics (Pulsar): light impact on stroke begin; none while drawing; success-ish selection on clear. `haptic={false}` disables.
- Scroll conflict: pad takes touches immediately (like Slider); a parent `ScrollView` will not scroll from the pad. Document; offer `isScrollLocked` not needed.

## Reuses / new internal pieces / peer deps
- Reuses: `Pressable`/`Button` (toolbar), `Text`, `Icon`, `Field` context (state cascade, label), `Surface` fill ladder step for the pad (or plain View with tokens; decide in impl, prefer plain `View` classes to avoid nesting steps).
- New: `signature.stroke.ts` (pure smoothing + SVG export), `signature-path.tsx` (static paths), `signature-live-path.tsx` (animated).
- Peer deps: none new (`react-native-svg` already a peer). No Skia. Raster export (`toDataURL`/PNG) is explicitly out of scope: needs `react-native-view-shot` or Skia; list as open question.

## Files
```
components/signature/
  AGENTS.md  index.ts
  signature.tsx                  root, owns history reducer + handle (useImperativeHandle) + Object.assign
  signature.context.tsx          SignatureContext, useSignature(), useSignaturePart()
  signature.types.ts             SignaturePoint, SignatureStroke, SignatureValue, SignatureHandle, export option types
  signature.stroke.ts            PURE leaf (no RN): smoothing, history reducer, bounds, svg export
  signature.stroke.test.ts
  signature.variants.ts          slotted tv(): root, pad, placeholder, guideline, guidelineLabel, toolbar + size tables + resolvers
  signature.variants.test.ts
  signature-pad.tsx  signature-toolbar.tsx  signature-undo.tsx  signature-redo.tsx
  signature-clear.tsx  signature-alternative.tsx
  signature-path.tsx  signature-live-path.tsx          (internal)
```
Plus brief's repo-wide checklist (AGENTS table row, gen-exports, demos+route+index row+gen-demos, docs mdx+meta.json, registry ITEM_META/PACKAGE_INSTALL + registry:build, changeset minor on ui + delacour).

## Pure logic to unit-test (`signature.stroke.test.ts`)
- `shouldAddPoint(last, next, minDistance)`: below threshold false, equal true at exactly threshold, first point always true.
- `smoothStroke(points) -> string`: 0 points -> `""`; 1 point -> dot path (zero-length segment with round cap: `M x y L x y`); 2 points -> straight line; 3+ -> `M p0 Q p0.5 mid ...` midpoint quadratic chain ending at last point; numbers rounded to 2dp; no NaN for duplicate points.
- `strokeToPath` determinism (same input same string) and worklet-safe (no closures over imports besides pure fns).
- `historyReducer(state, action)`: `begin/append/end` builds strokes; `undo` moves last stroke to redo; `redo` restores; new `end` after undo clears redo; `clear` empties both (clear is itself undoable? DECISION: no, clear is final, matches simple expectations); `undo` on empty is a no-op returning same reference.
- `isEmpty` / `strokeCount` selectors.
- `boundsOf(strokes, strokeWidth)`: tight box inflated by half stroke width; empty -> null.
- `toSVG(value, options)`: `<svg xmlns viewBox width height>` with one `<path fill="none" stroke stroke-width stroke-linecap="round" stroke-linejoin="round" d>` per stroke; background rect only when a colour is passed; `viewBox: "tight"` crops to bounds + padding; empty value returns an empty-but-valid svg; attribute values escaped (`"` and `&` in colour strings); literal colour required (token names rejected -> falls back to `#000000`).
- `scaleValue(value, w, h)`: re-fits strokes when the pad is rendered at a different size (rotation, `full` size), preserving aspect, centred.
- `serialize/parse` round trip of `SignatureValue` (JSON), rejecting malformed input -> null.
- `signature.variants.test.ts`: slot tokens exist in both themes, size ladder ascends, state ladder (prop > Field > default), guideline y fraction constant, no raw palette/`dark:`.

## Playground demos (`apps/playground/src/demos/signature/`)
`basic` **hero**+capture (pre-drawn `defaultValue` so the capture shows ink); `with-toolbar` capture; `in-field` capture (invalid + Field.Error); `export` (button shows `toSVG()` length / renders it back via `react-native-svg` SvgXml-equivalent path list); `alternative` capture (typed-name fallback); `sizes`; `disabled-readonly`.

## Docs page outline
Intro/hero; Installation; Usage (inline, Field, handle ref); Value model & persistence (`SignatureValue` JSON); Exporting SVG; Alternative input (accessibility section up top, not buried); Sizes/variants; API tables; scroll-view note.

## Out of scope / follow-ups
PNG/JPEG export and saving to disk (needs a view-shot or Skia dependency: open question, argue against catalog rules), pressure/velocity-variable stroke width (the `t` field is stored so it can follow), pen vs finger palm rejection, multi-colour ink, background image/line templates, signature verification.

## Acceptance checklist
- [ ] `signature.stroke.ts` has no RN imports; tests above pass
- [ ] Dot (tap without move) leaves a visible mark
- [ ] One React render per stroke, none per move (DevTools check)
- [ ] Undo/redo/clear correct, redo dropped by new stroke, buttons disabled appropriately
- [ ] `toSVG()` output opens correctly in a browser and re-renders identical to the pad
- [ ] Controlled `value` round trip; re-fit on resize/rotation
- [ ] Field: label, invalid, disabled cascade; `registerPress` focuses nothing harmful (document no-op)
- [ ] VoiceOver actions undo/redo/clear + announcements; alternative demo present
- [ ] Parent ScrollView does not steal the drag
- [ ] displayName on all parts, AGENTS.md + row, exports, demos, docs, registry, changeset
- [ ] No JSX comments, no `any`, semantic tokens only
