---
"@delacour/react-native-ui": patch
---

Flow, MarkdownEditor, Sketch and FlipCard keep their inner controls reachable by a screen reader. A draggable `Flow.Group` offers Move up/down/left/right, shifting its riders and reporting `onNodeDragEnd` as a drag does, with a new `accessibilityMoveStep` prop; a MarkdownEditor list row mirrors each link inside it as an "Open link …" action that goes through `onLinkPress`; `Sketch.Canvas` offers Undo and Clear only when there is a mark and the sketch is enabled; and `Sketch.Canvas` and a swipe `FlipCard` face warn in development when a control is composed into them, since each is one accessibility element.
