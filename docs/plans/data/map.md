# Map — DATA-01-P7

> Read [README.md](README.md) § Conventions first, and root `AGENTS.md` § Dependency versions.
> Subpath `@delacour/react-native-ui/map`. The only Data component that adds a peer.

## Purpose on mobile

A themed map for showing places and paths — a store finder, a delivery route, a run. Markers are
React views; routes and arcs are lines; the map's light/dark follows the active theme. It is a
display component: no search, no geocoding, no turn-by-turn.

## Engine decision

`react-native-maps` — **bundled by Expo SDK 57 (`1.27.2`)**, so it goes in the root
`workspaces.catalog` at exactly that version and is referenced as `catalog:`. Declared an **optional
peer** of `@delacour/react-native-ui` (`peerDependenciesMeta.optional`) — an app that never imports
`/map` never resolves it. Add it to `apps/playground` (`expo install react-native-maps`), and to
`PACKAGE_INSTALL` in `packages/cli/src/registry/config.ts` as an `expo install` package.

- iOS: Apple Maps (no key). `userInterfaceStyle` follows Uniwind's active theme.
- Android: Google Maps — requires an API key in the consuming app's config; document it. Playground:
  configure via `app.config.ts` from an env var; if no key is available, Android demo shows a notice.
  `customMapStyle` built from theme tokens (water/land/roads/labels mapped to `muted`, `background`,
  `border`, `muted-foreground`) — pure `buildAndroidMapStyle(tokens)`.
- A fully token-drawn vector basemap (MapLibre) is **out of scope** — README open question 1.

## API

```tsx
const ref = useRef<MapHandle>(null);
<Map ref={ref} center={[174.776, -41.286]} zoom={12} onPress={(lngLat) => …}>
  <Map.Marker lngLat={[174.777, -41.288]} accessibilityLabel="Te Papa" onPress={…}>
    <Map.Pin />
    <Map.Label>Te Papa</Map.Label>
  </Map.Marker>
  <Map.Route coordinates={path} isDashed />
  <Map.Arc from={akl} to={wlg} curvature={0.2} />
  <Map.Popup lngLat={…} title="Cuba St">…</Map.Popup>
  <Map.Controls showZoom showRecenter showLocate />
  <Map.UserLocation />
</Map>
```

```ts
type LngLat = readonly [longitude: number, latitude: number];
type LngLatBounds = readonly [west: number, south: number, east: number, north: number];
type ViewState = { center: LngLat; zoom: number; bearing: number; pitch: number };
type MapProps = Omit<ViewProps, "children"> & {
  center?: LngLat; zoom?: number /* default 2 */; bearing?: number; pitch?: number;
  bounds?: LngLatBounds;                              // overrides center/zoom
  isRotatable?: boolean; isInteractive?: boolean;     // false / true
  onViewStateChange?: (s: ViewState) => void;
  onPress?: (lngLat: LngLat) => void;
  onReady?: () => void;
  className?: string; children?: ReactNode;
};
type MapHandle = {
  flyTo(o: { center: LngLat; zoom?: number; duration?: number }): void;
  fitBounds(b: LngLatBounds, o?: { padding?: number; duration?: number }): void;
  recenter(duration?: number): void;
  getViewState(): Promise<ViewState>;
};
MapMarkerProps: lngLat, anchor? "center"|"top"|"bottom"|"left"|"right", onPress?, accessibilityLabel?, className?, children?
MapPinProps: tone? "primary"|"default"|"destructive", size? "sm"|"md"
MapLabelProps: side? "top"|"bottom", size? "sm"|"md", tone? "default"|"muted"|"primary", className?, children
MapPopupProps: title?, lngLat? (required outside a Marker — discriminated union), className?, children
MapControlsProps: corner? (bottom-right), showZoom? (true), showLocate?, showCompass?, showRecenter?, onLocate?(lngLat), className?
MapRouteProps: coordinates: readonly LngLat[], color?, width? (3), isDashed?, opacity? (1)
MapArcProps: from, to, curvature? (0.2), color?, width? (2), opacity? (0.9)
MapUserLocationProps: showsHeading?
```

Props set the **initial** view only; moving the camera afterwards is the ref's job (`useMap()` gives
children the handle). Changing `center` after mount does not move the map — documented, and a dev
warning when it changes.

Scoped out of v1 (record in AGENTS.md): GeoJSON fills, clustering, heatmap, tile-source switching.
`Map.Route` covers polylines; `Map.Arc` is a great-circle-free quadratic curve sampled to a polyline.

## Behaviour

- `Map.Controls`, `Map.Popup` (when not anchored natively) float above the map as absolutely positioned
  `Surface`s; touches pass through empty space (`pointerEvents="box-none"`).
- `Map.Popup` inside a Marker uses the native `Callout`-free approach: rendered as an RN view above the
  marker (custom tooltip), so it themes.
- `showLocate` requests foreground location permission through `react-native-maps`' `showsUserLocation`
  and the `onUserLocationChange` event — **no** `expo-location` dependency.
