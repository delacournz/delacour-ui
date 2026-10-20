import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	arrowHeadPath,
	clampPositionToRect,
	FLOW_EDGE_VARIANTS,
	FLOW_SIDES,
	type FlowPoint,
	type FlowRect,
	type FlowSide,
	findHandleAt,
	fitViewport,
	flowGeometry,
	graphToScreen,
	miniMapTransform,
	parseEndpoint,
	resolveAutoSides,
	resolveEdgeGeometry,
	resolveHandlePoint,
	routeBezier,
	routeSmoothStep,
	routeStep,
	routeStraight,
	screenToGraph,
	sideVector,
	stepPoints,
	unionRects,
	visibleGraphRect,
	zoomAround,
} from "./flow-geometry";

/** Every number in an SVG path, in order. */
function numbers(d: string): number[] {
	return (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

/** The first and last coordinate pair a path visits. */
function ends(d: string): { start: FlowPoint; end: FlowPoint } {
	const all = numbers(d);
	return {
		start: { x: all[0] as number, y: all[1] as number },
		end: { x: all[all.length - 2] as number, y: all[all.length - 1] as number },
	};
}

const A: FlowRect = { x: 0, y: 0, width: 100, height: 60 };

/** Where a target sits relative to `A`, for each auto-side outcome. */
const PLACEMENTS: { name: string; rect: FlowRect; source: FlowSide; target: FlowSide }[] = [
	{ name: "right", rect: { x: 300, y: 10, width: 100, height: 60 }, source: "right", target: "left" },
	{ name: "left", rect: { x: -300, y: -10, width: 100, height: 60 }, source: "left", target: "right" },
	{ name: "below", rect: { x: 20, y: 300, width: 100, height: 60 }, source: "bottom", target: "top" },
	{ name: "above", rect: { x: -20, y: -300, width: 100, height: 60 }, source: "top", target: "bottom" },
];

describe("parseEndpoint", () => {
	test("a bare id names the node and no handle", () => {
		expect(parseEndpoint("a")).toEqual({ nodeId: "a" });
	});

	test("a dot splits the node from the handle", () => {
		expect(parseEndpoint("a.out")).toEqual({ nodeId: "a", handleId: "out" });
	});

	test("only the first dot splits, so a handle id may hold dots", () => {
		expect(parseEndpoint("a.out.2")).toEqual({ nodeId: "a", handleId: "out.2" });
	});

	test("a trailing dot is no handle", () => {
		expect(parseEndpoint("a.")).toEqual({ nodeId: "a" });
	});
});

describe("sideVector", () => {
	test("points out of the side it names", () => {
		expect(sideVector("top")).toEqual({ x: 0, y: -1 });
		expect(sideVector("right")).toEqual({ x: 1, y: 0 });
		expect(sideVector("bottom")).toEqual({ x: 0, y: 1 });
		expect(sideVector("left")).toEqual({ x: -1, y: 0 });
	});
});

describe("resolveAutoSides", () => {
	for (const placement of PLACEMENTS) {
		test(`a target ${placement.name} leaves ${placement.source} and enters ${placement.target}`, () => {
			expect(resolveAutoSides(A, placement.rect)).toEqual({ source: placement.source, target: placement.target });
		});
	}

	test("the axis with the larger centre gap wins", () => {
		expect(resolveAutoSides(A, { x: 200, y: 150, width: 100, height: 60 })).toEqual({
			source: "right",
			target: "left",
		});
		expect(resolveAutoSides(A, { x: 50, y: 250, width: 100, height: 60 })).toEqual({
			source: "bottom",
			target: "top",
		});
	});

	test("a tie goes horizontal", () => {
		expect(resolveAutoSides(A, { x: 100, y: 100, width: 100, height: 60 })).toEqual({
			source: "right",
			target: "left",
		});
	});

	test("overlapping nodes with one centre still resolve", () => {
		expect(resolveAutoSides(A, A)).toEqual({ source: "right", target: "left" });
	});

	test("zero-size rects resolve off their positions", () => {
		const point = { x: 0, y: 0, width: 0, height: 0 };
		expect(resolveAutoSides(point, { x: 0, y: 40, width: 0, height: 0 })).toEqual({
			source: "bottom",
			target: "top",
		});
	});
});

describe("resolveHandlePoint", () => {
	test("sits on the named side at the offset along it", () => {
		expect(resolveHandlePoint(A, "top", 0.5)).toEqual({ x: 50, y: 0 });
		expect(resolveHandlePoint(A, "right", 0.5)).toEqual({ x: 100, y: 30 });
		expect(resolveHandlePoint(A, "bottom", 0.25)).toEqual({ x: 25, y: 60 });
		expect(resolveHandlePoint(A, "left", 1)).toEqual({ x: 0, y: 60 });
	});

	test("clamps the offset to the side", () => {
		expect(resolveHandlePoint(A, "right", -1)).toEqual({ x: 100, y: 0 });
		expect(resolveHandlePoint(A, "right", 4)).toEqual({ x: 100, y: 60 });
	});

	test("a zero-size rect puts every side on its position", () => {
		const rect = { x: 7, y: 9, width: 0, height: 0 };
		for (const side of FLOW_SIDES) expect(resolveHandlePoint(rect, side, 0.5)).toEqual({ x: 7, y: 9 });
	});
});

describe("routeStraight", () => {
	test("is one line", () => {
		expect(routeStraight({ x: 0, y: 0 }, { x: 10.123, y: -4 })).toBe("M0 0 L10.12 -4");
	});
});

describe("routeBezier", () => {
	test("starts and ends on the two points", () => {
		const d = routeBezier({ x: 100, y: 30 }, "right", { x: 300, y: 40 }, "left", 0.25);
		expect(ends(d)).toEqual({ start: { x: 100, y: 30 }, end: { x: 300, y: 40 } });
		expect(d).toContain("C");
	});

	test("each control point leaves along its side", () => {
		for (const fromSide of FLOW_SIDES) {
			for (const toSide of FLOW_SIDES) {
				const from = { x: 0, y: 0 };
				const to = { x: 200, y: 150 };
				const [, , c1x, c1y, c2x, c2y] = numbers(routeBezier(from, fromSide, to, toSide, 0.25));
				const out = sideVector(fromSide);
				const into = sideVector(toSide);
				expect(((c1x as number) - from.x) * out.x + ((c1y as number) - from.y) * out.y).toBeGreaterThan(0);
				expect(((c2x as number) - to.x) * into.x + ((c2y as number) - to.y) * into.y).toBeGreaterThan(0);
			}
		}
	});

	test("more curvature reaches further", () => {
		const reach = (curvature: number) =>
			(numbers(routeBezier({ x: 0, y: 0 }, "right", { x: 200, y: 0 }, "left", curvature))[2] as number) - 0;
		expect(reach(0.5)).toBeGreaterThan(reach(0.25));
	});

	test("a target behind the source still bows out of its side", () => {
		const [, , c1x] = numbers(routeBezier({ x: 0, y: 0 }, "right", { x: -200, y: 0 }, "left", 0.25));
		expect(c1x as number).toBeGreaterThan(0);
	});

	test("coincident points stay finite", () => {
		const d = routeBezier({ x: 5, y: 5 }, "right", { x: 5, y: 5 }, "left", 0.25);
		for (const n of numbers(d)) expect(Number.isFinite(n)).toBe(true);
	});
});

/** True when every segment is horizontal or vertical. */
function isOrthogonal(points: FlowPoint[]): boolean {
	return points.every((point, index) => {
		const next = points[index + 1];
		return next === undefined || point.x === next.x || point.y === next.y;
	});
}

describe("stepPoints", () => {
	const targets: FlowPoint[] = [
		{ x: 300, y: 120 },
		{ x: -300, y: 120 },
		{ x: 300, y: -120 },
		{ x: -300, y: -120 },
		{ x: 10, y: 300 },
		{ x: 10, y: -300 },
		{ x: 0, y: 0 },
	];

	for (const fromSide of FLOW_SIDES) {
		for (const toSide of FLOW_SIDES) {
			test(`${fromSide} → ${toSide} is orthogonal, leaves and enters along its sides`, () => {
				for (const to of targets) {
					const from = { x: 0, y: 0 };
					const points = stepPoints(from, fromSide, to, toSide, 20);
					expect(points[0]).toEqual(from);
					expect(points[points.length - 1]).toEqual(to);
					expect(isOrthogonal(points)).toBe(true);
					if (points.length < 2 || (to.x === 0 && to.y === 0)) continue;

					const first = points[1] as FlowPoint;
					const out = sideVector(fromSide);
					expect((first.x - from.x) * out.x + (first.y - from.y) * out.y).toBeGreaterThan(0);

					const last = points[points.length - 2] as FlowPoint;
					const into = sideVector(toSide);
					expect((last.x - to.x) * into.x + (last.y - to.y) * into.y).toBeGreaterThan(0);
				}
			});
		}
	}

	test("two facing nodes turn once each, halfway across", () => {
		expect(stepPoints({ x: 0, y: 0 }, "right", { x: 200, y: 100 }, "left", 20)).toEqual([
			{ x: 0, y: 0 },
			{ x: 100, y: 0 },
			{ x: 100, y: 100 },
			{ x: 200, y: 100 },
		]);
	});

	test("level facing nodes are one straight run", () => {
		expect(stepPoints({ x: 0, y: 0 }, "right", { x: 200, y: 0 }, "left", 20)).toEqual([
			{ x: 0, y: 0 },
			{ x: 200, y: 0 },
		]);
	});

	test("a perpendicular pair turns once at the corner", () => {
		expect(stepPoints({ x: 0, y: 0 }, "right", { x: 200, y: 100 }, "top", 20)).toEqual([
			{ x: 0, y: 0 },
			{ x: 200, y: 0 },
			{ x: 200, y: 100 },
		]);
	});
});

describe("routeStep and routeSmoothStep", () => {
	const from = { x: 0, y: 0 };
	const to = { x: 200, y: 100 };

	test("step is straight lines only", () => {
		const d = routeStep(from, "right", to, "left", 20);
		expect(d).toBe("M0 0 L100 0 L100 100 L200 100");
	});

	test("smoothstep rounds each corner with a quadratic", () => {
		const d = routeSmoothStep(from, "right", to, "left", 20, 8);
		expect(d).toBe("M0 0 L92 0 Q100 0 100 8 L100 92 Q100 100 108 100 L200 100");
	});

	test("the radius shrinks to fit a short leg", () => {
		const d = routeSmoothStep(from, "right", { x: 200, y: 6 }, "left", 20, 8);
		expect(d).toBe("M0 0 L97 0 Q100 0 100 3 L100 3 Q100 6 103 6 L200 6");
	});

	test("a zero radius is the step path", () => {
		expect(routeSmoothStep(from, "right", to, "left", 20, 0)).toBe(routeStep(from, "right", to, "left", 20));
	});
});

describe("arrowHeadPath", () => {
	test("puts the tip on the end and the base behind it", () => {
		expect(arrowHeadPath({ x: 100, y: 50 }, { x: 1, y: 0 }, 8)).toBe("M100 50 L92 45.2 L92 54.8 Z");
	});

	test("normalises the direction", () => {
		expect(arrowHeadPath({ x: 0, y: 0 }, { x: 0, y: 10 }, 10)).toBe("M0 0 L6 -10 L-6 -10 Z");
	});

	test("a zero direction points right rather than collapsing", () => {
		expect(arrowHeadPath({ x: 0, y: 0 }, { x: 0, y: 0 }, 8)).toBe("M0 0 L-8 -4.8 L-8 4.8 Z");
	});
});

describe("resolveEdgeGeometry", () => {
	const B: FlowRect = { x: 300, y: 0, width: 100, height: 60 };
	const base = { curvature: 0.25, gap: 20, radius: 8, arrowSize: 8 };

	test("auto sides pick the facing centres", () => {
		const geometry = resolveEdgeGeometry({ ...base, sourceRect: A, targetRect: B, variant: "straight" });
		expect(geometry?.d).toBe("M100 30 L300 30");
		expect(geometry?.fromSide).toBe("right");
		expect(geometry?.toSide).toBe("left");
	});

	test("a handle's side and offset win over auto", () => {
		const geometry = resolveEdgeGeometry({
			...base,
			sourceHandle: { side: "bottom", offset: 0.25 },
			sourceRect: A,
			targetRect: B,
			variant: "straight",
		});
		expect(geometry?.start).toEqual({ x: 25, y: 60 });
		expect(geometry?.fromSide).toBe("bottom");
	});

	test("an explicit side wins over the handle's", () => {
		const geometry = resolveEdgeGeometry({
			...base,
			fromSide: "top",
			sourceHandle: { side: "bottom", offset: 0.5 },
			sourceRect: A,
			targetRect: B,
			variant: "straight",
		});
		expect(geometry?.fromSide).toBe("top");
		expect(geometry?.start).toEqual({ x: 50, y: 0 });
	});

	test("routes every variant", () => {
		for (const variant of FLOW_EDGE_VARIANTS) {
			const geometry = resolveEdgeGeometry({ ...base, sourceRect: A, targetRect: B, variant });
			expect(geometry).not.toBeNull();
			expect(ends(geometry?.d ?? "").end).toEqual({ x: 300, y: 30 });
		}
	});

	test("the arrow points into the target side, or along a straight line", () => {
		const curved = resolveEdgeGeometry({ ...base, sourceRect: A, targetRect: B, variant: "bezier" });
		expect(curved?.direction).toEqual({ x: 1, y: 0 });
		expect(curved?.arrow).toBe(arrowHeadPath({ x: 300, y: 30 }, { x: 1, y: 0 }, 8));

		const below = { x: 0, y: 300, width: 100, height: 60 };
		const straight = resolveEdgeGeometry({ ...base, sourceRect: A, targetRect: below, variant: "straight" });
		expect(straight?.direction).toEqual({ x: 0, y: 1 });
	});

	test("no arrow at size zero", () => {
		expect(resolveEdgeGeometry({ ...base, arrowSize: 0, sourceRect: A, targetRect: B, variant: "bezier" })?.arrow).toBe(
			""
		);
	});

	test("an unmeasured end routes nothing", () => {
		const unmeasured = { x: 0, y: 0, width: 0, height: 0 };
		expect(resolveEdgeGeometry({ ...base, sourceRect: unmeasured, targetRect: B, variant: "bezier" })).toBeNull();
	});

	test("overlapping nodes still route to finite numbers", () => {
		for (const variant of FLOW_EDGE_VARIANTS) {
			const geometry = resolveEdgeGeometry({ ...base, sourceRect: A, targetRect: A, variant });
			for (const n of numbers(geometry?.d ?? "")) expect(Number.isFinite(n)).toBe(true);
		}
	});
});

describe("unionRects", () => {
	test("is null for nothing", () => {
		expect(unionRects([])).toBeNull();
	});

	test("bounds every rect", () => {
		expect(
			unionRects([
				{ x: 0, y: 10, width: 50, height: 50 },
				{ x: -20, y: 40, width: 10, height: 100 },
			])
		).toEqual({ x: -20, y: 10, width: 70, height: 130 });
	});
});

describe("fitViewport", () => {
	const container = { width: 400, height: 800 };
	const limits = { maxZoom: 2.5, minZoom: 0.3, padding: 48 };

	test("centres the bounds and fits the tighter axis", () => {
		const viewport = fitViewport({ ...limits, bounds: { x: 0, y: 0, width: 608, height: 200 }, container });
		expect(viewport.zoom).toBeCloseTo(304 / 608);
		expect(viewport.x).toBeCloseTo(200 - 304 * 0.5);
		expect(viewport.y).toBeCloseTo(400 - 100 * 0.5);
	});

	test("never magnifies past one to one", () => {
		const viewport = fitViewport({ ...limits, bounds: { x: 0, y: 0, width: 40, height: 40 }, container });
		expect(viewport).toEqual({ x: 180, y: 380, zoom: 1 });
	});

	test("clamps to the minimum zoom", () => {
		expect(fitViewport({ ...limits, bounds: { x: 0, y: 0, width: 10000, height: 10 }, container }).zoom).toBe(0.3);
	});

	test("no bounds is the identity", () => {
		expect(fitViewport({ ...limits, bounds: null, container })).toEqual({ x: 0, y: 0, zoom: 1 });
	});

	test("a zero-size bound centres it at one to one", () => {
		expect(fitViewport({ ...limits, bounds: { x: 10, y: 10, width: 0, height: 0 }, container })).toEqual({
			x: 190,
			y: 390,
			zoom: 1,
		});
	});

	test("a container smaller than its padding falls to the minimum", () => {
		const viewport = fitViewport({
			...limits,
			bounds: { x: 0, y: 0, width: 100, height: 100 },
			container: { height: 50, width: 50 },
		});
		expect(viewport.zoom).toBe(0.3);
	});
});

describe("zoomAround", () => {
	test("keeps the focal point fixed", () => {
		const before = { x: 30, y: -10, zoom: 1 };
		const focal = { x: 200, y: 150 };
		const after = zoomAround(before, 2, focal, 0.3, 2.5);
		expect(after.zoom).toBe(2);
		expect(screenToGraph(focal, after)).toEqual(screenToGraph(focal, before));
	});

	test("clamps to the limits", () => {
		expect(zoomAround({ x: 0, y: 0, zoom: 2 }, 4, { x: 0, y: 0 }, 0.3, 2.5).zoom).toBe(2.5);
		expect(zoomAround({ x: 0, y: 0, zoom: 1 }, 0.01, { x: 0, y: 0 }, 0.3, 2.5).zoom).toBe(0.3);
	});
});

describe("screenToGraph and graphToScreen", () => {
	test("are inverses", () => {
		const viewport = { x: 40, y: -20, zoom: 1.5 };
		const point = { x: 12, y: 99 };
		expect(screenToGraph(graphToScreen(point, viewport), viewport)).toEqual(point);
	});
});

describe("visibleGraphRect", () => {
	test("is the container in graph units", () => {
		expect(visibleGraphRect({ x: -100, y: 50, zoom: 2 }, { width: 400, height: 800 })).toEqual({
			x: 50,
			y: -25,
			width: 200,
			height: 400,
		});
	});
});

describe("clampPositionToRect", () => {
	const group = { x: 0, y: 0, width: 300, height: 200 };
	const size = { width: 100, height: 50 };

	test("keeps a node inside", () => {
		expect(clampPositionToRect({ x: -40, y: 400 }, size, group)).toEqual({ x: 0, y: 150 });
		expect(clampPositionToRect({ x: 250, y: -5 }, size, group)).toEqual({ x: 200, y: 0 });
	});

	test("leaves a node already inside alone", () => {
		expect(clampPositionToRect({ x: 20, y: 20 }, size, group)).toEqual({ x: 20, y: 20 });
	});

	test("pins a node wider than the rect to its start", () => {
		expect(clampPositionToRect({ x: 50, y: 0 }, { width: 400, height: 10 }, group)).toEqual({ x: 0, y: 0 });
	});
});

describe("miniMapTransform", () => {
	test("fits and centres the bounds", () => {
		const transform = miniMapTransform({ x: 0, y: 0, width: 200, height: 100 }, 120, 84, 4);
		expect(transform.scale).toBeCloseTo(0.56);
		expect(transform.x).toBeCloseTo(4);
		expect(transform.y).toBeCloseTo(14);
	});

	test("a zero-size bound is drawn at one to one, centred", () => {
		expect(miniMapTransform({ x: 10, y: 10, width: 0, height: 0 }, 120, 84, 4)).toEqual({ scale: 1, x: 50, y: 32 });
	});
});

describe("findHandleAt", () => {
	const candidates = [
		{ id: "a", point: { x: 0, y: 0 } },
		{ id: "b", point: { x: 30, y: 0 } },
	];

	test("finds the nearest within the radius", () => {
		expect(findHandleAt({ x: 18, y: 0 }, candidates, 20)?.id).toBe("b");
	});

	test("finds nothing outside it", () => {
		expect(findHandleAt({ x: 100, y: 100 }, candidates, 20)).toBeNull();
	});
});

describe("flowGeometry", () => {
	const SOURCE = readFileSync(join(import.meta.dirname, "flow-geometry.ts"), "utf-8");

	test("is the module's only worklet, so nothing on the UI thread binds a sibling at import time", () => {
		const worklets = SOURCE.match(/^(?:export\s+)?function\s+\w+[^{]*\{\s*"worklet";/gm) ?? [];
		expect(worklets).toHaveLength(1);
		expect(SOURCE).not.toMatch(/^import\s+(?!type)/m);
	});

	test("hands out the same helpers the module exports", () => {
		const geometry = flowGeometry();
		expect(geometry.routeStraight({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(routeStraight({ x: 0, y: 0 }, { x: 1, y: 1 }));
	});
});
