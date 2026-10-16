# Map

A themed map for showing places and paths — a store finder, a delivery route, a
run. MapLibre on both platforms, through `@maplibre/maplibre-react-native`, on a
basemap painted from the theme's tokens.
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
| `map-route.tsx` | `Map.Route` — a GeoJSON source and a line layer |
| `map-arc.tsx` | `Map.Arc` — a sampled quadratic curve, drawn the same way |
| `map-user-location.tsx` | `Map.UserLocation` — a themed dot drawn as circle layers, plus a heading cone |
| `map.context.tsx` | `MapProvider`, `useMap()`, `useMapContext()`, `useMapPart()`, the user-location and marker contexts |
| `map.types.ts` | `LngLat`, `LngLatBounds`, `ViewState`, `MapHandle` — no RN imports |
| `map-geometry.ts` | `fitBoundsCamera`, `boundsOf`, `arcCoordinates`, `normalizeLongitude` — pure |
| `map-geometry.test.ts` | |
| `map.variants.ts` | The slotted `tv()`, the axes, the pin outline, anchors, the themed basemap style — type imports only |
| `map.variants.test.ts` | |

`src/no-maplibre.test.ts`, one level up, holds the import-graph rule below.

## Design

- **`@maplibre/maplibre-react-native` is an optional peer, and only this folder may
  import it.** It is the one native module the library adds for a single component.
  Expo does not bundle it, so it is not in the root catalog; each workspace that
  needs it repeats the range. An app that never imports `/map` never installs it —
  but only while nothing else reaches it, so `src/no-maplibre.test.ts` reads the
  whole tree as text and fails by file name for any import of an `@maplibre/`
  package, or of this folder, from outside it. Types come from the RN package's
  own re-exports, never `@maplibre/maplibre-gl-style-spec`, which is only a
  transitive dependency.
- **MapLibre over the platform maps.** Apple Maps takes no style beyond light and
  dark, and Google Maps needs a key and styles Android alone. MapLibre draws the
  same vector basemap on both, from a style this folder writes, so a retuned theme
  retunes the map on both platforms.
- **Coordinates are `[lng, lat]`, everywhere a caller sees one.** That is GeoJSON's
  order, every web map library's, and MapLibre's, so nothing is converted. The
  public types are `readonly`; MapLibre's are mutable, so a coordinate is copied
  into a fresh tuple at the boundary.
- **Props set the initial view only; the ref moves the camera.** A map that
  re-centred on every `center` change would fight a user mid-pan the first time a
  parent re-rendered with a new array. The view is captured on mount; a change to
  `center`, `zoom` or `bounds` afterwards warns in development
  (`hasInitialViewChanged`, compared by value so a fresh array is not a change).
  `flyTo`, `fitBounds`, `recenter` and `getViewState` are on the `ref`, and
  `useMap()` hands the same handle to anything inside. The handle drives a
  MapLibre `Camera` — `flyTo` for a move, `jumpTo` when the duration is `0`.
- **The map mounts after its root is measured.** A `bounds` opening is a centre and
  zoom worked out for the view's size (`resolveInitialCamera`), and one guessed
  before layout opens at the wrong zoom. The root paints `bg-muted` for that one
  frame.
- **Zoom is the web-map scale.** `0` is the world and each step halves it, on
  MapLibre's 512-point tiles, so a zoom copied from a web map means the same here.
- **Bounds are framed here, not by the native fit, and are antimeridian-safe.** A
  box with `west > east` crosses 180°; a fit that takes corners frames it the long
  way round the world. `fitBoundsCamera` measures the box eastwards and in Web
  Mercator, and returns a centre and zoom for the camera, so `fitBounds` and a
  `bounds` opening are the same sum. `boundsOf` picks the box that leaves out the
  widest stretch of longitude no point touches, so three stops across Fiji are a
  box a few degrees wide rather than one spanning the world.
