---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Breadcrumb` — the path to the current screen, links back up each level and the current page last.

- `Breadcrumb.List` counts its direct `Breadcrumb.Item`s and puts a separator between every pair, none after the last. A hand-placed `Breadcrumb.Separator` stands in for the automatic one beside it, and the root's `separator` replaces the chevron everywhere.
- Past `maxItems` the middle folds into an ellipsis, keeping `itemsBeforeCollapse` and `itemsAfterCollapse` at each end; `onEllipsisPress` makes it a button and hands over the hidden indices. `overflow="scroll"` runs the trail on in a horizontal scroller opened at the current page.
- `Breadcrumb.Link` is a `Pressable` announced as a link with a 44-point target and takes an `onPress` — no router coupling. `Breadcrumb.Page` is announced selected; separators are hidden from screen readers; chevrons flip in right-to-left layouts.
- `sm` and `md` sizes, on the caption and body text steps.
- `delacour add breadcrumb` copies it into a project.
