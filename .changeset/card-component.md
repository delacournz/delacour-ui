---
"@delacour/react-native-ui": minor
"delacour": patch
---

Add `Card`, a content surface with a header, a body and a footer

Built on `Surface`, so it takes the same four fills and steps to the next one when nested. Six parts —
`Card.Header`, `Card.Title`, `Card.Description`, `Card.Action`, `Card.Content` and `Card.Footer` —
share one inset through context across three sizes, and the padding lives on the parts, so media placed
straight in the card reaches its edges. `Card.Action` is pinned to the header's corner wherever it is
written, the title follows the foreground token of the card's fill, and `Card.Footer variant="band"`
sets the footer into the card on the next fill down. `useCard()` exposes the size and fill to custom
parts, and `bunx delacour add card` copies it into a project, with `surface` alongside.
