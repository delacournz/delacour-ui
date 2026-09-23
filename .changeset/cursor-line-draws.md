---
"@delacour/react-native-charts": patch
---

`ChartCursorLine` draws again. The rule resolved its position through a nested worklet helper and never appeared on device — in a bare scrub and in every themed `Chart.Tooltip` crosshair — while `ChartCursorDot` did. It now reads the scrub inline.
