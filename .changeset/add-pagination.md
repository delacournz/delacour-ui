---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Pagination`, for moving through the pages of a result set. The `numbers` variant draws a
fixed-length run of page numbers and gaps, so the number under the reader's thumb never slides away
as the window moves; a gap never hides a single page, and tapping one jumps `pageJump` pages.
`compact` draws one "3 / 12" readout that VoiceOver swipes a page at a time, and `simple` the two
labelled arrows alone. `Pagination.Summary` and `Pagination.Status` ("41–60 of 472") sit at the
leading edge. A controlled `page` outside `[1, count]` is drawn clamped and reported once through
`onPageChange`. `sm` targets reach 44 points with hit slop. `delacour add pagination` copies it in.
