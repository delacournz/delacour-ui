# Avatar

A person, as a picture — with an initials fallback, an overlay slot for a count
or a presence dot, and a group that stacks several faces and counts the rest.
Compound root plus `Avatar.Badge` and `Avatar.Group`.

`import { Avatar } from "@delacour/react-native-ui/avatar";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/avatar` |
| `avatar.tsx` | Root + the `Object.assign` compound surface |
| `avatar-badge.tsx` | `Avatar.Badge` — the corner overlay, a presence dot when empty |
| `avatar-group.tsx` | `Avatar.Group`, plus its internal `Item` and `Overflow` leaves |
| `avatar.context.tsx` | `AvatarProvider`, `AvatarGroupProvider`, `useAvatar()`, `useAvatarContext()`, `useAvatarGroupContext()`, `useAvatarPart()` |
| `avatar.render.test.tsx` | Mounted under Jest — accessible name and role, fallback initials, image failure and retry, press and disabled, `Avatar.Badge`, `Avatar.Group` overflow and list semantics, context and out-of-root errors |
| `avatar.variants.ts` | Pure `tv()` slots, `AVATAR_SIZE_POINTS`, `resolveAvatarSize`, `resolveAvatarOverlap`, `resolveAvatarInteractive` |
| `avatar.variants.test.ts` | |
| `avatar.utils.ts` | Pure non-styling logic — initials, the image-retry key, flattening a group's fragments, group overflow maths, the spoken label |
| `avatar.utils.test.ts` | |

## Design

- **The fallback is always painted; the image goes on top.** The face renders
  its initials (or a person glyph) first and mounts the `Image` absolutely over
  them. A picture that is still loading, or that never loads, leaves the fallback
  showing rather than an empty circle — there is no loading state to manage
  because there is nothing to swap.
- **A failure is remembered by key, not by object.** `resolveAvatarSourceKey`
  turns the source into a JSON string — every request field (URI, bundle,
  method, sorted headers, body, cache mode) and the entry's width, height and
  scale, or the asset's module id — and
  `onError` stores the key that failed. Keyed by object identity, an
  inline `source={{ uri }}` is new every render and a dead URL would retry
  forever; keyed by URI alone, a token refresh in the headers would never retry.
  A consumer's `imageProps.onError` fires after the fallback has taken over.
- **The root carries the edge; there is no `self-start`.** A fixed width and
  height is something a column's `stretch` never overrides, so the avatar keeps
  its size without the `self-start` a [`Badge`](../badge/AGENTS.md) needs — and
  it leaves the parent's alignment alone. With `self-start`, every avatar in an
  `items-end` or `items-center` row was pinned to the row's top: mixed sizes lost
  their baseline and a list row's avatar sat above its title. Found on the
  simulator; a test now forbids any `self-*` on the root or the group.
- **Two boxes, not one.** `root` is unclipped and holds the overlays; `face` is
  the clipped circle. An `Avatar.Badge` hangs over the circle's edge, and a
  single clipped box would cut it in half. A test asserts `overflow-hidden` is on
  `face` and never on `root`.
- **Initials are the first letter of the first and last word.** `Anahera Rose
  Tui` is `AT`, the way a person signs, and `Mihi` is `M`.
  `resolveAvatarInitials` walks code points rather than UTF-16 units, so a letter
  outside the basic plane is never split into a replacement box, and skips
  leading punctuation so `"(Aria)"` still gives `A`. `fallback` overrides the
  drawn text only; `name` is still what a screen reader reads.
- **Two axes paint the fallback, on `Badge`'s six colours.** `variant` is `soft`
  or `solid`, `color` is `default` … `info`, and the twelve cells live in
  `compoundVariants` with the same fills `Badge` uses, so an avatar and a badge
  of one colour read as one family. `AVATAR_FOREGROUND_TOKEN` gives the person
  glyph the same shade as the initials; a test pins each entry to the token the
  `fallbackLabel` slot resolves to, and checks every token exists in both themes.
- **A neutral face has a hairline edge; a photo does not.** `muted` and
  `secondary` sit a percent or two from the page in light — on the simulator a
  `default` fallback and the `+N` tile all but vanished. They draw
  `border-border` inside the box, so nothing moves, and the edge goes while a
  photo is mounted (`hasImage`), since a grey line around a face reads as a
  frame. The coloured fallbacks have fill enough without one.
