import {
	Camera,
	type CameraRef,
	type GeolocationPosition,
	LocationManager,
	Map as MapLibreMap,
	type MapRef,
	type PressEvent,
	type StyleSpecification,
	type ViewStateChangeEvent,
} from "@maplibre/maplibre-react-native";
import {
	Fragment,
	type ReactElement,
	type ReactNode,
	type Ref,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { type LayoutChangeEvent, type NativeSyntheticEvent, StyleSheet, View, type ViewProps } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useThemeColor } from "../../hooks/use-theme-color";
import { type MapContextValue, MapProvider, MapUserLocationProvider, type MapUserLocationValue } from "./map.context";
import type { LngLat, LngLatBounds, MapHandle, ViewState } from "./map.types";
import {
	buildMapStyle,
	hasInitialViewChanged,
	MAP_ACCESSIBILITY_LABEL,
	MAP_STYLE_TOKENS,
	type MapInitialView,
	mapVariants,
	resolveCameraDuration,
	resolveHeadingRotation,
	resolveInitialCamera,
	resolveMapGestures,
	toStyleColor,
} from "./map.variants";
import { MapArc } from "./map-arc";
import { MapControls } from "./map-controls";
import { fitBoundsCamera } from "./map-geometry";
import { MapLabel } from "./map-label";
import { MapMarker } from "./map-marker";
import { MapPin } from "./map-pin";
import { MapPopup } from "./map-popup";
import { MapRoute } from "./map-route";
import { MapUserLocation } from "./map-user-location";

export type MapProps = Omit<ViewProps, "children"> & {
	/** Where the map opens. Initial only — move it afterwards through the `ref`. */
	center?: LngLat;
	/** How far in it opens, on the web-map scale: 0 is the world, ~12 a city, ~16 a street. Defaults to `2`. */
	zoom?: number;
	/** Degrees clockwise from north it opens turned to. */
	bearing?: number;
	/** Degrees of tilt it opens at. */
	pitch?: number;
	/** A box to open framed on. Beats `center` and `zoom`. */
	bounds?: LngLatBounds;
	/** Whether two fingers turn and tilt the map. Defaults to `false`. */
	isRotatable?: boolean;
	/** Whether the map pans and zooms at all. Defaults to `true`. */
	isInteractive?: boolean;
	/**
	 * Replaces the theme-painted basemap — a style URL or a style object. Build
	 * one from the theme on your own tiles with `buildMapStyle`.
	 */
	mapStyle?: string | StyleSpecification;
	/** Called when the camera comes to rest. */
	onViewStateChange?: (viewState: ViewState) => void;
	/** Called with the coordinate under a tap on the map — not on a marker. */
	onPress?: (lngLat: LngLat) => void;
	/** Called once the native map has loaded. */
	onReady?: () => void;
	/** Moves the camera after mount. */
	ref?: Ref<MapHandle>;
	/** Sizes the map. Defaults to the full width and `h-72`. */
	className?: string;
	children?: ReactNode;
};

type Size = { width: number; height: number };
type CameraTarget = { center: LngLat; zoom: number };

/** How long a zoom control's step takes — quicker than a flight, because it is a nudge. */
const ZOOM_STEP_DURATION = 250;

/** The zoom a locate press flies in to at least — a street, not a country. */
const LOCATE_MIN_ZOOM = 14;

/** The inset `fitBounds` keeps clear when the caller names none, in points. */
const FIT_PADDING = 40;

/** Where the attribution button sits — the corner the controls leave free by default. */
const ATTRIBUTION_POSITION = { bottom: 8, left: 8 } as const;

function toViewState({ center, zoom, bearing, pitch }: ViewState): ViewState {
	return { bearing, center: [center[0], center[1]], pitch, zoom };
}

