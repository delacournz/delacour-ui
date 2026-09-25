---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Steps`, a stepper for multi-step flows

`Steps` shows where someone is in a flow: numbered indicators joined by a line, each step completed, current or
upcoming against one zero-based `value`. It runs horizontally, with titles under the indicators, or vertically, with
titles and descriptions beside them, in two variants and three sizes. The connectors are drawn for you — the root
counts its `Steps.Item`s and every one but the last draws a line to the next, filled once the value has passed it.

A step can be loading (a spinner in the indicator), invalid (a cross and a destructive title) or disabled, and
`completed` overrides whether it reads as done. Steps take presses and move the value there; `isLinear` keeps the
steps ahead closed, and a controlled `value` with no `onValueChange` is a read-only progress display whose steps are
not announced as buttons. `Steps.Panel` holds a step's form or summary below its title, outside the tap target, so its
controls stay reachable by a screen reader. Each step is announced as its title with a value such as "Step 2 of 3,
completed".

`bunx delacour add steps` copies it into your project.
