import { describe, expect, test } from "bun:test";
import type { LngLat, LngLatBounds } from "./map.types";
import {
	arcCoordinates,
	boundsOf,
	boundsToRegion,
	centerZoomToRegion,
	latLngToLngLat,
	lngLatToLatLng,
	longitudeDeltaToZoom,
	MAP_MAX_LONGITUDE_DELTA,
	normalizeLongitude,
	regionToBounds,
	regionToViewState,
	zoomToLongitudeDelta,
} from "./map-geometry";

const WELLINGTON: LngLat = [174.776, -41.286];
const AUCKLAND: LngLat = [174.763, -36.848];

function close(actual: number, expected: number, digits = 9): void {
	expect(actual).toBeCloseTo(expected, digits);
}

describe("normalizeLongitude", () => {
	test("leaves a longitude inside the range alone", () => {
		expect(normalizeLongitude(174.776)).toBe(174.776);
		expect(normalizeLongitude(-120)).toBe(-120);
	});

	test("wraps past the antimeridian, both ways", () => {
		close(normalizeLongitude(190), -170);
		close(normalizeLongitude(-190), 170);
		close(normalizeLongitude(540), -180);
	});
});

describe("lngLat ⇄ latLng", () => {
	test("swaps the order at the boundary and nowhere else", () => {
		expect(lngLatToLatLng(WELLINGTON)).toEqual({ latitude: -41.286, longitude: 174.776 });
		expect(latLngToLngLat({ latitude: -41.286, longitude: 174.776 })).toEqual(WELLINGTON);
	});
});

describe("zoom ⇄ longitude delta", () => {
	test("zoom 0 is the whole world, and each step halves it", () => {
		expect(zoomToLongitudeDelta(0)).toBe(360);
		expect(zoomToLongitudeDelta(1)).toBe(180);
		expect(zoomToLongitudeDelta(12)).toBe(360 / 4096);
	});

	test("round-trips", () => {
		for (const zoom of [0, 2, 5.5, 12, 18]) {
			close(longitudeDeltaToZoom(zoomToLongitudeDelta(zoom)), zoom);
		}
	});

	test("a delta wider than the world is zoom 0, never negative", () => {
		expect(longitudeDeltaToZoom(720)).toBe(0);
	});
});

describe("centerZoomToRegion", () => {
	test("centres on the point it was given", () => {
		const region = centerZoomToRegion(WELLINGTON, 12, 1);
		expect(region.longitude).toBe(174.776);
		expect(region.latitude).toBe(-41.286);
	});

	test("the longitude span is the zoom's", () => {
		close(centerZoomToRegion(WELLINGTON, 12, 1).longitudeDelta, 360 / 4096);
	});

	test("a square view near the equator spans the same latitude as longitude", () => {
		const region = centerZoomToRegion([0, 0], 10, 1);
		close(region.latitudeDelta, region.longitudeDelta, 5);
	});

	test("away from the equator a degree of latitude is longer, so fewer fit", () => {
		const region = centerZoomToRegion(WELLINGTON, 10, 1);
		expect(region.latitudeDelta).toBeLessThan(region.longitudeDelta);
		close(region.latitudeDelta / region.longitudeDelta, Math.cos((41.286 * Math.PI) / 180), 3);
	});

	test("a tall view spans more latitude than a wide one", () => {
		const tall = centerZoomToRegion(WELLINGTON, 10, 0.5);
		const wide = centerZoomToRegion(WELLINGTON, 10, 2);
		close(tall.latitudeDelta / wide.latitudeDelta, 4, 2);
	});

	test("an unmeasured aspect falls back to square rather than dividing by zero", () => {
		expect(centerZoomToRegion(WELLINGTON, 10, 0)).toEqual(centerZoomToRegion(WELLINGTON, 10, 1));
		expect(centerZoomToRegion(WELLINGTON, 10, Number.NaN)).toEqual(centerZoomToRegion(WELLINGTON, 10, 1));
	});

	test("the world view is capped short of a full turn", () => {
		expect(centerZoomToRegion([0, 0], 0, 1).longitudeDelta).toBe(MAP_MAX_LONGITUDE_DELTA);
		expect(centerZoomToRegion([0, 0], 0, 0.3).latitudeDelta).toBeLessThan(180);
	});
});

