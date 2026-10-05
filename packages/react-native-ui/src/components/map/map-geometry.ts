import type { LngLat, LngLatBounds, MapRegion, ViewState } from "./map.types";

/**
 * The widest span a region asks for. A full 360° is the same longitude at both
 * edges, which the native maps read as a span of nothing and answer by zooming
 * all the way in.
 */
export const MAP_MAX_LONGITUDE_DELTA = 359;

/** Short of the poles, where Web Mercator runs to infinity. */
const MAX_LATITUDE_DELTA = 170;

const DEG = Math.PI / 180;

/** A longitude in `[-180, 180)`, however many turns it took to get there. */
export function normalizeLongitude(longitude: number): number {
	if (longitude >= -180 && longitude < 180) return longitude;
	return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

/** `[lng, lat]` → `react-native-maps`' `{ latitude, longitude }`. */
export function lngLatToLatLng([longitude, latitude]: LngLat): { latitude: number; longitude: number } {
	return { latitude, longitude };
}

/** `react-native-maps`' `{ latitude, longitude }` → `[lng, lat]`. */
export function latLngToLngLat({ latitude, longitude }: { latitude: number; longitude: number }): LngLat {
	return [longitude, latitude];
}

/**
 * The degrees of longitude across the view at a zoom. Zoom 0 is the whole
 * world; each step halves it — the tile pyramid every web map shares, so a
 * zoom copied from one means the same thing here.
 */
export function zoomToLongitudeDelta(zoom: number): number {
	return 360 / 2 ** zoom;
}

/** The inverse of {@link zoomToLongitudeDelta}, never below zoom 0. */
export function longitudeDeltaToZoom(longitudeDelta: number): number {
	return Math.max(0, Math.log2(360 / longitudeDelta));
}

function mercatorY(latitude: number): number {
	return Math.log(Math.tan(Math.PI / 4 + (latitude * DEG) / 2));
}

function latitudeOfMercatorY(y: number): number {
	return (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / DEG;
}

/**
 * The region a centre and zoom show in a view of a given aspect (width over
 * height).
 *
 * The latitude span is projected rather than copied from the longitude's: on
 * Web Mercator a degree of latitude grows towards the poles, so Wellington at
 * a given zoom shows about three quarters as many degrees north to south as it
 * does east to west. Copying the longitude span would zoom a high-latitude map
 * out further than asked. An unmeasured aspect is read as square.
 */
export function centerZoomToRegion(center: LngLat, zoom: number, aspect: number): MapRegion {
	const ratio = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
	const longitudeDelta = Math.min(MAP_MAX_LONGITUDE_DELTA, zoomToLongitudeDelta(zoom));
	const [longitude, latitude] = center;

	const halfSpanY = (longitudeDelta * DEG) / ratio / 2;
	const y = mercatorY(latitude);
	const latitudeDelta = latitudeOfMercatorY(y + halfSpanY) - latitudeOfMercatorY(y - halfSpanY);

	return { latitude, longitude, latitudeDelta: Math.min(MAX_LATITUDE_DELTA, latitudeDelta), longitudeDelta };
}

/**
 * Where a region puts the camera. The zoom is the camera's own when the
 * platform reports one (Google Maps does; Apple Maps reports an altitude
 * instead), else it is read off the region's longitude span.
 */
export function regionToViewState(
	region: MapRegion,
	camera?: { heading: number; pitch: number; zoom?: number }
): ViewState {
	return {
		bearing: camera?.heading ?? 0,
		center: [region.longitude, region.latitude],
		pitch: camera?.pitch ?? 0,
		zoom: camera?.zoom ?? longitudeDeltaToZoom(region.longitudeDelta),
	};
}

/**
 * The region a box covers. A box with `west > east` crosses the antimeridian,
 * so its span is measured eastwards across 180° and its centre lands in the
 * Pacific rather than at Greenwich.
 */
export function boundsToRegion([west, south, east, north]: LngLatBounds): MapRegion {
	const longitudeDelta = west <= east ? east - west : east + 360 - west;

	return {
		latitude: (south + north) / 2,
		latitudeDelta: north - south,
		longitude: normalizeLongitude(west + longitudeDelta / 2),
		longitudeDelta,
	};
}

/** The box a region covers — the inverse of {@link boundsToRegion}. */
export function regionToBounds({ latitude, longitude, latitudeDelta, longitudeDelta }: MapRegion): LngLatBounds {
	return [
		normalizeLongitude(longitude - longitudeDelta / 2),
		latitude - latitudeDelta / 2,
		normalizeLongitude(longitude + longitudeDelta / 2),
		latitude + latitudeDelta / 2,
	];
}

/**
 * The smallest box holding every point, `undefined` for none.
 *
 * Antimeridian-safe: the box is the one that leaves out the widest stretch of
 * longitude no point touches. Three stops across Fiji either side of 180° are a
 * box a few degrees wide, not one spanning the whole world the long way round.
 */
export function boundsOf(coordinates: readonly LngLat[]): LngLatBounds | undefined {
	if (coordinates.length === 0) return undefined;

	let south = Number.POSITIVE_INFINITY;
	let north = Number.NEGATIVE_INFINITY;
	for (const [, latitude] of coordinates) {
		south = Math.min(south, latitude);
		north = Math.max(north, latitude);
	}

	const longitudes = [...new Set(coordinates.map(([longitude]) => normalizeLongitude(longitude)))].sort(
		(a, b) => a - b
	);
	const first = longitudes[0] as number;
	const last = longitudes.at(-1) as number;

	// The gap across the antimeridian, from the easternmost back round to the
	// westernmost. If no gap between neighbours beats it, the box is the plain
	// one; otherwise it starts just east of the widest gap.
	let widestGap = first + 360 - last;
	let west = first;
	let east = last;
	for (let index = 0; index < longitudes.length - 1; index++) {
		const here = longitudes[index] as number;
		const next = longitudes[index + 1] as number;
		if (next - here > widestGap) {
			widestGap = next - here;
			west = next;
			east = here;
		}
	}

	return [west, south, east, north];
}

/**
 * A curve from one point to another, sampled into a polyline.
 *
 * A quadratic Bézier in plain longitude and latitude, bowed to the left of the
 * direction of travel by `curvature` times the chord's length at its apex —
 * negative bows right. It is deliberately not a great circle: it reads as
 * "from here to there" at city and country scale, where a geodesic is a
 * straight line anyway. The endpoints are the inputs themselves, not
 * recomputed, so a marker on either end sits exactly on the line. It does not
 * take the short way across the antimeridian; an arc from Auckland to Los
 * Angeles goes round by Europe.
 */
export function arcCoordinates(from: LngLat, to: LngLat, curvature = 0.2, samples = 64): LngLat[] {
	const [x0, y0] = from;
	const [x1, y1] = to;
	const dx = x1 - x0;
	const dy = y1 - y0;
	const length = Math.hypot(dx, dy);
	if (length === 0) return [from, to];

	const count = Math.max(2, Math.floor(samples));
	// The control point sits off the chord's midpoint along its left normal.
	// A quadratic Bézier reaches half way to its control point, so twice the
	// apex height puts the apex at `curvature × length`.
	const controlX = (x0 + x1) / 2 - (dy / length) * 2 * curvature * length;
	const controlY = (y0 + y1) / 2 + (dx / length) * 2 * curvature * length;

	const points: LngLat[] = [from];
	for (let index = 1; index < count - 1; index++) {
		const t = index / (count - 1);
		const u = 1 - t;
		points.push([u * u * x0 + 2 * u * t * controlX + t * t * x1, u * u * y0 + 2 * u * t * controlY + t * t * y1]);
	}
	points.push(to);

	return points;
}
