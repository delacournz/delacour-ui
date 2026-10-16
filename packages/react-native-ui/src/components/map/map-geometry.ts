import type { LngLat, LngLatBounds } from "./map.types";

/**
 * A tile's edge in points. MapLibre lays the world out on 512-point tiles, so
 * at zoom `z` the world is `512 × 2^z` points across — the same scale as every
 * web map, which is what lets a zoom copied from one mean the same here.
 */
export const MAP_TILE_SIZE = 512;

/** How far in a box of no size — one point — is framed. A street, not a doorstep. */
export const MAP_FIT_MAX_ZOOM = 16;

/** Where Web Mercator stops: the latitude at which the world is square. */
const MAX_LATITUDE = 85.0511287798;

const DEG = Math.PI / 180;

/** A longitude in `[-180, 180)`, however many turns it took to get there. */
export function normalizeLongitude(longitude: number): number {
	if (longitude >= -180 && longitude < 180) return longitude;
	return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

function mercatorY(latitude: number): number {
	const clamped = Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, latitude));
	return Math.log(Math.tan(Math.PI / 4 + (clamped * DEG) / 2));
}

function latitudeOfMercatorY(y: number): number {
	return (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / DEG;
}

/**
 * The centre and zoom that frame a box in a view of `size`, clearing `padding`
 * points on every side.
 *
 * Worked out here rather than handed to the native fit, for two reasons. A box
 * with `west > east` crosses the antimeridian, and a fit that takes corners
 * frames it the long way round the world. And the opening view has to be a
 * centre and zoom before the map exists, so the same sum serves both.
 *
 * The latitude is measured in Web Mercator, so the centre sits where the box's
 * middle is drawn — poleward of the mean latitude — and a tall box at high
 * latitude is not cropped. Padding that would leave no room is ignored, and an
 * unmeasured view is read as one tile square.
 */
export function fitBoundsCamera(
	[west, south, east, north]: LngLatBounds,
	size: { width: number; height: number },
	padding = 0
): { center: LngLat; zoom: number } {
	const longitudeSpan = west <= east ? east - west : east + 360 - west;
	const longitude = normalizeLongitude(west + longitudeSpan / 2);
	const ySouth = mercatorY(south);
	const yNorth = mercatorY(north);
	const latitude = south === north ? south : latitudeOfMercatorY((ySouth + yNorth) / 2);

	const width = size.width > 0 ? size.width : MAP_TILE_SIZE;
	const height = size.height > 0 ? size.height : MAP_TILE_SIZE;
	const fits = padding > 0 && width - 2 * padding > 0 && height - 2 * padding > 0;
	const innerWidth = fits ? width - 2 * padding : width;
	const innerHeight = fits ? height - 2 * padding : height;

	// The fraction of the world's width and height the box takes, and the zoom
	// at which that fraction of a `512 × 2^z` world fills the inner view.
	const xFraction = longitudeSpan / 360;
	const yFraction = Math.abs(yNorth - ySouth) / (2 * Math.PI);
	const zoomX = xFraction > 0 ? Math.log2(innerWidth / (MAP_TILE_SIZE * xFraction)) : Number.POSITIVE_INFINITY;
	const zoomY = yFraction > 0 ? Math.log2(innerHeight / (MAP_TILE_SIZE * yFraction)) : Number.POSITIVE_INFINITY;
	const zoom = Math.max(0, Math.min(MAP_FIT_MAX_ZOOM, zoomX, zoomY));

	return { center: [longitude, latitude], zoom };
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
