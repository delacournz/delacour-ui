---
"@delacour/native-ui": minor
---

**Breaking.** `Button`'s `isIconOnly` prop is removed. A square footprint is now a
size: `size="icon-sm"`, `size="icon-md"` or `size="icon-lg"`.

```tsx
// before
<Button accessibilityLabel="Favourite" isIconOnly size="sm" variant="ghost">

// after
<Button accessibilityLabel="Favourite" size="icon-sm" variant="ghost">
```

Each `icon-*` size is its labelled step with the horizontal padding traded for a
width off the same token, which is shadcn's spelling and makes padding and width
mutually exclusive by construction rather than by rule.

- `BUTTON_SIZES` now holds all six values, and is derived from the new
  `BUTTON_LABEL_SIZES` and `BUTTON_ICON_SIZES` tuples. `ButtonSize` widens to
  match; `ButtonLabelSize` and `ButtonIconSize` are exported alongside it.
- `buttonVariants` no longer accepts `isIconOnly`; pass the size instead. Its
  signature now matches the public prop exactly, so
  `buttonVariants({ size: "icon-md" })` works.
- `ButtonLayout` loses `isIconOnly`, and `resolveButtonLayout` no longer takes
  it — it now folds only `isLoading` and `spinnerPlacement`.
- `useButton()` reports `size` verbatim, so an icon button returns `"icon-lg"`
  rather than `"lg"`. Match against `BUTTON_ICON_SIZES` where a child needs to
  know it sits inside a square one.
