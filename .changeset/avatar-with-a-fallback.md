---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Avatar`

A person as a picture. The initials of `name` are painted first and the image goes on top, so the circle is never
empty while a picture loads or after it fails, and a failed source retries on its own when its URI or headers change.
`variant` and `color` paint the fallback on the six colours `Badge` takes; `sm`, `md`, `lg` and `xl` are fixed edges.

`Avatar.Badge` pins a count or, left empty, a presence dot to a corner without the circle clipping it. `Avatar.Group`
overlaps its faces with the first on top, rings each in the page background, and counts the people past `max` — or
up to `total` — in a trailing `+N` tile that `onOverflowPress` can make a button.

`delacour add avatar` copies it in.
