---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Map` — a themed map for places and paths, at `@delacour/react-native-ui/map`

Markers that are React views and anchor on their pin's tip, labels, themed popups, routes, arcs and
floating zoom, compass, recenter and locate controls, on `react-native-maps` (Apple Maps on iOS,
Google Maps on Android). Light and dark follow the app's theme, and Android's basemap is painted
from its tokens. Props set the opening view; a ref moves the camera with `flyTo`, `fitBounds` and
`recenter`. `react-native-maps` is a new optional peer, resolved only by an app that imports `/map`;
`delacour add map` copies the component into a project and `expo install`s it.
