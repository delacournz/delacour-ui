# ImageViewer

A full-screen image viewer that opens out of a thumbnail: pinch, pan and
double-tap zoom, swipe between a gallery, drag up or down to dismiss. Compound
root plus `ImageViewer.Trigger` and `ImageViewer.Close`, and a `useImageViewer()`
hook for custom controls.

`import { ImageViewer } from "@delacour/react-native-ui/image-viewer";`

## The first rule: the layer is a `Modal`, and a Modal is its own window

`ImageViewerLayer` renders a React Native `Modal` (`transparent`,
`animationType="none"`, `statusBarTranslucent`, every orientation). A Modal is a
separate native window, so **two things the app root provides do not reach
inside it and are re-supplied there**:

- **`GestureHandlerRootView` is rendered inside the Modal.** Gesture Handler does
  not cross the window boundary on Android; without its own root every gesture
  in the viewer is dead there while iOS works, which is the worst kind of bug to
  ship.
- **The safe-area insets are read before the Modal and handed back in** through
  `SafeAreaInsetsContext`. Inside a new window `useSafeAreaInsets()` reads a
  provider that is not there.

React context does cross — the Modal is still in the React tree — so
`useImageViewer()`, the theme and `useCalmMotion()` all work inside it.

Why a Modal and not teleport or Overlays' `Dialog`: `DelacourProvider` offers no
portal host, and teleport would add `react-native-teleport` plus a provider the
app must mount, for a feature that needs none of its stacking. Overlays' layer
primitives are on an unmerged branch and are **not imported**. A Modal gives a
window above navigators, tab bars and sheets, Android back through
`onRequestClose`, and zero setup. If Overlays later exposes a full-screen layer
primitive, swap the Modal inside `ImageViewerLayer` only — no public API moves.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/image-viewer` |
| `image-viewer.tsx` | Root + the `Object.assign` surface — open/index state, the composed-mode registry, measuring the Trigger, mounting the layer |
| `image-viewer-trigger.tsx` | `ImageViewer.Trigger` — a `Pressable` thumbnail; registers its image (composed mode) and its frame (both modes) |
| `image-viewer-close.tsx` | `ImageViewer.Close` — a ghost icon `Button`; the chrome draws one |
| `image-viewer-layer.tsx` | Internal: the `Modal`, the gesture root, the safe-area re-supply, the flight, the pager, every gesture |
| `image-viewer-page.tsx` | Internal: one image — the flying frame, the thumbnail base, the `fullSource` fade, the error |
| `image-viewer-chrome.tsx` | Internal: close, counter and caption, faded with flight, drag, tap and zoom |
| `image-viewer-image.tsx` | Internal: `renderImage`, or React Native's `Image` |
| `image-viewer.context.tsx` | The public context and the Trigger plumbing, with their hooks |
| `image-viewer.types.ts` | `ImageViewerImage` and the `renderImage` contract |
| `image-viewer.variants.ts` | Pure `tv()` slots, constants and every gesture, frame and dismiss resolver |
| `image-viewer.variants.test.ts` | Including the `media` token pair against `theme.css` |

Paging — the pan's position, the settle target, the mounted window — is
[`src/lib/paging.ts`](../../lib/paging.ts), shared with `Carousel`. It is imported,
never copied, and nothing here imports `../carousel`.

## Design

- **Two modes, told apart by the Trigger's `index`.** Composed mode (no `images`
  on the root, no `index` on the Trigger) makes the gallery out of the mounted
  Triggers in **mount order** — a monotonic counter taken when a Trigger first
  registers. Data mode (`images` on the root, `index` on each Trigger) exists
  because a virtualised list unmounts Triggers as they scroll, and a gallery
  built from mounted Triggers would shrink under the user's thumb.
- **A Trigger registers on every commit, and the root re-renders only on a real
  change.** `isSameImage` compares by value. A Trigger handed a fresh
  `{ uri }` literal each render would otherwise re-register, re-render the root,
  re-render itself, and loop.
- **Registration is keyed by a per-Trigger token, not by `id`,** so two Triggers
  for one image coexist and unmounting one does not drop the other's entry.
  `resolveGalleryOrder` dedupes them: first position, last data.
- **Both modes register a frame under the image's `id`** — the `View` inside the
  Pressable, measured with `measureInWindow` when the viewer opens and again
  when it closes. Measured on close too, because the user may have paged to an
  image whose Trigger is somewhere else, or scrolled. No Trigger, or one out of
  sight (`resolveOriginVisible`), and the viewer fades instead of flying
  (`resolveCloseTarget`).
- **The ref is on an inner `View`, not on the `Pressable`.** `Pressable`'s ref is
  typed off `Animated.View`, which resolves to `never` here, and the inner view
  fills the Pressable so its window frame is the Trigger's.
- **The image flies by frame, not by scale.** A clipping view animates
  `left/top/width/height` from the Trigger's frame to the fitted rect, the image
  `cover` inside, its corner going from the Trigger's to square. A scale
  transform would squash a cropped thumbnail into the wrong aspect for the whole
  flight; at rest the frame has the image's own aspect, so cover equals contain.
- **The fitted rect's aspect, in order of trust:** the image's `width`/`height`,
  the size an `onLoad` reported, the Trigger's own frame (only for the image it
  opened on), else the full safe box until something loads.
- **The thumbnail is the base layer.** It is already decoded, so the page draws
  from frame 0; `fullSource` fades in over it (150 ms, instant when calm). A
  failed `fullSource` is dropped silently. Only a failed thumbnail with nothing
  beneath it shows the `error` slot.
- **One `GestureDetector` and one set of zoom values, for the active page.**
  Paging needs scale 1, so only one page is ever zoomed; the zoom resets on every
  page change. `Race(Simultaneous(pinch, pan), Exclusive(doubleTap, singleTap))`.
- **The pan decides its job once, at activation.** Zoomed past
  `VIEWER_ZOOMED_THRESHOLD`, it pans the image (rubber band past the bounds,
  settle back inside). Otherwise `resolveDragAxis`: horizontal pages through
  `lib/paging`, vertical drags away. A drag that started paging never becomes a
  dismiss, and with `isDismissible={false}` a vertical drag does nothing.
- **The pan takes one finger (`maxPointers(1)`); the pinch carries two-finger
  panning itself** through `focalDelta`, so the point under the fingers stays
  under them while they move.
- **Zoom-to-pager hand-off at the image's edge is not done.** RNGH cannot cleanly
  transfer an active pan between two jobs. Zoom out to page. This is a v1
  non-goal, not a bug.
- **Dismiss:** `resolveDismissDecision` — past 15 % of the window, or a flick
  faster than 800 pt/s with the drag. A flick back against the drag restores.
  Up works as well as down. While dragging, the backdrop fades over half a window
  and the image shrinks to 0.8.
- **The open state is the JS side's; the layer outlives it.** `isOpen` going false
  starts the close animation, and the layer unmounts only from `onExited` at its
  end. Re-opening mid-close retargets the same values and the interrupted close
  never fires `onExited`.
- **Status bar:** a `StatusBar barStyle="light-content"` inside the Modal. The
  stage is dark in both themes, and React Native's StatusBar stack restores the
  app's own style when it unmounts.

## Tokens

`media` / `media-foreground` were added for this component (rule 11). The viewer
needs an opaque stage that is dark in both themes and chrome drawn on it; nothing
in shadcn's set means that, and `overlay` is a translucent scrim. Both are
derived — `media` is `foreground` in light and `background` in dark, and
`media-foreground` the reverse — so a pasted palette drags them along.
`@delacour/design-system`'s `convert.ts` derives them on the way in, like
`overlay`, and the Tokens page lists them.

## Accessibility

- Trigger: `imagebutton`, labelled by `alt`, hinted "Opens full screen image
  viewer", `accessibilityState.disabled` while the root is disabled.
- The pager is one `adjustable` element labelled `alt` (plus caption), valued
  "2 of 5". Swipe up/down pages. Custom actions **Zoom in / Zoom out / Reset
  zoom** step 1 → `doubleTapScale` → `maxScale`, so a screen-reader or switch user
  reaches detail without a pinch — double-tap is VoiceOver's activate gesture.
- Focus moves to the pager on open and back to the Trigger on close.
- Close is always a visible, labelled 44 pt button; gestures are never the only
  way out. Android back closes.
- Reduce motion / `useCalmMotion()`: no flight — the image sits at its fitted
  rect from frame 0 and the stage cross-fades; zoom and paging settle with a
  150 ms timing; close fades. Pinch and pan stay live: they are the user's own
  motion.

## Not here

Blur behind the viewer (`expo-blur`), shared-element transitions across
navigator screens, save/share/rotate/crop, video, a rotation gesture, caching or
prefetch (that is the caller's `renderImage`), and a public `Content` part — the
layer is internal until Overlays defines one. `expo-image` is not a dependency:
pass it through `renderImage`.

## Verification

Rendering is verified in the playground (`/image-viewer`), not by unit tests.
See the simulator notes at the end of this file for what was checked.

### Simulator notes

Verified on an iOS 26 simulator (iPhone 17, dev client, Debug) through `agent-device`:

- The gallery grid renders; a tap opens at the tapped image ("3 / 6") with a fitted frame and the chrome.
- **The opening flight waits for the thumbnail to decode.** A remote thumbnail in the page's new
  `Image` had not drawn when the spring started, so the flight ran invisibly and the photo popped in at
  rest. The entrance now starts when the active page's base layer reports `onLoad` (or `onError`), or
  after `VIEWER_LOAD_WAIT_MS` (250 ms), whichever is first. Reduce Motion and a missing origin skip the
  wait. Recorded frame by frame: the photo grows out of its tile.
- A sideways swipe pages ("4 / 6"); `fullSource` fades in over the thumbnail.
- Double-tap zooms 2.5× about the tapped point and hides the chrome; a zoomed drag pans and does not
  page; a second double-tap resets and brings the chrome back.
- A 60 pt drag springs back; a 260 pt drag dismisses. Close and dismiss both fly back into the thumbnail.

Not verified: Android, Reduce Motion, VoiceOver, a Release build, and the controlled and data-mode
demos.

**Captured previews:** `gallery-grid` (hero), `zoom` and `drag-to-dismiss` are `frame: "device"`
clips, because the viewer is a full-screen Modal; each demo's root fills and centres itself for that
reason. `custom-thumbnail` is a stage still. The media budget is tight, so captions and controlled
stay gallery-only. **A Trigger with custom children must not fill its height:** the inner wrapper
used to be `height: "100%"` either way, and a content-sized card stretched to the whole screen.
Children now get a width-only wrapper; the drawn thumbnail still fills.
