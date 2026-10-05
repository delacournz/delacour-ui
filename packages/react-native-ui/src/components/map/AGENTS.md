# Map

A themed map for showing places and paths — a store finder, a delivery route, a
run. Apple Maps on iOS and Google Maps on Android, through `react-native-maps`.
Compound root plus eight parts: `Marker`, `Pin`, `Label`, `Popup`, `Controls`,
`Route`, `Arc`, `UserLocation`. A display component: no search, no geocoding,
no directions.

`import { Map, type MapHandle } from "@delacour/react-native-ui/map";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/map` |
| `map.tsx` | Root, the camera handle, the overlay layer, and the `Object.assign` compound surface |
| `map-marker.tsx` | `Map.Marker` — a React view on a coordinate, anchored on its pin's tip |
| `map-pin.tsx` | `Map.Pin` — the drawn teardrop, which reports its frame to the marker |
| `map-label.tsx` | `Map.Label` — a pill of text on `Surface` |
| `map-popup.tsx` | `Map.Popup` — a card with a caret, inside a marker or on its own coordinate |
| `map-controls.tsx` | `Map.Controls` — zoom, locate, compass and recenter, on the overlay layer |
| `map-route.tsx` | `Map.Route` — a polyline |
| `map-arc.tsx` | `Map.Arc` — a sampled quadratic curve |
| `map-user-location.tsx` | `Map.UserLocation` — the native dot, plus a themed heading cone |
| `map.context.tsx` | `MapProvider`, `useMap()`, `useMapContext()`, `useMapPart()`, the user-location and marker contexts |
| `map.types.ts` | `LngLat`, `LngLatBounds`, `ViewState`, `MapRegion`, `MapHandle` — no RN imports |
| `map-geometry.ts` | Zoom, region and bounds conversions, `boundsOf`, `arcCoordinates`, `padRegion` — pure |
| `map-geometry.test.ts` | |
| `map.variants.ts` | The slotted `tv()`, the axes, the pin outline, anchors, the Android basemap style — no RN imports |
| `map.variants.test.ts` | |

`src/no-maps.test.ts`, one level up, holds the import-graph rule below.

## Design

- **`react-native-maps` is an optional peer, and only this folder may import it.**
  It is the one native module the library adds for a single component, catalogued at
  the version Expo SDK 57 bundles. An app that never imports `/map` never installs
  it — but only while nothing else reaches it, so `src/no-maps.test.ts` reads the
  whole tree as text and fails by file name for any import of the module, or of
  this folder, from outside it. One stray import from a shared helper would fail
  every app's bundle with "Unable to resolve module react-native-maps".
- **Coordinates are `[lng, lat]`, everywhere a caller sees one.** That is GeoJSON's
  order and every web map library's, so a coordinate pasted from one lands in the
  right hemisphere. `react-native-maps` takes `{ latitude, longitude }`, and
  `lngLatToLatLng` is the one place the order flips.
- **Props set the initial view only; the ref moves the camera.** A map that
  re-centred on every `center` change would fight a user mid-pan the first time a
  parent re-rendered with a new array. The view is captured on mount; a change to
  `center`, `zoom` or `bounds` afterwards warns in development
  (`hasInitialViewChanged`, compared by value so a fresh array is not a change).
  `flyTo`, `fitBounds`, `recenter` and `getViewState` are on the `ref`, and
  `useMap()` hands the same handle to anything inside.
- **The map mounts after its root is measured.** The opening region depends on the
  view's aspect — a city at zoom 12 shows more degrees north to south in a tall
  view than a wide one — and a region guessed before layout opens at the wrong zoom.
  The root paints `bg-muted` for that one frame.
- **Zoom is the web-map scale, converted on the projection.** `0` is the world and
  each step halves it, so a zoom copied from a web map means the same here.
  `centerZoomToRegion` projects the latitude span through Web Mercator rather than
  copying the longitude span, which would zoom a high-latitude map out further than
  asked. `regionToViewState` prefers the camera's own zoom where the platform
  reports one (Google) and reads it off the span where it does not (Apple).
- **Bounds are antimeridian-safe.** A box with `west > east` crosses 180°.
  `boundsOf` picks the box that leaves out the widest stretch of longitude no point
  touches, so three stops across Fiji are a box a few degrees wide rather than one
  spanning the world. `fitBounds` frames the box as a padded region
  (`padRegion`) rather than handing corners to the native fit, which would take a
  crossing box the long way round.
- **A marker anchors on its pin's tip.** `Map.Pin` reports its frame inside the
  marker and `resolvePinTipAnchor` turns it into the anchor, so a popup over the pin
  or a label under it changes the marker's size without moving the place it marks.
  An explicit `anchor` wins; a marker with no pin anchors on its centre. Google
  takes the unit-square `anchor`; Apple ignores it and takes `centerOffset` in
  points, so both are passed (`resolveMarkerCenterOffset`). The pin must be a
  direct child for its frame to be relative to the marker.
- **A marker redraws only while it is settling.** Google draws a custom marker as a
  bitmap and refreshes it only while `tracksViewChanges` is on; on for good it costs
  a redraw per frame per marker. It is on for half a second after the marker's size,
  its pin's frame or the theme changes, then off.
