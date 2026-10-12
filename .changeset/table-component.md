---
"@delacour/react-native-ui": minor
"delacour": patch
---

Add `Table`, rows and columns of short values lined up by one set of column rules

`columns` on the table declares each column once — `{ flex }` or `{ width }`, with an `align` — and every row's
Nth cell reads the Nth rule, so a header, the body and a footer line up without a width on any cell. Bare text is
set in tabular figures. `Table.Head` takes `sort` to become a button that draws and announces its direction while
the caller owns the order; `Table.Row` takes `onPress` and `isSelected` to become one selectable button named by its
cells, and each cell announces its column's heading. `size`, `variant="outline"` and `striped` set density and
chrome; `minWidth` scrolls a wide table sideways with edge fades that dissolve into the surface behind it; rows
render from a `FlatList` with `index` and `isLast`; `Table.Empty` keeps the header; `Table.Frame` puts the table in a
card under a title and an action. `bunx delacour add table` copies it into a project.
