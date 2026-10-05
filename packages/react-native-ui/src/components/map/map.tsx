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
import { type LayoutChangeEvent, Platform, StyleSheet, View, type ViewProps } from "react-native";
import MapView, { type MapPressEvent, type Region, type UserLocationChangeEvent } from "react-native-maps";
import { useReducedMotion } from "react-native-reanimated";
import { useUniwind } from "uniwind";
import { useThemeColor } from "../../hooks/use-theme-color";
import { type MapContextValue, MapProvider, MapUserLocationProvider, type MapUserLocationValue } from "./map.context";
import type { LngLat, LngLatBounds, MapHandle, MapRegion, ViewState } from "./map.types";
import {
	ANDROID_MAP_STYLE_TOKENS,
	buildAndroidMapStyle,
	hasInitialViewChanged,
	MAP_ACCESSIBILITY_LABEL,
	type MapInitialView,
	mapVariants,
	resolveCameraDuration,
	resolveInitialRegion,
	resolveMapGestures,
	resolveSettleDelay,
	resolveUserInterfaceStyle,
} from "./map.variants";
import { MapArc } from "./map-arc";
import { MapControls } from "./map-controls";
import {
	boundsToRegion,
	centerZoomToRegion,
	latLngToLngLat,
	longitudeDeltaToZoom,
	padRegion,
	regionToViewState,
} from "./map-geometry";
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

/** How long a zoom control's step takes — quicker than a flight, because it is a nudge. */
const ZOOM_STEP_DURATION = 250;

/** The zoom a locate press flies in to at least — a street, not a country. */
const LOCATE_MIN_ZOOM = 14;

/** The inset `fitBounds` keeps clear when the caller names none, in points. */
const FIT_PADDING = 40;