- **The pin is drawn, not an icon.** A pin's tip is a point on the map; a glyph
  centred in a square would mark a place a few points off. `mapPinPath` starts at
  the tip, and the dot in its head is the fill's own `-foreground`, so the pair holds
  contrast in every theme with one choice. Hidden from assistive technology — the
  marker carries the name.
- **A popup is a React view, not the platform callout.** The native callout takes no
  theme; this is a `Surface` with a caret drawn in `card` and stroked in `border`.
  Inside a marker it sits in the marker's column over the pin; outside one it needs a
  `lngLat` — the props are a union, so a popup with nowhere to go is a type error —
  and becomes a bottom-anchored marker of its own. It holds no open state: the caller
  knows which place is selected and renders it or not.
- **A label's side is a gap, not a position.** A marker is a column and React Native
  has no `order`, so `side` picks which margin the label keeps from the pin and the
  caller writes it before or after the pin to match. Card fill with a hairline so it
  reads over any basemap; one line, truncated.
- **Controls live on a layer above the map, not inside it.** The native map renders
  only map features as children. `Map.Controls` renders nothing in place and
  registers its buttons with the root (`setOverlay`), which draws them on an
  `absolute inset-0` layer beside the map with `pointerEvents="box-none"`, so a pan
  on empty space still reaches the map. Each group is a `Surface` of ghost
  `Button`s at `icon-sm`, each labelled by what it does.
- **The zoom buttons step the region, not the camera's zoom.** Apple's camera reports
  an altitude rather than a zoom, so halving the region's spans is the one step that
  means the same on both platforms.
- **Location comes through the map, not a location library.** `showLocate` and
  `Map.UserLocation` each request the native location layer (`showsUserLocation`),
  counted so it goes off when the last one lets go, and the position arrives through
  `onUserLocationChange`. No `expo-location`. A locate press before the first fix
  waits for it rather than flying nowhere, and flies in to at least zoom 14.
- **The heading cone is drawn because neither dot takes the theme.** `showsHeading`
  adds a cone in `primary` at 35%, turned to the device heading in screen space —
  which matches the map's north while the map does not rotate, the default. An
  unknown heading (`-1` on iOS) draws nothing rather than pointing north.
- **Light and dark follow Uniwind's theme, never the system's.** An app that lets a
  user force dark against a light system would otherwise put a white map in a dark
  screen. iOS takes `userInterfaceStyle`; Apple Maps accepts nothing finer.
- **Android's basemap is painted from tokens.** `buildAndroidMapStyle` puts water on
  `muted`, land on `background`, roads on `border` and labels on `muted-foreground`
  haloed in `background`, so a retuned theme retunes the map. Google's styler reads
  six-digit hex only, so an alpha byte is dropped; a token that does not resolve
  drops its rules rather than painting that feature black. A test pins every token
  it reads to both theme variants.
- **Routes and arcs are `primary` unless told otherwise, and opacity is alpha.** The
  native polyline takes a colour and no opacity, so `withAlpha` folds `opacity` into
  the colour — multiplying an alpha the token already has. A dashed route's dashes
  scale with its width, so they stay dashes at any weight.
- **An arc is a curve, not a great circle.** A quadratic Bézier in plain lng/lat,
  bowed left of travel by `curvature × length` at its apex. At the scale a connection
  is drawn the two read the same, and the bow is the caller's choice rather than the
  globe's. Its endpoints are the inputs, not recomputed, so a marker on either end
  sits exactly on the line. It does not take the short way across the antimeridian.
- **Rotation and tilt travel together, and both are off by default.** A map that
  turns but cannot be tilted flat again is one a reader gets lost in; a store finder
  wants north up. `isInteractive={false}` turns every gesture off, rotation included.
- **Camera moves honour reduced motion.** `resolveCameraDuration` jumps instead of
  flying when the system asks for less motion.
- **The map view is announced as "Map".** Markers carry their own
  `accessibilityLabel` and become buttons when they have an `onPress`; controls are
  labelled `Button`s.

## Scoped out of v1

- **GeoJSON fills, clustering, heatmaps, tile-source switching.** `Map.Route` covers
  polylines. Each of these is a feature `react-native-maps` exposes differently per
  platform, and none is needed to show places and paths.
- **A token-drawn vector basemap.** Apple Maps takes no style, so on iOS the basemap
  follows light and dark and nothing finer. A fully token-drawn map needs a different
  engine and a tile licence.
- **A hidden list of markers for screen readers.** Markers are reachable already.
- **Expo Go.** `react-native-maps` is a native module; the map needs a dev build.

## Platform setup

- **iOS** needs nothing for Apple Maps. A screen using `showLocate` or
  `Map.UserLocation` needs `NSLocationWhenInUseUsageDescription` in the app config.
- **Android** needs a Google Maps API key, set through the `react-native-maps`
  config plugin's `androidGoogleMapsApiKey`. Without one the map renders blank.
  The playground reads it from `GOOGLE_MAPS_ANDROID_API_KEY` at build time.