function MapRoot({
	center,
	zoom,
	bearing = 0,
	pitch = 0,
	bounds,
	isRotatable = false,
	isInteractive = true,
	mapStyle,
	onViewStateChange,
	onPress,
	onReady,
	ref,
	className,
	children,
	accessibilityLabel = MAP_ACCESSIBILITY_LABEL,
	...props
}: MapProps): ReactElement {
	const mapRef = useRef<MapRef>(null);
	const cameraRef = useRef<CameraRef>(null);
	const isReducedMotion = useReducedMotion();

	// The view the map mounted with, kept so a later prop change can be told
	// apart from a re-render and so `recenter` has somewhere to go back to.
	const [initialView] = useState<MapInitialView>(() => ({ bounds, center, zoom }));
	const [layout, setLayout] = useState<{ size: Size; initialCamera: CameraTarget } | null>(null);
	const sizeRef = useRef<Size>({ height: 0, width: 0 });
	const viewStateRef = useRef<ViewState | null>(null);
	const isReadyRef = useRef(false);

	const [locationRequests, setLocationRequests] = useState(0);
	const [userLocation, setUserLocation] = useState<MapUserLocationValue>({ heading: undefined, location: null });
	const userLocationRef = useRef<LngLat | null>(null);
	const pendingLocateRef = useRef<{ onLocate?: (lngLat: LngLat) => void } | null>(null);
	const [overlays, setOverlays] = useState<Readonly<Record<string, ReactNode>>>({});
	const onViewStateChangeRef = useRef(onViewStateChange);
	useEffect(() => {
		onViewStateChangeRef.current = onViewStateChange;
	}, [onViewStateChange]);

	const background = useThemeColor(MAP_STYLE_TOKENS.background);
	const border = useThemeColor(MAP_STYLE_TOKENS.border);
	const muted = useThemeColor(MAP_STYLE_TOKENS.muted);
	const mutedForeground = useThemeColor(MAP_STYLE_TOKENS.mutedForeground);
	const themedStyle = useMemo(
		() => buildMapStyle({ background, border, muted, mutedForeground }),
		[background, border, muted, mutedForeground]
	);

	useEffect(() => {
		if (__DEV__ && hasInitialViewChanged(initialView, { bounds, center, zoom })) {
			console.warn(
				"[DelacourUI.Map] `center`, `zoom` and `bounds` set the initial view only; changing them does not move the camera. Use the map's ref — flyTo, fitBounds — instead."
			);
		}
	}, [initialView, bounds, center, zoom]);

	const onLayout = (event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout;
		sizeRef.current = { height, width };
		if (width <= 0 || height <= 0) return;
		setLayout(
			(current) =>
				current ?? {
					initialCamera: resolveInitialCamera({ ...initialView, size: { height, width } }),
					size: { height, width },
				}
		);
		props.onLayout?.(event);
	};

	const currentZoom = useCallback(
		(): number => viewStateRef.current?.zoom ?? layout?.initialCamera.zoom ?? 0,
		[layout]
	);

	// Every move goes through here so reduced motion is honoured once. A jump
	// is a jump; anything else flies, which zooms out and back in over a long
	// distance instead of smearing the tiles in between.
	const moveCamera = useCallback(
		(target: CameraTarget & { bearing?: number; pitch?: number }, duration: number | undefined) => {
			const camera = cameraRef.current;
			if (camera === null) return;
			const resolved = resolveCameraDuration(duration, isReducedMotion);
			const center: [number, number] = [target.center[0], target.center[1]];
			const { zoom: nextZoom, bearing: nextBearing, pitch: nextPitch } = target;
			if (resolved === 0) {
				camera.jumpTo({ bearing: nextBearing, center, pitch: nextPitch, zoom: nextZoom });
			} else {
				camera.flyTo({ bearing: nextBearing, center, duration: resolved, pitch: nextPitch, zoom: nextZoom });
			}
		},
		[isReducedMotion]
	);

	const handle = useMemo<MapHandle>(
		() => ({
			flyTo({ center: target, zoom: targetZoom, duration }) {
				moveCamera({ center: target, zoom: targetZoom ?? currentZoom() }, duration);
			},
			fitBounds(box, options) {
				moveCamera(fitBoundsCamera(box, sizeRef.current, options?.padding ?? FIT_PADDING), options?.duration);
			},
			recenter(duration) {
				if (layout !== null) moveCamera({ ...layout.initialCamera, bearing, pitch }, duration);
			},
			async getViewState() {
				const viewState = await mapRef.current?.getViewState();
				if (viewState !== undefined) return toViewState(viewState);
				const fallback = layout?.initialCamera ?? { center: [0, 0], zoom: 0 };
				return { bearing, center: fallback.center, pitch, zoom: fallback.zoom };
			},
		}),
		[bearing, currentZoom, layout, moveCamera, pitch]
	);

	useImperativeHandle(ref, () => handle, [handle]);

	const flyToUser = useCallback(
		(location: LngLat, onLocate?: (lngLat: LngLat) => void) => {
			handle.flyTo({ center: location, zoom: Math.max(currentZoom(), LOCATE_MIN_ZOOM) });
			onLocate?.(location);
		},
		[currentZoom, handle]
	);

	// The location layer is on while any part asks for it. Positions come from
	// MapLibre's own location manager, so the map adds no location library.
	const isLocating = locationRequests > 0;
	useEffect(() => {
		if (!isLocating) return;
		let isCurrent = true;
		const onPosition = ({ coords }: GeolocationPosition) => {
			const location: LngLat = [coords.longitude, coords.latitude];
			userLocationRef.current = location;
			setUserLocation({ heading: resolveHeadingRotation(coords.heading ?? undefined), location });

			const pending = pendingLocateRef.current;
			if (pending !== null) {
				pendingLocateRef.current = null;
				flyToUser(location, pending.onLocate);
			}
		};
		LocationManager.requestPermissions()
			.then((isGranted) => {
				if (isGranted && isCurrent) LocationManager.addListener(onPosition);
			})
			.catch(() => undefined);
		return () => {
			isCurrent = false;
			LocationManager.removeListener(onPosition);
		};
	}, [flyToUser, isLocating]);

	const context = useMemo<MapContextValue>(
		() => ({
			handle,
			zoomBy(delta) {
				const target = currentZoom() + delta;
				// Stepping again before the last step lands should step from where it
				// is going, not from where it was.
				const viewState = viewStateRef.current;
				if (viewState !== null) viewStateRef.current = { ...viewState, zoom: target };
				cameraRef.current?.zoomTo(target, { duration: resolveCameraDuration(ZOOM_STEP_DURATION, isReducedMotion) });
			},
			resetBearing() {
				cameraRef.current
					?.setStop({
						bearing: 0,
						duration: resolveCameraDuration(undefined, isReducedMotion),
						easing: "ease",
						pitch: 0,
					})
					.catch(() => undefined);
			},
			requestUserLocation() {
				setLocationRequests((count) => count + 1);
				return () => setLocationRequests((count) => count - 1);
			},
			locate(onLocate) {
				const location = userLocationRef.current;
				if (location === null) {
					pendingLocateRef.current = { onLocate };
					return;
				}
				flyToUser(location, onLocate);
			},
			setOverlay(id, node) {
				setOverlays((current) => {
					if (node === null) {
						const { [id]: _removed, ...rest } = current;
						return rest;
					}
					return { ...current, [id]: node };
				});
			},
		}),
		[currentZoom, flyToUser, handle, isReducedMotion]
	);

	// A style reload — the theme changed — finishes loading the map again; the
	// caller hears about the first load only.
	const onDidFinishLoadingMap = () => {
		if (isReadyRef.current) return;
		isReadyRef.current = true;
		onReady?.();
	};

	const onRegionDidChange = (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
		const viewState = toViewState(event.nativeEvent);
		viewStateRef.current = viewState;
		onViewStateChangeRef.current?.(viewState);
	};

	const onMapPress = (event: NativeSyntheticEvent<PressEvent>) => {
		const [longitude, latitude] = event.nativeEvent.lngLat;
		onPress?.([longitude, latitude]);
	};

	const slots = mapVariants();

	// The native view takes no className, so the root is a plain view the map
	// fills edge to edge. The map mounts once the root has been measured: a
	// `bounds` opening is a centre and zoom worked out for the view's size, and
	// one guessed before layout would open at the wrong zoom. Parts drawn in
	// screen space render on the overlay layer above it, whose empty space
	// passes touches through.
	return (
		<View className={slots.root({ className })} {...props} onLayout={onLayout}>
			{layout === null ? null : (
				<MapProvider value={context}>
					<MapUserLocationProvider value={userLocation}>
						<MapLibreMap
							accessibilityLabel={accessibilityLabel}
							attribution
							attributionPosition={ATTRIBUTION_POSITION}
							compass={false}
							logo={false}
							mapStyle={mapStyle ?? themedStyle}
							onDidFinishLoadingMap={onDidFinishLoadingMap}
							onPress={onPress === undefined ? undefined : onMapPress}
							onRegionDidChange={onRegionDidChange}
							ref={mapRef}
							style={StyleSheet.absoluteFill}
							tintColor={toStyleColor(mutedForeground)}
							{...resolveMapGestures({ isInteractive, isRotatable })}
						>
							<Camera
								initialViewState={{
									bearing,
									center: [layout.initialCamera.center[0], layout.initialCamera.center[1]],
									pitch,
									zoom: layout.initialCamera.zoom,
								}}
								ref={cameraRef}
							/>
							{children}
						</MapLibreMap>
						<View className={slots.overlay()} pointerEvents="box-none">
							{Object.entries(overlays).map(([id, node]) => (
								<Fragment key={id}>{node}</Fragment>
							))}
						</View>
					</MapUserLocationProvider>
				</MapProvider>
			)}
		</View>
	);
}