function MapRoot({
	center,
	zoom,
	bearing = 0,
	pitch = 0,
	bounds,
	isRotatable = false,
	isInteractive = true,
	onViewStateChange,
	onPress,
	onReady,
	ref,
	className,
	children,
	accessibilityLabel = MAP_ACCESSIBILITY_LABEL,
	...props
}: MapProps): ReactElement {
	const mapRef = useRef<MapView>(null);
	const isReducedMotion = useReducedMotion();
	const { theme } = useUniwind();

	// The view the map mounted with, kept so a later prop change can be told
	// apart from a re-render and so `recenter` has somewhere to go back to.
	const [initialView] = useState<MapInitialView>(() => ({ bounds, center, zoom }));
	const [layout, setLayout] = useState<{ size: Size; initialRegion: MapRegion } | null>(null);
	const sizeRef = useRef<Size>({ height: 0, width: 0 });
	const regionRef = useRef<MapRegion | null>(null);

	const [locationRequests, setLocationRequests] = useState(0);
	const [userLocation, setUserLocation] = useState<MapUserLocationValue>({ heading: undefined, location: null });
	const userLocationRef = useRef<LngLat | null>(null);
	const pendingLocateRef = useRef<{ onLocate?: (lngLat: LngLat) => void } | null>(null);
	const [overlays, setOverlays] = useState<Readonly<Record<string, ReactNode>>>({});
	const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const onViewStateChangeRef = useRef(onViewStateChange);
	useEffect(() => {
		onViewStateChangeRef.current = onViewStateChange;
	}, [onViewStateChange]);

	const background = useThemeColor(ANDROID_MAP_STYLE_TOKENS.background);
	const border = useThemeColor(ANDROID_MAP_STYLE_TOKENS.border);
	const muted = useThemeColor(ANDROID_MAP_STYLE_TOKENS.muted);
	const mutedForeground = useThemeColor(ANDROID_MAP_STYLE_TOKENS.mutedForeground);
	const customMapStyle = useMemo(
		() =>
			Platform.OS === "android" ? buildAndroidMapStyle({ background, border, muted, mutedForeground }) : undefined,
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
					initialRegion: resolveInitialRegion({ ...initialView, aspect: width / height }),
					size: { height, width },
				}
		);
		props.onLayout?.(event);
	};

	const cancelSettle = useCallback(() => {
		if (settleRef.current !== null) clearTimeout(settleRef.current);
		settleRef.current = null;
	}, []);

	useEffect(() => cancelSettle, [cancelSettle]);

	// Reports a view the camera came to rest on: the region the zoom buttons
	// step from, and the caller's `onViewStateChange`. The camera's own centre
	// and zoom win over the region's where the platform reports them.
	const settle = useCallback((region: MapRegion) => {
		regionRef.current = region;
		const report = onViewStateChangeRef.current;
		if (report === undefined) return;
		mapRef.current
			?.getCamera()
			.then((camera) => report(regionToViewState(region, camera)))
			.catch(() => report(regionToViewState(region)));
	}, []);

	// Apple Maps does not always report the end of a long animated move, which
	// left `onViewStateChange` and the zoom buttons on the view before it. A move
	// made here therefore settles itself once it should have landed, unless the
	// native event arrives first and cancels it.
	const animateToRegion = useCallback(
		(region: MapRegion, duration: number | undefined) => {
			const resolved = resolveCameraDuration(duration, isReducedMotion);
			mapRef.current?.animateToRegion(region, resolved);
			cancelSettle();
			settleRef.current = setTimeout(() => {
				settleRef.current = null;
				settle(region);
			}, resolveSettleDelay(resolved));
		},
		[cancelSettle, isReducedMotion, settle]
	);

	const currentRegion = useCallback(
		(): MapRegion | null => regionRef.current ?? layout?.initialRegion ?? null,
		[layout]
	);

	const handle = useMemo<MapHandle>(
		() => ({
			flyTo({ center: target, zoom: targetZoom, duration }) {
				const { width, height } = sizeRef.current;
				const region = currentRegion();
				const nextZoom =
					targetZoom ?? (region === null ? (initialView.zoom ?? 2) : longitudeDeltaToZoom(region.longitudeDelta));
				animateToRegion(centerZoomToRegion(target, nextZoom, height > 0 ? width / height : 1), duration);
			},
			fitBounds(box, options) {
				animateToRegion(
					padRegion(boundsToRegion(box), options?.padding ?? FIT_PADDING, sizeRef.current),
					options?.duration
				);
			},
			recenter(duration) {
				if (layout !== null) animateToRegion(layout.initialRegion, duration);
			},
			async getViewState() {
				const camera = await mapRef.current?.getCamera();
				const region = currentRegion() ?? centerZoomToRegion([0, 0], 2, 1);
				if (camera === undefined) return regionToViewState(region);
				return regionToViewState({ ...region, ...camera.center }, camera);
			},
		}),
		[animateToRegion, currentRegion, initialView, layout]
	);

	useImperativeHandle(ref, () => handle, [handle]);

	const flyToUser = useCallback(
		(location: LngLat, onLocate?: (lngLat: LngLat) => void) => {
			const region = currentRegion();
			const zoomNow = region === null ? 0 : longitudeDeltaToZoom(region.longitudeDelta);
			handle.flyTo({ center: location, zoom: Math.max(zoomNow, LOCATE_MIN_ZOOM) });
			onLocate?.(location);
		},
		[currentRegion, handle]
	);

	const context = useMemo<MapContextValue>(
		() => ({
			handle,
			zoomBy(delta) {
				const region = currentRegion();
				if (region === null) return;
				const scale = 2 ** delta;
				animateToRegion(
					{ ...region, latitudeDelta: region.latitudeDelta / scale, longitudeDelta: region.longitudeDelta / scale },
					ZOOM_STEP_DURATION
				);
			},
			resetBearing() {
				mapRef.current?.animateCamera(
					{ heading: 0, pitch: 0 },
					{ duration: resolveCameraDuration(undefined, isReducedMotion) }
				);
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
		[animateToRegion, currentRegion, flyToUser, handle, isReducedMotion]
	);

	const onMapReady = () => {
		if (bearing !== 0 || pitch !== 0) {
			mapRef.current?.animateCamera({ heading: bearing, pitch }, { duration: 0 });
		}
		onReady?.();
	};

	const onRegionChangeComplete = (region: Region) => {
		cancelSettle();
		settle(region);
	};

	// Android reports a tap on a marker to the map as well; that tap belongs to
	// the marker.
	const onMapPress = (event: MapPressEvent) => {
		if (event.nativeEvent.action === "marker-press") return;
		onPress?.(latLngToLngLat(event.nativeEvent.coordinate));
	};

	const onUserLocationChange = (event: UserLocationChangeEvent) => {
		const coordinate = event.nativeEvent.coordinate;
		if (coordinate === undefined) return;
		const location = latLngToLngLat(coordinate);
		userLocationRef.current = location;
		setUserLocation({ heading: coordinate.heading, location });

		const pending = pendingLocateRef.current;
		if (pending !== null) {
			pendingLocateRef.current = null;
			flyToUser(location, pending.onLocate);
		}
	};

	const slots = mapVariants();

	// The native view takes no className, so the root is a plain view the map
	// fills edge to edge. The map mounts once the root has been measured: the
	// opening region depends on the view's aspect, and a region guessed before
	// layout would open at the wrong zoom. Parts render on the overlay layer
	// above it, whose empty space passes touches through.
	return (
		<View className={slots.root({ className })} {...props} onLayout={onLayout}>
			{layout === null ? null : (
				<MapProvider value={context}>
					<MapUserLocationProvider value={userLocation}>
						<MapView
							accessibilityLabel={accessibilityLabel}
							customMapStyle={customMapStyle}
							initialRegion={layout.initialRegion}
							onMapReady={onMapReady}
							onPress={onPress === undefined ? undefined : onMapPress}
							onRegionChangeComplete={onRegionChangeComplete}
							onUserLocationChange={locationRequests > 0 ? onUserLocationChange : undefined}
							ref={mapRef}
							showsCompass={false}
							showsMyLocationButton={false}
							showsUserLocation={locationRequests > 0}
							style={StyleSheet.absoluteFill}
							toolbarEnabled={false}
							userInterfaceStyle={resolveUserInterfaceStyle(theme)}
							{...resolveMapGestures({ isInteractive, isRotatable })}
						>
							{children}
						</MapView>
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
 * Apple Maps on iOS, Google Maps on Android, both through `react-native-maps`.
 * Light and dark follow the app's active theme rather than the system's, and on
 * Android the basemap itself is painted from the theme's tokens. Markers are
 * React views; routes and arcs are lines in the theme's primary.
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