- Colours from `useThemeColor` (`primary` default for Route/Arc/Pin).

## A11y

Markers: `accessibilityLabel`, button role when `onPress`. The map view itself labelled "Map". A
hidden-from-sight list of markers is **not** generated in v1 (scoped out; markers are already
reachable). Controls are labelled `Button`s.

## Reuses

`Button` + `Icon` (Controls), `Surface` (Popup/Label), `Text`, `useThemeColor`, Uniwind theme state
(see `use-navigation-theme` for how the active theme is read). New: `react-native-maps` (optional peer,
catalogued).

## Pure logic (`map.variants.ts`, `map-geometry.ts`)

`boundsToRegion(bounds)`, `centerZoomToRegion(center, zoom, aspect)`, `regionToViewState(region)`,
`arcCoordinates(from, to, curvature, samples)`, `boundsOf(coordinates)` (antimeridian-safe),
`buildAndroidMapStyle(tokens)`, `resolveMarkerAnchor(anchor)` → `{ x, y }`, slot classes.

## Playground demos

`places` (hero, capture), `route` (capture), `arcs` (capture), `popup`, `controls` (capture),
`fly-to` (buttons calling the ref), `dark` (theme follows). Demos must import only from the
library + react-native-maps (allowed: native peer).

## Docs page

`map.mdx`: overview, install (`npx expo install react-native-maps`, Android key, dev build only),
initial view vs ref, markers + labels + popups, routes and arcs, controls + user location, theming,
accessibility, API.

## Acceptance

- [ ] `react-native-maps` in root catalog at SDK version, optional peer, playground dep, `PACKAGE_INSTALL`
- [ ] Geometry resolvers tested (bounds/region round-trip, antimeridian, arc endpoints exact)
- [ ] iOS simulator: markers, route, arc, popup, controls, flyTo/fitBounds/recenter; dark theme follows
- [ ] No other component's import graph pulls `react-native-maps` (check `no-*`-style source test, as `no-gorhom.test.ts`)
- [ ] `bun --filter delacour run verify:expo` passes (or failure recorded with cause)
- [ ] Folder AGENTS.md, Components row, ITEM_META, gen-exports, registry:build, demos, docs, changeset
- [ ] `bun test`, `bun run typecheck`, `bun run check` green

## Build record (2026-10-05)

- iOS simulator verified by hand (agent-device): markers + labels, marker press, route, arc, popup open/close,
  controls (zoom in, recenter), `flyTo` / `fitBounds` / `recenter` with `onViewStateChange`, and the app's dark
  theme turning the basemap dark. Found and fixed there: Apple Maps skips `onRegionChangeComplete` after a long
  animated move, so handle moves now settle themselves (`resolveSettleDelay`).
- Not verified: Android (no Google Maps key on this machine), the locate button's permission flow.
- ~~Previews not captured.~~ Captured 2026-10-06 — see **Previews record** below.
- The planned `dark` demo became `tones` (pins in every tone); the basemap's theme is checked with the gallery's
  own theme toggle rather than a demo that flips the app theme.
- `bun --filter delacour run verify:expo` passes (map copied, `react-native-maps` expo-installed, app typechecks).

## Previews record (2026-10-06)

Six demos captured on the dev client (iPhone 17 Pro simulator), light and dark: 2 clips, 4 stills.

| Demo | Media | Flow |
| --- | --- | --- |
| `places` (hero) | clip | taps Gardens → Market → Museum by `-content` id, back to the opening selection |
| `popup` | clip | closes the café's card from its button and reopens it on the same pin |
| `route`, `arcs` | still | — |
| `controls`, `fly-to` | **still — clip not capturable** | — |

- **`controls` and `fly-to` cannot be clips yet.** Every camera move into a zoom level not yet drawn since launch
  paints Apple Maps' empty tile grid for about five frames (~170 ms) on the simulator. It reproduced in all 24
  takes (both demos, both themes, six tries each), measured per frame rather than off a contact sheet, which
  missed it. No demo or flow change avoids it: a zoom-out first, a shorter flight and warm network caches all
  still showed it. **Harness change needed:** run a flow once, unrecorded, before the recorded take, so
  the tiles for every view it reaches have been rendered. Until then both stay stills; the flows were written
  (`zoom-in ×2 → recenter`, `flyTo → recenter`) and are trivial to restore.
- **Library bug found by the popup clip, fixed:** an iOS annotation only ever grows, so a marker whose popup closed
  kept the card-sized frame and drew its pin up and left of its coordinate. `Map.Marker` now remounts on a shrink
  (`isMarkerShrink`).
- **`Map.Marker` repeats `testID` on its content as `-content`.** The native annotation is not in the tree a test
  runner walks, so flows could not select a marker.
- Switching the selection from one pin to another makes Apple Maps pan to keep the new annotation in view, which no
  flow can undo, so the popup clip closes and reopens one card instead.

