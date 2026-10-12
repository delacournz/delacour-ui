---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `MarkdownEditor`, a Markdown field with a formatting toolbar, a monospaced write pane and a rendered preview

The toolbar wraps a selection or inserts markers at the caret, toggles a format off when pressed
again, applies headings, quotes and lists to every touched line, and lights from the caret. Return
continues a list. The preview draws the toolbar's subset on the `Text` presets and opens a link only
for http, https, mailto and tel. It joins `Field` like `Input`, comes in a `bar` or `pill` toolbar,
and ships `applyMarkdownCommand`, `continueMarkdownList` and `parseMarkdown` as plain functions. The
CLI adds it with `delacour add markdown-editor`.
