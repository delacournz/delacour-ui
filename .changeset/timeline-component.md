---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Timeline`, a sequence of dated events down a rail or across a snapping strip

`Timeline` lays out an order's history, a project's milestones or a match's key moments: each `Timeline.Item` is a
marker on a rail with a title, a date, a description and optional side columns. One zero-based `value` says how far
along the sequence is — events before it completed, at it current, after it upcoming — and the rail fills off that
value alone, so it is never half drawn between two events. `tone` says what kind an event is (`info`, `success`,
`warning`, `destructive`) and tints its marker whatever its progress. Five variants (`dot`, `icon`, `numbered`, `card`,
`compact`) and two sizes. Horizontally it is a swipeable strip of columns that can snap, fires `onColumnChange` and a
selection haptic as each column reaches the reading edge, and collapses an empty column to a tick. `Timeline.List`
virtualises a long history over a `FlatList` and supplies each item's position itself. `Timeline.Masthead` and
`Timeline.Stats` head the sequence. Each event is one VoiceOver stop, read as "Event 2 of 6, completed, success".

`bunx delacour add timeline` copies it into your project.