- **A size is a fixed edge, unlike a badge.** `sm`/`md`/`lg`/`xl`/`2xl` are
  32/40/48/64/96 points. `2xl` is the face a profile leads with — what
  [`PageHeader`](../page-header/AGENTS.md) draws by default — and it is a step on
  the scale rather than a `size-24` override so `AVATAR_SIZE_POINTS` never lies
  about the edge the group maths and initials sizing read. Faces line up against each other and against list rows, so the
  circle stays fixed — a fixed-size chrome exception WCAG 1.4.4 allows for a
  glyph-bearing shape, as with a Badge dot. The initials and the `+N` do scale
  with the user's text size, but bounded to the circle: `resolveAvatarLabelFit`
  gives each size a `maxFontSizeMultiplier` (the largest at which the glyphs
  still span 75% of the edge, between 1 and the library's 2×) and a
  `minimumFontScale` for `adjustsFontSizeToFit` as the last resort, so `sm`
  (32 pt) never clips. `AVATAR_LABEL_POINTS` and `AVATAR_SIZE_POINTS` restate the
  scales as numbers (the group's overlap is a runtime margin and cannot be a
  class); tests pin them to the classes.
- **An avatar is content until it is given something to do** — the rule
  [`Badge`](../badge/AGENTS.md) follows. With no `onPress` or `onLongPress` it
  is a plain `View` announced as an image (or not announced at all when it has
  no name); supply either and it becomes a [`Pressable`](../pressable/AGENTS.md)
  announced as a button. `resolveAvatarInteractive` is that decision.
- **The avatar is one element to assistive technology.** The root is
  `accessible`, so an `Avatar.Badge` inside it is never focused on its own. A
  presence dot has no words; put the status into the avatar's
  `accessibilityLabel` (`"Aria Whitlock, online"`).
- **`Avatar.Badge` is a pin, and a dot only when empty.** Given children — a
  `Badge` with a count, an `Icon` — it positions them and adds nothing else, so a
  count keeps the look it has everywhere else. Empty, it draws a dot sized to
  the face and ringed in `border-background`, which separates it from the photo
  underneath. `placement` is `top-right` or `bottom-right`.
- **The group's ring belongs to the slot, not the face.** Each child is wrapped
  in an item with `border-2 border-background`, so a face in a group keeps the
  same edge it has alone, and the stack reads as separate people on any surface.
  The `+N` tile sits in the same wrapper, so it lines up with the faces.
- **The first face is on top, and the list still reads first to last.**
  `zIndex` counts down across the items instead of the children being reversed,
  and the overlap is a negative `marginStart`, so the order in the tree — and
  therefore the order a screen reader walks — is the written order in both
  writing directions. The group is `role="list"` and each item `listitem`.
- **`max` caps the faces, not the row; `total` counts people never passed.**
  Five children at `max={3}` is three faces and `+2`; three children with
  `total={40}` is `+37`, without forty elements in the tree.
  `resolveAvatarGroup` clamps a negative or fractional `max` and ignores a
  `total` below the child count rather than drawing `+-2`.
- **The overflow tile draws at most `99+` and reads the real number.** Three
  digits do not fit a small circle; a screen reader has room for `1234 more`.
  `onOverflowPress` turns the tile into a button — to open the full list.
- **The spoken strings are the `labels` prop, not literals**: `button` (a pressable
  avatar's name with no label, name or fallback), `overflow(count)` (the tile's
  spoken name) and `overflowText(count, max)` (its drawn `+37` / `99+`) come from
  `lib/labels` through `useLabels("avatar", labels)`. `Avatar` and `Avatar.Group`
  each take `labels`; an `Avatar` in a group lays its own over the group's, key by key.
  Precedence: `accessibilityLabel` / `name` / `fallback` ← `labels` prop ←
  `DelacourProvider` `labels` ← English. `resolveAvatarAccessibilityLabel` and
  `resolveAvatarOverflowLabel` take the labels as a trailing argument;
  `AVATAR_BUTTON_FALLBACK_LABEL` is an alias of the English default.
- **The overlap defaults to a third of the edge and is clamped.**
  `resolveAvatarOverlap` never slides a face further than a whole face nor
  backwards, and `overlap={0}` closes the stack into a plain row. A child's own
  `size` still beats the group's, but the overlap is computed from the group's.
- **A pressable avatar reaches the minimum touch target with `hitSlop`, not size.**
  `sm` and `md` draw under 44, so a tappable one takes slop up to the app's
  minimum and the face stays the size it was. Inside `Avatar.Group` the slop is
  capped at 0: the faces overlap, and slop would hand the press to the later face
  rather than the one under the finger. A caller's own `hitSlop` wins.
- **Avatar slop is theme-safe because a face is not a button token.** The edge is `size-8` …
  `size-24`, the base spacing scale, which a density style (`--spacing-button-*`) does not
  retune, so `AVATAR_SIZE_POINTS` stays the drawn edge and no live read is needed. A face
  sized from a `--spacing-button-*` token would have to read it with `useThemeLength`.
- **A pressable avatar is named for the person, not for its initials, on purpose.** The
  drawn "RK" is an abbreviation of the name `Rawiri Kemp`, not a label of its own; naming the
  control "RK" would tell a screen reader nothing, and "RK, Rawiri Kemp" reads the person twice.
  The full name is the control's purpose, which is what a name must give. A person using
  speech input says that name, or the number Voice Control overlays on it. Where the drawn text
  is itself the label (`fallback` with no `name`) the two are identical. Pass `accessibilityLabel`
  to name the action ("Open Rawiri Kemp's profile") when the person alone is not enough.