- **A marker anchors on its pin's tip.** `Map.Pin` reports its frame inside the
  marker and `resolvePinTipAnchor` turns it into an anchor point, so a popup over
  the pin or a label under it changes the marker's size without moving the place
  it marks. MapLibre takes a named anchor and a pixel offset rather than a point,
  so the marker is anchored at its centre and moved by `resolveMarkerOffset`. An
  explicit `anchor` wins; a marker with no pin anchors on its centre. The pin must
  be a direct child for its frame to be relative to the marker.
- **A marker's `testID` is repeated on its content, suffixed `-content`.** The
  native annotation the `testID` lands on is not always in the view hierarchy a
  test runner walks; `map-places-museum-content` is the marker's own view, which
  the runner can find and tap.
- **A marker's press is its own.** It stops propagation, so a tap on a marker does
  not also reach the map's `onPress`; a route's press does the same through its
  source.
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
- **The zoom buttons step from where the camera is going.** The zoom is read from
  the last `onRegionDidChange`; a press writes its target back at once, so a second
  press before the first lands steps on from it rather than repeating it.
- **Location comes through the map, not a location library.** `showLocate` and
  `Map.UserLocation` each request location updates, counted so they stop when the
  last one lets go, and MapLibre's `LocationManager` asks for permission and
  delivers the position. No `expo-location`. A locate press before the first fix
  waits for it rather than flying nowhere, and flies in to at least zoom 14.
- **The location dot is drawn, so it takes the theme.** Two circle layers — a
  `background` ring and a `primary` dot — rather than MapLibre's own puck, whose
  colours are fixed. `showsHeading` adds a cone in `primary` at 35%, turned to the
  device heading in screen space, which matches the map's north while the map does
  not rotate, the default. An unknown heading draws nothing rather than pointing
  north.
- **The basemap is painted from tokens.** `buildMapStyle` puts land on
  `background`, water and green space on `muted`, roads, buildings and boundaries
  on `border`, and labels on `muted-foreground` haloed in `background`. MapLibre
  parses three- and six-digit hex but not eight, so `toStyleColor` writes an alpha
  token as `rgba()`. A token that does not resolve drops the layers it paints
  rather than leaving them in MapLibre's default black. A test pins every token it
  reads to both theme variants. Light and dark follow Uniwind's theme, never the
  system's, because the style is the theme.
- **The tiles are OpenFreeMap's, and the attribution stays.** OpenMapTiles-schema
  vector tiles of OpenStreetMap, free and keyless (`MAP_DEFAULT_BASEMAP`). The data
  is ODbL, so MapLibre's attribution button is on, bottom left — the corner the
  controls leave free by default. `buildMapStyle` takes another OpenMapTiles source
  and glyph server; `mapStyle` takes any style at all.
- **Routes and arcs are layers, `primary` unless told otherwise.** A GeoJSON source
  and a line layer each, keyed by `useId`, so they sit over the basemap and under
  every marker. `opacity` is the layer's own `line-opacity`. A dashed route's
  dashes are `[2, 2]` — MapLibre measures dashes in line widths, so they stay
  dashes at any weight. A route with `onPress` gets a 12-point hitbox; a 3-point
  line is otherwise a hard target.
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

- **GeoJSON fills, clustering, heatmaps.** `Map.Route` covers polylines. MapLibre
  does all three as layers, so each is a later part rather than a different engine.
- **Offline packs.** MapLibre's `OfflineManager` can download a region; nothing here
  needs one yet.
- **A hidden list of markers for screen readers.** Markers are reachable already.
- **Expo Go.** MapLibre is a native module; the map needs a dev build.

## Platform setup

- **Both platforms** need the config plugin — `"@maplibre/maplibre-react-native"` in
  the app config's `plugins` — and a rebuilt dev client. No API key.
- **iOS** needs `NSLocationWhenInUseUsageDescription` in the app config for a screen
  using `showLocate` or `Map.UserLocation`.
- **Android** gets its location permissions from MapLibre's own manifest.
