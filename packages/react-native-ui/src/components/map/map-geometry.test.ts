import { describe, expect, test } from "bun:test";
import type { LngLat } from "./map.types";
import { arcCoordinates, boundsOf, fitBoundsCamera, MAP_FIT_MAX_ZOOM, normalizeLongitude } from "./map-geometry";

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

describe("fitBoundsCamera", () => {
	const SQUARE = { width: 512, height: 512 };

	test("the whole world in one tile's width is zoom 0", () => {
		const { center, zoom } = fitBoundsCamera([-180, -85.0511287798, 180, 85.0511287798], SQUARE);
		close(zoom, 0, 6);
		close(center[0], 0, 6);
		close(center[1], 0, 6);
	});

	test("half the world's longitude in the same width is one step in", () => {
		const { zoom } = fitBoundsCamera([0, -1, 180, 1], SQUARE);
		close(zoom, 1, 6);
	});

	test("the tighter axis decides: a wide box is held by the width, a tall one by the height", () => {
		const square = { width: 256, height: 256 };
		const wideBox = [0, -1, 4, 1] as const;
		const tallBox = [0, -2, 1, 2] as const;
		close(fitBoundsCamera(wideBox, { width: 256, height: 1024 }).zoom, fitBoundsCamera(wideBox, square).zoom, 6);
		close(fitBoundsCamera(tallBox, { width: 1024, height: 256 }).zoom, fitBoundsCamera(tallBox, square).zoom, 6);
		expect(fitBoundsCamera(wideBox, { width: 1024, height: 256 }).zoom).toBeGreaterThan(
			fitBoundsCamera(wideBox, square).zoom
		);
	});

	test("centres on the box in Web Mercator, which sits poleward of the mean latitude", () => {
		const { center } = fitBoundsCamera([0, 40, 10, 70], SQUARE);
		close(center[0], 5);
		expect(center[1]).toBeGreaterThan(55);
	});

	test("padding zooms out so the box clears it", () => {
		const bare = fitBoundsCamera([174, -42, 176, -40], SQUARE);
		const padded = fitBoundsCamera([174, -42, 176, -40], SQUARE, 128);
		close(padded.zoom, bare.zoom - 1, 6);
	});

	test("padding that would leave no room is ignored", () => {
		const bare = fitBoundsCamera([174, -42, 176, -40], SQUARE);
		expect(fitBoundsCamera([174, -42, 176, -40], SQUARE, 300)).toEqual(bare);
	});

	test("a box across the antimeridian is framed across it, not round the world", () => {
		const across = fitBoundsCamera([170, -20, -170, -10], SQUARE);
		const plain = fitBoundsCamera([-10, -20, 10, -10], SQUARE);
		close(Math.abs(across.center[0]), 180);
		close(across.zoom, plain.zoom, 6);
	});

	test("a box of no size is a close view, not an infinite zoom", () => {
		expect(fitBoundsCamera([174.776, -41.286, 174.776, -41.286], SQUARE)).toEqual({
			center: WELLINGTON,
			zoom: MAP_FIT_MAX_ZOOM,
		});
	});

	test("an unmeasured view is never a negative or non-finite zoom", () => {
		const { zoom } = fitBoundsCamera([0, 0, 10, 10], { width: 0, height: 0 });
		expect(Number.isFinite(zoom)).toBe(true);
		expect(zoom).toBeGreaterThanOrEqual(0);
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
