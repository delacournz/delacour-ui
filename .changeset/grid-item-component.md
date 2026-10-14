---
"@delacour/react-native-ui": minor
"delacour": patch
---

Add `GridItem` and `GridItem.Group`, a bento tile grid with whole-cell spans

`GridItem.Group` measures its width, sizes a cell from `columns`, `gap` and `aspect` or `rowHeight`, and
places each direct child first-fit in writing order from its `colSpan` and `rowSpan`, on pixel-snapped edges
and the logical `start` inset. It reserves its height before the first measure, so nothing jumps, and glides
tiles to new cells on a relayout unless reduce motion is on. `GridItem` takes four variants and two sizes,
renders a `Pressable` only when it has a press handler, and announces itself as one stop labelled from its
title, value and description. Parts: `Background`, `Media`, `Title`, `Value`, `Description`, `Footer` and
`Actions`; `useGridItem()` and `useGridItemGroup()` expose the tile's box and the group's cell size, and
`bunx delacour add grid-item` copies it into a project.
