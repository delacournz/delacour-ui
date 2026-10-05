import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	appendSketchSegment,
	buildSketchShapePath,
	finishSketchPath,
	formatSketchNumber,
	groupSketchItems,
	isSafeSketchColor,
	isSafeSketchPathData,
	SKETCH_MIN_SHAPE_DRAG,
	SKETCH_SHAPES,
	type SketchItem,
	sketchItemsToSvg,
	startSketchPath,
	undoSketchItems,
} from "./sketch.paths";

const stroke = (id: string, d = "M0 0 L1 1", color = "#111111", width = 4): SketchItem => ({
	color,
	d,
	id,
	kind: "stroke",
	width,
});
const erase = (id: string, d = "M0 0 L5 5", width = 12): SketchItem => ({ d, id, kind: "erase", width });

/** Every number in a path, paired as x, y. Only meaningful for paths with no arc commands. */
function pointsOf(d: string): { x: number; y: number }[] {
	const numbers = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
	const points: { x: number; y: number }[] = [];
	for (let index = 0; index + 1 < numbers.length; index += 2) {
		points.push({ x: numbers[index] ?? 0, y: numbers[index + 1] ?? 0 });
	}
	return points;
}

describe("sketch.paths is a leaf", () => {
	test("imports nothing at all, so Signature can take it without React Native", () => {
		const source = readFileSync(join(import.meta.dirname, "sketch.paths.ts"), "utf-8");
		expect(source).not.toMatch(/^\s*import\s/m);
		expect(source).not.toMatch(/require\(/);
		for (const name of [
			"react",
			"react-native",
			"react-native-reanimated",
			"react-native-svg",
			"react-native-worklets",
		]) {
			expect(source).not.toContain(`"${name}"`);
		}
	});
});

describe("formatSketchNumber", () => {
	test("whole numbers have no decimals", () => {
		expect(formatSketchNumber(1)).toBe("1");
		expect(formatSketchNumber(120)).toBe("120");
	});

	test("two decimal places, trailing zeros trimmed", () => {
		expect(formatSketchNumber(1.005)).toBe("1");
		expect(formatSketchNumber(1.5)).toBe("1.5");
		expect(formatSketchNumber(1.256)).toBe("1.26");
		expect(formatSketchNumber(-2.71828)).toBe("-2.72");
	});

	test("negative zero and non-finite numbers write as 0", () => {
		expect(formatSketchNumber(-0)).toBe("0");
		expect(formatSketchNumber(-0.001)).toBe("0");
		expect(formatSketchNumber(Number.NaN)).toBe("0");
		expect(formatSketchNumber(Number.POSITIVE_INFINITY)).toBe("0");
	});
});

describe("the live stroke", () => {
	test("starts with a move to the first point", () => {
		const p = { x: 10, y: 20 };
		expect(startSketchPath(p)).toEqual({ count: 1, d: "M10 20", last: p, mid: p });
	});

	test("appends a quadratic midpoint segment per sample", () => {
		const first = appendSketchSegment(startSketchPath({ x: 0, y: 0 }), { x: 10, y: 0 });
		expect(first.d).toBe("M0 0 Q0 0 5 0");
		expect(first.mid).toEqual({ x: 5, y: 0 });
		expect(first.count).toBe(2);

		const second = appendSketchSegment(first, { x: 10, y: 10 });
		expect(second.d).toBe("M0 0 Q0 0 5 0 Q10 0 10 5");
		expect(second.last).toEqual({ x: 10, y: 10 });
		expect(second.count).toBe(3);
	});

	test("drops a sample under half a point from the last", () => {
		const start = startSketchPath({ x: 0, y: 0 });
		const same = appendSketchSegment(start, { x: 0.3, y: 0.3 });
		expect(same).toBe(start);
		expect(same.count).toBe(1);
	});

	test("a tap finishes as a round-capped dot", () => {
		expect(finishSketchPath(startSketchPath({ x: 10, y: 20 }))).toBe("M10 20 L10.01 20");
	});

	test("a drag finishes with a line to the last point", () => {
		const state = appendSketchSegment(appendSketchSegment(startSketchPath({ x: 0, y: 0 }), { x: 10, y: 0 }), {
			x: 10,
			y: 10,
		});
		expect(finishSketchPath(state)).toBe("M0 0 Q0 0 5 0 Q10 0 10 5 L10 10");
	});
});

describe("buildSketchShapePath", () => {
	const from = { x: 0, y: 0 };
	const to = { x: 10, y: 20 };

	test("rectangle", () => {
		expect(buildSketchShapePath("rectangle", from, to)).toBe("M0 0H10V20H0Z");
	});

	test("a reversed drag normalises to the same bounds", () => {
		for (const shape of SKETCH_SHAPES) {
			if (shape === "line" || shape === "arrow") continue;
			expect(buildSketchShapePath(shape, to, from)).toBe(buildSketchShapePath(shape, from, to));
		}
	});

	test("ellipse is two closed arcs of the half extents", () => {
		const d = buildSketchShapePath("ellipse", from, to) ?? "";
		expect(d.match(/A5 10 /g)?.length).toBe(2);
		expect(d.startsWith("M0 10")).toBe(true);
		expect(d.endsWith("Z")).toBe(true);
	});

	test("triangle has its apex top-centre", () => {
		expect(buildSketchShapePath("triangle", from, to)).toBe("M5 0L10 20L0 20Z");
	});

	test("diamond touches each edge at its midpoint", () => {
		expect(buildSketchShapePath("diamond", from, to)).toBe("M5 0L10 10L5 20L0 10Z");
	});

	test("line follows the drag", () => {
		expect(buildSketchShapePath("line", { x: 0, y: 0 }, { x: 10, y: 0 })).toBe("M0 0L10 0");
		expect(buildSketchShapePath("line", { x: 10, y: 0 }, { x: 0, y: 0 })).toBe("M10 0L0 0");
	});

	test("arrow is the line plus two barbs at ±25° from the tip", () => {
		const d = buildSketchShapePath("arrow", { x: 0, y: 0 }, { x: 100, y: 0 }, 4) ?? "";
		expect(d.startsWith("M0 0L100 0")).toBe(true);
		const barb = 16;
		const bx = formatSketchNumber(100 - barb * Math.cos((25 * Math.PI) / 180));
		const by = formatSketchNumber(barb * Math.sin((25 * Math.PI) / 180));
		expect(d).toContain(`M${bx} -${by}L100 0L${bx} ${by}`);
	});

	test("an arrow's barbs are clamped between 8pt and 40% of its length", () => {
		const long = buildSketchShapePath("arrow", { x: 0, y: 0 }, { x: 100, y: 0 }, 1) ?? "";
		const longBarb = formatSketchNumber(100 - 8 * Math.cos((25 * Math.PI) / 180));
		expect(long).toContain(`M${longBarb} `);

		const short = buildSketchShapePath("arrow", { x: 0, y: 0 }, { x: 10, y: 0 }, 4) ?? "";
		const shortBarb = formatSketchNumber(10 - 4 * Math.cos((25 * Math.PI) / 180));
		expect(short).toContain(`M${shortBarb} `);
	});

	test("star has ten points, alternating radius 1 : 0.5, inside the bounds", () => {
		const d = buildSketchShapePath("star", { x: 0, y: 0 }, { x: 100, y: 100 }) ?? "";
		const points = pointsOf(d);
		expect(points).toHaveLength(10);
		expect(points[0]).toEqual({ x: 50, y: 0 });
		points.forEach((point, index) => {
			const radius = Math.hypot(point.x - 50, point.y - 50);
			expect(radius).toBeCloseTo(index % 2 === 0 ? 50 : 25, 1);
		});
		expect(d.endsWith("Z")).toBe(true);
	});

	test("star and heart stay inside the dragged bounds", () => {
		for (const shape of ["star", "heart"] as const) {
			const d = buildSketchShapePath(shape, { x: 10, y: 20 }, { x: 70, y: 90 }) ?? "";
			expect(d.length).toBeGreaterThan(0);
			for (const point of pointsOf(d)) {
				expect(point.x).toBeGreaterThanOrEqual(10);
				expect(point.x).toBeLessThanOrEqual(70);
				expect(point.y).toBeGreaterThanOrEqual(20);
				expect(point.y).toBeLessThanOrEqual(90);
			}
		}
	});

	test("a drag under the minimum on both axes is not a shape", () => {
		expect(SKETCH_MIN_SHAPE_DRAG).toBe(4);
		for (const shape of SKETCH_SHAPES) {
			expect(buildSketchShapePath(shape, { x: 0, y: 0 }, { x: 3, y: 3.9 })).toBeNull();
			expect(buildSketchShapePath(shape, { x: 0, y: 0 }, { x: 4, y: 0 })).not.toBeNull();
		}
	});
});

describe("isSafeSketchColor", () => {
	test("accepts colour literals", () => {
		for (const color of ["#fff", "#ffffff", "#ffffffff", "rgb(0 0 0 / 50%)", "rgba(0, 0, 0, 0.5)", "oklch(0.2 0 0)"]) {
			expect(isSafeSketchColor(color)).toBe(true);
		}
	});

	test("refuses anything that could break out of an attribute", () => {
		for (const color of ['red;"onload="', "url(#x)", '"><script>', "#ggg", "", "rgb(0 0 0) x"]) {
			expect(isSafeSketchColor(color)).toBe(false);
		}
	});
});

describe("isSafeSketchPathData", () => {
	test("accepts path commands and numbers", () => {
		expect(isSafeSketchPathData("M0 0 Q1.5 -2 3e2 4 L5,6Z")).toBe(true);
	});

	test("refuses markup", () => {
		expect(isSafeSketchPathData('M0 0"/><script>')).toBe(false);
	});
});

describe("groupSketchItems", () => {
	const a = stroke("a");
	const b = stroke("b");
	const c = stroke("c");
	const e1 = erase("e1");
	const e2 = erase("e2");

	test("splits at every eraser, each group masked by the erasers after it", () => {
		expect(groupSketchItems([a, b, e1, c, e2])).toEqual([
			{ erasers: [e1, e2], marks: [a, b] },
			{ erasers: [e2], marks: [c] },
		]);
	});

	test("no erasers is one unmasked group", () => {
		expect(groupSketchItems([a, b])).toEqual([{ erasers: [], marks: [a, b] }]);
	});

	test("an eraser with nothing before it makes no empty group", () => {
		expect(groupSketchItems([e1, a])).toEqual([{ erasers: [], marks: [a] }]);
	});

	test("adjacent erasers land once each in the group before them", () => {
		expect(groupSketchItems([a, e1, e2, b])).toEqual([
			{ erasers: [e1, e2], marks: [a] },
			{ erasers: [], marks: [b] },
		]);
	});

	test("nothing is no groups", () => {
		expect(groupSketchItems([])).toEqual([]);
	});
});

describe("sketchItemsToSvg", () => {
	const size = { height: 200, width: 100 };

	test("nothing is an empty svg sized to the canvas", () => {
		expect(sketchItemsToSvg([], size)).toBe(
			'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="200" viewBox="0 0 100 200"></svg>'
		);
	});

	test("an unmeasured canvas is a zero viewBox", () => {
		expect(sketchItemsToSvg([], { height: 0, width: 0 })).toContain('viewBox="0 0 0 0"');
	});

	test("a background paints a rect first", () => {
		expect(sketchItemsToSvg([], { ...size, background: "#fafafa" })).toBe(
			'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="200" viewBox="0 0 100 200"><rect width="100" height="200" fill="#fafafa"/></svg>'
		);
	});

	test("an unsafe background is left out", () => {
		expect(sketchItemsToSvg([], { ...size, background: '"><script>' })).not.toContain("<rect");
	});

	test("a stroke is a round-capped path with no fill", () => {
		expect(sketchItemsToSvg([stroke("a", "M0 0 L10 10", "#111")], size)).toContain(
			'<path d="M0 0 L10 10" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
		);
	});

	test("a shape is never filled", () => {
		const shape: SketchItem = {
			color: "#f00",
			d: "M0 0H10V20H0Z",
			id: "s",
			kind: "shape",
			shape: "rectangle",
			width: 2,
		};
		const svg = sketchItemsToSvg([shape], size);
		expect(svg).toContain('d="M0 0H10V20H0Z" fill="none" stroke="#f00" stroke-width="2"');
	});

	test("erasers become a mask the earlier marks are drawn through", () => {
		const svg = sketchItemsToSvg([stroke("a"), erase("e1", "M1 1 L2 2", 12), stroke("b"), erase("e2")], size);
		expect(svg).toContain('<mask id="m0"');
		expect(svg).toContain('<mask id="m1"');
		expect(svg).toContain('<rect width="100" height="200" fill="#fff"/>');
		expect(svg).toContain(
			'<path d="M1 1 L2 2" fill="none" stroke="#000" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>'
		);
		expect(svg).toContain('<g mask="url(#m0)">');
		expect(svg).toContain('<g mask="url(#m1)">');
		expect(svg.indexOf('id="m0"')).toBeLessThan(svg.indexOf("url(#m0)"));
	});

	test("an unmasked group is drawn bare", () => {
		const svg = sketchItemsToSvg([stroke("a")], size);
		expect(svg).not.toContain("<mask");
		expect(svg).not.toContain("<g");
	});

	test("an item with an unsafe colour or path is skipped, not emitted", () => {
		const svg = sketchItemsToSvg([stroke("a", "M0 0", 'red;"onload="'), stroke("b", 'M0 0"/><script>')], size);
		expect(svg).not.toContain("<path");
		expect(svg).not.toContain("onload");
		expect(svg).not.toContain("script");
	});

	test("the output is stable across calls", () => {
		const items = [stroke("a"), erase("e"), stroke("b")];
		expect(sketchItemsToSvg(items, size)).toBe(sketchItemsToSvg(items, size));
	});
});

describe("undoSketchItems", () => {
	test("removes the last item, an eraser included", () => {
		const a = stroke("a");
		const e = erase("e");
		expect(undoSketchItems([a, e])).toEqual([a]);
		expect(undoSketchItems([a])).toEqual([]);
	});

	test("nothing to undo returns the same array", () => {
		const empty: readonly SketchItem[] = [];
		expect(undoSketchItems(empty)).toBe(empty);
	});
});
