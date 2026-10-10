---
"@delacour/react-native-ui": minor
"delacour": minor
---

`Badge` is read-only now, and gains a count, a dot and a corner to pin to

**Breaking.** `Badge` no longer takes `onPress`, `onLongPress`, `onClose`, `closeAccessibilityLabel`,
`closeTestID`, `isDisabled`, `haptic` or `feedback`, and `Badge.CloseButton` is gone, along with
`resolveBadgeInteractive` and `BadgeCloseButtonProps`. A badge is a plain `View`. Anything a user
taps, toggles or removes is a `Chip`, which shares Badge's colours and tones and already had the
better close control — on a pressable badge, iOS folded the dismiss button into the badge's own
accessibility element and it could not be reached by swipe.

```diff
- <Badge color="primary" variant="soft" onClose={remove}>Design</Badge>
+ <Chip color="primary" onClose={remove}>Design</Chip>
```

What a badge draws now follows from what it is given:

```tsx
<Badge color="success">Active</Badge>        // children — a label
<Badge color="destructive" count={unread} /> // a count: "99+" past `max`, nothing at zero
<Badge color="destructive" />                // neither — a dot
```

`count` and children are alternatives, and passing both is a type error. `showZero` keeps a count of
zero on screen; `max` moves the cap.

`placement` pins any of the three to a corner of its parent, and `Badge.Anchor` is the content-sized
box to pin it in:

```tsx
<Badge.Anchor accessible accessibilityLabel={`Inbox, ${unread} unread`}>
  <Icon icon={IconEmail1} size="lg" />
  <Badge color="destructive" count={unread} placement="top-right" size="sm" />
</Badge.Anchor>
```

The badge is pinned by its inner edge, so a count that gains a digit grows away from the glyph. An
`Avatar` still pins its own through `Avatar.Badge`.

`Chip` now builds its resting paint from Badge's exported `BADGE_SURFACE_CELLS` rather than a restated
copy, and both read the new `lib/wrap-text-children` helper. `bunx delacour add badge` and
`add chip` copy that helper in with them.
