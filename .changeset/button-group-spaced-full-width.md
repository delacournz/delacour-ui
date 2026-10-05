---
"@delacour/react-native-ui": minor
---

`Button.Group` takes `isAttached` and `isFullWidth`. `isAttached={false}` keeps the shared
`variant`, `size`, `isDisabled` and `feedback` but drops the joined shape: every member keeps its
own corners, no seam overlaps, the run takes a gap, and a press scales again. `isFullWidth` spans
the parent and splits it equally between members, whatever their labels say. A custom member reads
both through `useButtonGroupItem()`, as `isAttached` and `isStretched`.
