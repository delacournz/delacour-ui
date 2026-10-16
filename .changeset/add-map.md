---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Map` — a themed map for places and paths, at `@delacour/react-native-ui/map`

Markers that are React views and anchor on their pin's tip, labels, themed popups, routes, arcs and
floating zoom, compass, recenter and locate controls, on MapLibre (`@maplibre/maplibre-react-native`).
The basemap is OpenStreetMap vector tiles from OpenFreeMap — free, no key — painted from the theme's
tokens on both platforms, so light, dark and any retuned theme carry through to the map; `mapStyle`
or `buildMapStyle` swap in other tiles. Props set the opening view; a ref moves the camera with
`flyTo`, `fitBounds` and `recenter`. `@maplibre/maplibre-react-native` is a new optional peer,
resolved only by an app that imports `/map`; `delacour add map` copies the component into a project
and `expo install`s it.
