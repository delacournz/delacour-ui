import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { LngLat, MapHandle } from "./map.types";

export type MapContextValue = {
	/** Moves the camera — the same handle a `ref` on `<Map>` receives. */
	handle: MapHandle;
	/** Zooms by whole steps of the tile pyramid; negative zooms out. */
	zoomBy(delta: number): void;
	/** Turns the map back to north-up and flat. */
	resetBearing(): void;
	/**
	 * Turns the native user-location layer on while a part needs it. Returns
	 * the release; the layer goes off when the last part lets go.
	 */
	requestUserLocation(): () => void;
	/**
	 * Flies to the device's location, then calls back with it. Before the first
	 * fix arrives the flight waits for it rather than going nowhere.
	 */
	locate(onLocate?: (lngLat: LngLat) => void): void;
	/**
	 * Puts a floating part on the layer above the map, keyed by `id`; `null`
	 * takes it off. The native map renders only map features as children, so a
	 * part drawn in screen space — the controls — has to live beside it.
	 */
	setOverlay(id: string, node: ReactNode | null): void;
};

const MapContext = createContext<MapContextValue | null>(null);

/**
 * Supplies the enclosing map's camera and location controls to its subtree.
 *
 * Lives in its own module, importing nothing but types, so a part the map
 * renders can read it without importing `./map` and closing a cycle through
 * `map.tsx`. See AGENTS.md rule 3.
 */
export function MapProvider({ value, children }: { value: MapContextValue; children: ReactNode }): ReactElement {
	return <MapContext value={value}>{children}</MapContext>;
}
MapProvider.displayName = "DelacourUI.Map.Provider";

/** The enclosing map's context, or null outside a `<Map>`. */
export function useMapContext(): MapContextValue | null {
	return use(MapContext);
}

/**
 * The enclosing map's camera handle — `flyTo`, `fitBounds`, `recenter`,
 * `getViewState`. What a custom control inside `<Map>` uses to move it. Throws
 * outside a `<Map>`.
 */
export function useMap(): MapHandle {
	const context = useMapContext();
	if (!context) {
		throw new Error("useMap must be called inside a <Map>.");
	}
	return context.handle;
}

/**
 * The enclosing map's context, for a compound part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`. A caller outside the
 * library wants {@link useMap}, whose error message names the hook rather than
 * a part.
 */
export function useMapPart(component: string): MapContextValue {
	const context = useMapContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Map>.`);
	}
	return context;
}

export type MapUserLocationValue = {
	/** The device's last reported position, or null before the first fix. */
	location: LngLat | null;
	/** Degrees clockwise from north, or undefined when the device does not know. */
	heading: number | undefined;
};

const MapUserLocationContext = createContext<MapUserLocationValue>({ heading: undefined, location: null });

/**
 * Supplies the device's position. Separate from the map's own context so a
 * location tick re-renders the parts that draw it and nothing else.
 */
export function MapUserLocationProvider({
	value,
	children,
}: {
	value: MapUserLocationValue;
	children: ReactNode;
}): ReactElement {
	return <MapUserLocationContext value={value}>{children}</MapUserLocationContext>;
}
MapUserLocationProvider.displayName = "DelacourUI.Map.UserLocation.Provider";

/** The device's last reported position and heading, while a part has the location layer on. */
export function useMapUserLocation(): MapUserLocationValue {
	return use(MapUserLocationContext);
}

/** Where a part sits inside its marker, in the marker's own points. */
export type MapMarkerFrame = { x: number; y: number; width: number; height: number };

export type MapMarkerContextValue = {
	/** A pin reports its frame so the marker can anchor on the pin's tip. `null` on unmount. */
	reportPin(frame: MapMarkerFrame | null): void;
};

const MapMarkerContext = createContext<MapMarkerContextValue | null>(null);

/** Tells the parts inside a marker that they are inside one, and lets a pin report where it sits. */
export function MapMarkerProvider({
	value,
	children,
}: {
	value: MapMarkerContextValue;
	children: ReactNode;
}): ReactElement {
	return <MapMarkerContext value={value}>{children}</MapMarkerContext>;
}
MapMarkerProvider.displayName = "DelacourUI.Map.Marker.Provider";

/** The enclosing marker, or null outside one. */
export function useMapMarkerContext(): MapMarkerContextValue | null {
	return use(MapMarkerContext);
}