describe("regionToViewState", () => {
	test("round-trips a centre and zoom", () => {
		const view = regionToViewState(centerZoomToRegion(WELLINGTON, 12, 0.75));
		expect(view.center).toEqual(WELLINGTON);
		close(view.zoom, 12);
		expect(view.bearing).toBe(0);
		expect(view.pitch).toBe(0);
	});

	test("takes the bearing and pitch from a camera when there is one", () => {
		const view = regionToViewState(centerZoomToRegion(WELLINGTON, 4, 1), { heading: 45, pitch: 30 });
		expect(view.bearing).toBe(45);
		expect(view.pitch).toBe(30);
	});

	test("prefers the camera's own zoom when the platform reports one", () => {
		const view = regionToViewState(centerZoomToRegion(WELLINGTON, 4, 1), { heading: 0, pitch: 0, zoom: 7.5 });
		expect(view.zoom).toBe(7.5);
	});
});

describe("boundsToRegion ⇄ regionToBounds", () => {
	test("a box becomes its centre and its spans", () => {
		const region = boundsToRegion([174, -42, 176, -40]);
		expect(region).toEqual({ latitude: -41, longitude: 175, latitudeDelta: 2, longitudeDelta: 2 });
	});

	test("round-trips", () => {
		const bounds: LngLatBounds = [172.5, -43.6, 178.1, -36.2];
		const back = regionToBounds(boundsToRegion(bounds));
		bounds.forEach((value, index) => {
			close(back[index] as number, value);
		});
	});

	test("a box across the antimeridian is centred on it, not on Greenwich", () => {
		const region = boundsToRegion([170, -20, -170, -10]);
		close(region.longitudeDelta, 20);
		close(Math.abs(region.longitude), 180);
	});

	test("round-trips across the antimeridian", () => {
		const bounds: LngLatBounds = [175, -21, -178, -15];
		const back = regionToBounds(boundsToRegion(bounds));
		bounds.forEach((value, index) => {
			close(back[index] as number, value);
		});
	});
});

describe("boundsOf", () => {
	test("nothing has no bounds", () => {
		expect(boundsOf([])).toBeUndefined();
	});

	test("one point is a box of no size", () => {
		expect(boundsOf([WELLINGTON])).toEqual([174.776, -41.286, 174.776, -41.286]);
	});

	test("the extent of a route", () => {
		expect(boundsOf([WELLINGTON, AUCKLAND, [172.636, -43.532]])).toEqual([172.636, -43.532, 174.776, -36.848]);
	});

	test("points either side of the antimeridian take the short way round", () => {
		const bounds = boundsOf([
			[178, -18],
			[-179, -17],
			[179.5, -16],
		]);
		expect(bounds).toEqual([178, -18, -179, -16]);
	});

	test("points spread round the world without a gap take the Greenwich box", () => {
		expect(
			boundsOf([
				[-150, 0],
				[-30, 10],
				[90, 20],
			])
		).toEqual([-150, 0, 90, 20]);
	});
});

describe("arcCoordinates", () => {
	test("starts and ends exactly on its endpoints", () => {
		const points = arcCoordinates(AUCKLAND, WELLINGTON, 0.2, 32);
		expect(points[0]).toEqual(AUCKLAND);
		expect(points.at(-1)).toEqual(WELLINGTON);
	});

	test("samples the requested number of points, endpoints included", () => {
		expect(arcCoordinates(AUCKLAND, WELLINGTON, 0.2, 32)).toHaveLength(32);
		expect(arcCoordinates(AUCKLAND, WELLINGTON, 0.2, 1)).toHaveLength(2);
	});

	test("no curvature is the straight line", () => {
		const points = arcCoordinates([0, 0], [10, 0], 0, 11);
		points.forEach(([lng, lat], index) => {
			close(lng, index);
			close(lat, 0);
		});
	});

	test("bows off the chord by the curvature times its length, at the midpoint", () => {
		const points = arcCoordinates([0, 0], [10, 0], 0.2, 3);
		const [lng, lat] = points[1] as LngLat;
		close(lng, 5);
		close(lat, 2);
	});

	test("a negative curvature bows the other way", () => {
		const [, up] = arcCoordinates([0, 0], [10, 0], 0.2, 3)[1] as LngLat;
		const [, down] = arcCoordinates([0, 0], [10, 0], -0.2, 3)[1] as LngLat;
		expect(up).toBeGreaterThan(0);
		close(down, -up);
	});

	test("a zero-length arc is its one point, twice", () => {
		expect(arcCoordinates(WELLINGTON, WELLINGTON, 0.2, 8)).toEqual([WELLINGTON, WELLINGTON]);
	});
});