/**
 * A themed map for showing places and paths — a store finder, a delivery
 * route, a run.
 *
 * MapLibre on both platforms, drawing OpenStreetMap vector tiles in a basemap
 * painted from the theme's tokens — retune the theme and the map follows, light
 * and dark included, and never the system's appearance over the app's. Markers
 * are React views; routes and arcs are lines in the theme's primary.
 *
 * `center`, `zoom` and `bounds` set the **initial** view only. Moving the camera
 * afterwards is the `ref`'s job — `flyTo`, `fitBounds`, `recenter` — and
 * `useMap()` hands the same handle to anything inside.
 *
 * A display component: no search, no geocoding, no directions.
 *
 * @example
 * const ref = useRef<MapHandle>(null);
 *
 * <Map center={[174.776, -41.286]} ref={ref} zoom={13}>
 *   <Map.Marker accessibilityLabel="Te Papa" lngLat={[174.782, -41.29]}>
 *     <Map.Pin />
 *     <Map.Label>Te Papa</Map.Label>
 *   </Map.Marker>
 *   <Map.Route coordinates={walk} isDashed />
 *   <Map.Controls showRecenter />
 * </Map>
 *
 * @example
 * <Map bounds={[166, -47.5, 179, -34]} isInteractive={false}>
 *   <Map.Arc from={auckland} to={wellington} />
 * </Map>
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: the component is a map; consumers import it by name from its own subpath
export const Map = Object.assign(MapRoot, {
	/** A React view pinned to a coordinate. Anchors on its `Map.Pin`'s tip when it has one. */
	Marker: MapMarker,
	/** A teardrop pin in a theme colour, its tip on the marker's coordinate. */
	Pin: MapPin,
	/** A pill of text beside a pin. */
	Label: MapLabel,
	/** A card over a marker, or over a coordinate of its own. */
	Popup: MapPopup,
	/** Zoom, locate, compass and recenter buttons, floated in a corner. */
	Controls: MapControls,
	/** A line through a list of coordinates — a route, a run, a boundary. */
	Route: MapRoute,
	/** A curve from one point to another, for a connection rather than a path. */
	Arc: MapArc,
	/** The device's own position, as the platform's location dot. */
	UserLocation: MapUserLocation,
	displayName: "DelacourUI.Map",
});
