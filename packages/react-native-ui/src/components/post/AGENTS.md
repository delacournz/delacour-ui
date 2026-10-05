# Post

A social card: an author, a body, optional media and the counts underneath, with the counts
animated. Compound root plus `Post.Header`, `Post.Author`, `Post.Community`, `Post.Action`,
`Post.Title`, `Post.Body`, `Post.Media`, `Post.Footer`, `Post.Stat` and `Post.Votes`.

`import { Post } from "@delacour/react-native-ui/post";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/post` |
| `post.tsx` | Root + the `Object.assign` compound surface |
| `post-header.tsx` | `Post.Header` — the row above the content |
| `post-author.tsx` | `Post.Author` — face, name, verified check, handle, relative time |
| `post-community.tsx` | `Post.Community` — the header a `vote` card leads with |
| `post-action.tsx` | `Post.Action` — an icon button in the header |
| `post-title.tsx` | `Post.Title` |
| `post-body.tsx` | `Post.Body` — the tokenised renderer and the "more" clamp |
| `post-media.tsx` | `Post.Media` — the fixed-shape frame, fallback and scrim |
| `post-footer.tsx` | `Post.Footer` |
| `post-stat.tsx` | `Post.Stat` — the glyph that fills and pops |
| `post-stat-count.tsx` | `DelacourUI.Post.Stat.Count` — the internal rolling number, shared by `Stat` and `Votes` |
| `post-votes.tsx` | `Post.Votes` — the score pill |
| `post.context.tsx` | `PostProvider`, `usePost()`, `usePostContext()`, `usePostPart()` |
| `post.types.ts` | `PostSlotProps`, shared by `Header` and `Footer` |
| `post.variants.ts` | The slotted `tv()`, the layout/scrim/vote/tone/fill resolvers, no RN imports |
| `post.utils.ts` | `formatCompactCount`, `formatRelativeTime`, `tokenizePostBody` and the a11y label builders |
| `post.variants.test.ts`, `post.utils.test.ts` | |

## Design

- **Axes**: `variant` — `feed`, `vote`, `compact`, `media`; `size` — `default`, `sm`. A stat has
  `tone` — `neutral`, `like`, `save`, `repost` — crossed with `active`, and `align` — `start`,
  `end`. The vote pill has `vote` — `none`, `up`, `down` (`resolveVoteKey`, because `tv` cannot key
  on `null`).
- **The variant decides layout, never which parts exist.** `resolvePostLayout` is the only place a
  shape is described — `hasMedia`, `handleInline`, `mediaScrimDefault`, `authorOverMedia` — and
  the parts read it. Changing a card's shape is a prop change, not a restructured tree.
- **Nothing is counted here.** `active`, `value`, `vote` and `score` are caller state. An
  optimistic like and the server's answer are two values only the app can reconcile; a component
  that kept its own count would show the wrong one the moment they disagreed. Post owns what a
  press looks like.
- **A pressable card is `accessible={false}`.** An accessible parent swallows its children on iOS,
  so a card that merged would hide like, reply and the author's profile tap from VoiceOver. The
  cost is that the card's own `onPress` is not a VoiceOver stop — give the thread another
  reachable path (a title, or the reply stat) when that matters. Without `onPress` the root is a
  plain `View`.
- **`Post.Author` and `Post.Community` are one stop each.** Their labels are built by
  `resolveAuthorA11yLabel` — "Ada Lovelace, @ada, verified, 3 minutes ago" — so the time is read as
  words, never "3m", and four elements are not four swipes.
