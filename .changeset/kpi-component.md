---
"@delacour/react-native-ui": minor
"delacour": patch
---

Add `Kpi`, one number, its change and a sparkline of how it got there

Built on `Card`, so it takes the card's four fills and three sizes and sits on the card's inset. `Kpi.Trend`
takes a signed percentage and colours it by what it means rather than by its sign — `goodDirection` on the
card says whether up, down or neither is good news, and every trend inside follows it — as a line of text or
a badge with an arrow, announced as one string. `Kpi.Sparkline` is a `Chart` line with no axes in the card's
series colour, under the number or in a fixed column beside it, and holding it scrubs a point: the KPI keeps
the scrubbed index as controllable state that `useKpi()` reads. `isLoading` holds placeholders of each part's
size, and `Kpi.Group` lays several metrics out in a row or a column, optionally on one surface with rules
between. `Chart` gains `frameClassName`, which sizes the plot's frame. `bunx delacour add kpi` copies it into a
project, with `card` and `chart` alongside.