- **Lit glyphs are the same glyph, filled.** Central Icons is an outlined set and
  `CentralIconBase` pins `fill="none"` after the caller's props, so no prop can fill one. `Post.Stat`
  draws a filled copy of the outline (`POST_FILL_PATHS`, copied from the glyph's own path data)
  *under* the glyph. A heart that swapped shape on toggle reads as a different control.
  `resolveStatFillPath` defaults the heart for `like` and the bookmark for `save`; a caller drawing
  `like` with a thumb passes `fillPath=""`, or the heart would show through it.
- **The count rolls the way it moved.** `PostStatCount` keys the number on its text; the arriving
  number enters with `SlideInDown` when it rose and `SlideInUp` when it fell, the leaving one only
  fades. Only the arriving half carries direction — the leaving half was rendered before the
  change was known. A string or a first value cross-fades: a roll in a guessed direction is worse
  than none (`resolveStatDirection`).
- **The direction is derived state, not a ref read in render.** The previous value lives in
  `useState` and is compared during render. React Compiler is on in the playground and treats a ref
  read in render as stable — the roll would always go the first way it went.
- **`LayoutAnimationConfig skipEntering` keeps the first value still.** A feed mounting forty cards
  should not roll forty numbers into place.
- **The pop is on activation only.** `withSequence` springs the glyph to 1.2 and back when `active`
  turns on, never when it turns off — un-liking is not an event worth celebrating.
- **Reduced motion follows the OS; calm motion is not consulted.** The roll and the pop are
  behaviour, not decoration: `ReduceMotion.System` on the layout animations swaps the number
  instantly, and `useReducedMotion()` skips the pop. Post has no loop, so `useCalmMotion` — which
  is for endless motion — does not apply. Do not add it to the roll.
- **Media has a fixed shape.** The frame's height is `aspectRatio` (16:10 by default), never the
  picture's, so a tall photo and a wide one make the same card and a feed does not jump as images
  arrive. A muted fill sits under a loading image and an image glyph replaces a failed one, in the
  same frame. The ratio is a `style`: a runtime number has no class.
- **A pressable picture is a press target laid over the frame.** `Pressable` takes no `style`, so
  the frame stays a `View` carrying the ratio, with an `absolute inset-0` `Pressable` over it.
- **`Post.Media`'s `children` replace the image, and are the only seam for galleries.** The frame,
  corners, ratio and scrim stay. That is where an app drops a carousel, a video or an
  attachment gallery; Post imports none of them and takes no `attachments` prop. `expo-image` is
  the obvious upgrade for the picture itself, through this slot — it is not a peer.
- **`compact` renders no media, and warns in development.** A timeline row has no picture; the
  `media` slot is also `hidden` there so a stray class cannot bring it back.
- **White over a photograph is the one raw colour, and it is deliberate.** `POST_ON_MEDIA_COLOR` and
  the `text-white` classes on the `media` variant's author: type laid on a picture has no theme
  surface to take a foreground from. The static black scrim (`POST_SCRIM_COLOR`, fading to the
  same black at zero alpha so it never greys through white) is what guarantees the contrast, in
  both themes. Nothing else names a raw colour or a `dark:` variant, and a test holds that.
- **Tokens, not components, for the card.** The root is a hand-rolled
  `bg-card border border-border rounded-lg`, not a `Card`: the `media` variant's picture is
  full-bleed, and a `Card` would bring a second padding model.
- **Body tokens are coloured always, pressable only with a handler.** A tag with no `onTagPress` is
  coloured text, not a link that does nothing; one with a handler is `accessibilityRole="link"`.
  `tokenizePostBody` is lossless, so a body never loses a character to parsing.
- **"More" is measured, not guessed.** A clamped `Text` reports only the lines it drew, so an
  expandable body lays an invisible, unclamped twin over itself and compares its line count with
  the clamp. A short post offers no "more" to tap into nothing (`resolveBodyClamp`).
- **Controls are 32 points with a 6-point hit slop.** `Post.Action`, the vote arrows and the stats
  reach 44 without growing the row — a test pins `POST_CONTROL_POINTS + 2 × POST_HIT_SLOP ≥ 44`.
- **The score's label sits on the score.** React Native has no group role VoiceOver reads, so
  "Score 1,240" is on the number between the arrows, which is also a polite live region.
- **Stats speak the full number.** `resolvePostStatLabel` builds "Like, 1,234" from the raw value,
  so `1.2K` is never read as "one point two K". On/off is `accessibilityState.selected`.
- **`formatRelativeTime` is private to Post.** It is not hoisted to `src/lib/` — the media
  category's lead dedupes time helpers after integration.

## Accessibility

| Part | Announced as |
| --- | --- |
| Card with `onPress` | not a stop — its children are (see above) |
| `Post.Author` / `Post.Community` | one element; a `button` with `onPress` |
| `Post.Action` | `button`, its required `accessibilityLabel` |
| `Post.Title` | `header` |
| Body tag / mention / link with a handler | `link` |
| `Post.Media` | `image` with `alt`; `alt=""` is skipped |
| `Post.Stat` | `button`, "Like, 216", `selected` when lit |
| `Post.Votes` | "Upvote" / "Downvote" buttons, `selected` when cast; "Score 1,240" live region |
