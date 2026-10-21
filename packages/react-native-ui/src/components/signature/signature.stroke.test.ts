import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	boundsOf,
	canRedo,
	canUndo,
	createHistory,
	historyReducer,
	historyToValue,
	isHistoryEmpty,
	parseSignature,
	SIGNATURE_EXPORT_PADDING,
	SIGNATURE_EXPORT_STROKE_COLOR,
	type SignatureHistory,
	type SignaturePathSink,
	scaleValue,
	serializeSignature,
	shouldAddPoint,
	smoothStroke,
	strokeCount,
	strokesToPaths,
	toSVG,
	traceStroke,
} from "./signature.stroke";
import type { SignatureStroke, SignatureValue } from "./signature.types";

const LINE: SignatureStroke = [
	{ x: 0, y: 0 },
	{ x: 10, y: 10 },
];
const CURVE: SignatureStroke = [
	{ x: 0, y: 0 },
	{ x: 10, y: 0 },
	{ x: 20, y: 10 },
	{ x: 30, y: 10 },
];

const VALUE: SignatureValue = { width: 200, height: 100, strokes: [LINE, CURVE] };

describe("shouldAddPoint", () => {
	test("the first point of a stroke is always kept", () => {
		expect(shouldAddPoint(undefined, { x: 4, y: 4 }, 1.5)).toBe(true);
	});

	test("a point closer than the threshold is dropped", () => {
		expect(shouldAddPoint({ x: 0, y: 0 }, { x: 1, y: 1 }, 1.5)).toBe(false);
	});

	test("a point exactly at the threshold is kept", () => {
		expect(shouldAddPoint({ x: 0, y: 0 }, { x: 3, y: 4 }, 5)).toBe(true);
	});

	test("a point past the threshold is kept", () => {
		expect(shouldAddPoint({ x: 0, y: 0 }, { x: 10, y: 0 }, 1.5)).toBe(true);
	});
});

describe("smoothStroke", () => {
	test("no points is no path", () => {
		expect(smoothStroke([])).toBe("");
	});

	test("one point is a zero-length segment, which a round cap draws as a dot", () => {
		expect(smoothStroke([{ x: 5, y: 6 }])).toBe("M5 6 L5 6");
	});

	test("two points are a straight line", () => {
		expect(smoothStroke(LINE)).toBe("M0 0 L10 10");
	});

	test("three or more points are a quadratic chain through the midpoints, ending on the last point", () => {
		expect(smoothStroke(CURVE)).toBe("M0 0 Q10 0 15 5 Q20 10 25 10 L30 10");
	});

	test("coordinates are rounded to two places", () => {
		expect(smoothStroke([{ x: 1.23456, y: 2.98765 }])).toBe("M1.23 2.99 L1.23 2.99");
	});

	test("duplicate points never produce NaN", () => {
		const path = smoothStroke([
			{ x: 1, y: 1 },
			{ x: 1, y: 1 },
			{ x: 1, y: 1 },
		]);
		expect(path).not.toContain("NaN");
		expect(path.startsWith("M1 1")).toBe(true);
	});

	test("a non-finite coordinate is written as zero rather than NaN", () => {
		expect(smoothStroke([{ x: Number.NaN, y: Number.POSITIVE_INFINITY }])).toBe("M0 0 L0 0");
	});

	test("is deterministic", () => {
		expect(smoothStroke(CURVE)).toBe(smoothStroke(CURVE.map((point) => ({ ...point }))));
	});

	test("negative zero is written as zero", () => {
		expect(smoothStroke([{ x: -0.001, y: 0 }])).toBe("M0 0 L0 0");
	});
});

describe("strokesToPaths", () => {
	test("one path per stroke, in order", () => {
		expect(strokesToPaths([LINE, CURVE])).toEqual([smoothStroke(LINE), smoothStroke(CURVE)]);
	});
});

/** A sink that writes what it is handed back out as path data, rounded the way `smoothStroke` rounds. */
function recordingSink(): SignaturePathSink & { calls: string[]; d: () => string } {
	const calls: string[] = [];
	const n = (value: number): string => {
		const rounded = Math.round(value * 100) / 100;
		return String(rounded === 0 ? 0 : rounded);
	};
	return {
		calls,
		d: () => calls.join(" "),
		lineTo: (x, y) => calls.push(`L${n(x)} ${n(y)}`),
		moveTo: (x, y) => calls.push(`M${n(x)} ${n(y)}`),
		quadTo: (x1, y1, x2, y2) => calls.push(`Q${n(x1)} ${n(y1)} ${n(x2)} ${n(y2)}`),
	};
}

describe("traceStroke", () => {
	test("no points draws nothing", () => {
		const sink = recordingSink();
		traceStroke([], sink);
		expect(sink.calls).toEqual([]);
	});

	test("one point is a zero-length segment, which a round cap draws as a dot", () => {
		const sink = recordingSink();
		traceStroke([{ x: 4, y: 6 }], sink);
		expect(sink.calls).toEqual(["M4 6", "L4 6"]);
	});

	test("two points are a line", () => {
		const sink = recordingSink();
		traceStroke(LINE, sink);
		expect(sink.calls).toEqual(["M0 0", "L10 10"]);
	});

	test("three or more points are midpoint quadratics ending on the last point", () => {
		const sink = recordingSink();
		traceStroke(CURVE, sink);
		expect(sink.calls).toEqual(["M0 0", "Q10 0 15 5", "Q20 10 25 10", "L30 10"]);
	});

	test("coordinates are passed unrounded", () => {
		const calls: number[][] = [];
		traceStroke([{ x: 1.23456, y: 2.34567 }], {
			lineTo: (x, y) => calls.push([x, y]),
			moveTo: (x, y) => calls.push([x, y]),
			quadTo: () => undefined,
		});
		expect(calls).toEqual([
			[1.23456, 2.34567],
			[1.23456, 2.34567],
		]);
	});

	test("a non-finite coordinate is traced as zero, as the string form writes it", () => {
		const sink = recordingSink();
		traceStroke([{ x: Number.NaN, y: Number.POSITIVE_INFINITY }], sink);
		expect(sink.calls).toEqual(["M0 0", "L0 0"]);
	});

	const SAMPLES: readonly SignatureStroke[] = [
		[],
		[{ x: 0.004, y: -0.004 }],
		LINE,
		CURVE,
		Array.from({ length: 40 }, (_, index) => ({ x: index * 3.137, y: Math.sin(index / 3) * 21.5 + 40 })),
	];

	for (const [index, stroke] of SAMPLES.entries()) {
		test(`draws exactly what smoothStroke writes (sample ${index})`, () => {
			const sink = recordingSink();
			traceStroke(stroke, sink);
			expect(sink.d()).toBe(smoothStroke(stroke));
		});
	}
});

describe("the smoother is a worklet", () => {
	const source = readFileSync(join(import.meta.dirname, "signature.stroke.ts"), "utf-8");

	test("the module imports nothing from React Native", () => {
		expect(source).not.toMatch(/from "react-native/);
	});

	for (const name of ["shouldAddPoint", "smoothStroke", "formatCoordinate", "traceStroke"]) {
		test(`${name} carries the worklet directive`, () => {
			const body = source.slice(source.indexOf(`function ${name}(`));
			expect(body.slice(0, body.indexOf("\n}"))).toContain('"worklet";');
		});
	}
});

describe("historyReducer", () => {
	const empty = createHistory(null);

	test("begin, append and end build a stroke", () => {
		let state = historyReducer(empty, { type: "begin", point: { x: 0, y: 0 } });
		state = historyReducer(state, { type: "append", point: { x: 5, y: 5 } });
		expect(state.strokes).toHaveLength(0);
		state = historyReducer(state, { type: "end" });
		expect(state.strokes).toEqual([
			[
				{ x: 0, y: 0 },
				{ x: 5, y: 5 },
			],
		]);
		expect(state.current).toBeNull();
	});

	test("append and end without a begin are no-ops", () => {
		expect(historyReducer(empty, { type: "append", point: { x: 1, y: 1 } })).toBe(empty);
		expect(historyReducer(empty, { type: "end" })).toBe(empty);
	});

	test("commit adds a whole stroke at once", () => {
		const state = historyReducer(empty, { type: "commit", stroke: LINE });
		expect(state.strokes).toEqual([LINE]);
	});

	test("an empty stroke commits nothing", () => {
		expect(historyReducer(empty, { type: "commit", stroke: [] })).toBe(empty);
	});

	test("undo moves the last stroke to the redo stack, and redo restores it", () => {
		const drawn = historyReducer(historyReducer(empty, { type: "commit", stroke: LINE }), {
			type: "commit",
			stroke: CURVE,
		});
		const undone = historyReducer(drawn, { type: "undo" });
		expect(undone.strokes).toEqual([LINE]);
		expect(undone.redo).toEqual([CURVE]);

		const redone = historyReducer(undone, { type: "redo" });
		expect(redone.strokes).toEqual([LINE, CURVE]);
		expect(redone.redo).toEqual([]);
	});

	test("a new stroke after an undo discards the redo stack", () => {
		const undone = historyReducer(historyReducer(empty, { type: "commit", stroke: LINE }), { type: "undo" });
		const drawn = historyReducer(undone, { type: "commit", stroke: CURVE });
		expect(drawn.redo).toEqual([]);
		expect(drawn.strokes).toEqual([CURVE]);
	});

	test("clear empties both stacks, and is not itself undoable", () => {
		const drawn = historyReducer(historyReducer(empty, { type: "commit", stroke: LINE }), {
			type: "commit",
			stroke: CURVE,
		});
		const cleared = historyReducer(historyReducer(drawn, { type: "undo" }), { type: "clear" });
		expect(cleared.strokes).toEqual([]);
		expect(cleared.redo).toEqual([]);
		expect(historyReducer(cleared, { type: "undo" })).toBe(cleared);
	});

	test("undo, redo and clear with nothing to do return the same reference", () => {
		expect(historyReducer(empty, { type: "undo" })).toBe(empty);
		expect(historyReducer(empty, { type: "redo" })).toBe(empty);
		expect(historyReducer(empty, { type: "clear" })).toBe(empty);
	});

	test("layout adopts the first measured size without moving anything", () => {
		const state = historyReducer(empty, { type: "layout", width: 300, height: 180 });
		expect(state.width).toBe(300);
		expect(state.height).toBe(180);
	});

	test("layout at a new size re-fits the strokes and the redo stack", () => {
		const seeded = historyReducer(createHistory(VALUE), { type: "undo" });
		const resized = historyReducer(seeded, { type: "layout", width: 400, height: 200 });
		expect(resized.strokes).toEqual(scaleValue({ ...VALUE, strokes: [LINE] }, 400, 200).strokes);
		expect(resized.redo).toEqual(scaleValue({ ...VALUE, strokes: [CURVE] }, 400, 200).strokes);
	});

	test("layout at the same size returns the same reference", () => {
		const state = createHistory(VALUE);
		expect(historyReducer(state, { type: "layout", width: 200, height: 100 })).toBe(state);
	});

	test("a layout of zero is ignored", () => {
		const state = createHistory(VALUE);
		expect(historyReducer(state, { type: "layout", width: 0, height: 100 })).toBe(state);
	});

	test("reset replaces the strokes, fits them to the pad and drops the redo stack", () => {
		const measured = historyReducer(
			historyReducer(historyReducer(empty, { type: "layout", width: 400, height: 200 }), {
				type: "commit",
				stroke: LINE,
			}),
			{ type: "undo" }
		);
		const reset = historyReducer(measured, { type: "reset", value: VALUE });
		expect(reset.strokes).toEqual(scaleValue(VALUE, 400, 200).strokes);
		expect(reset.redo).toEqual([]);
		expect(reset.width).toBe(400);
	});

	test("reset before layout adopts the value's own size", () => {
		const reset = historyReducer(empty, { type: "reset", value: VALUE });
		expect(reset.width).toBe(200);
		expect(reset.strokes).toEqual(VALUE.strokes);
	});

	test("reset to null empties the pad", () => {
		const reset = historyReducer(createHistory(VALUE), { type: "reset", value: null });
		expect(reset.strokes).toEqual([]);
	});
});

describe("selectors", () => {
	test("an empty history", () => {
		const state = createHistory(null);
		expect(isHistoryEmpty(state)).toBe(true);
		expect(strokeCount(state)).toBe(0);
		expect(canUndo(state)).toBe(false);
		expect(canRedo(state)).toBe(false);
		expect(historyToValue(state)).toBeNull();
	});

	test("a drawn history", () => {
		const state: SignatureHistory = historyReducer(createHistory(VALUE), { type: "undo" });
		expect(isHistoryEmpty(state)).toBe(false);
		expect(strokeCount(state)).toBe(1);
		expect(canUndo(state)).toBe(true);
		expect(canRedo(state)).toBe(true);
		expect(historyToValue(state)).toEqual({ width: 200, height: 100, strokes: [LINE] });
	});

	test("a stroke still being drawn is not part of the value", () => {
		const state = historyReducer(createHistory(null), { type: "begin", point: { x: 1, y: 1 } });
		expect(isHistoryEmpty(state)).toBe(true);
	});
});

describe("boundsOf", () => {
	test("empty is null", () => {
		expect(boundsOf([], 2)).toBeNull();
	});

	test("the tight box is inflated by half the stroke width", () => {
		expect(boundsOf([CURVE], 2)).toEqual({ x: -1, y: -1, width: 32, height: 12 });
	});

	test("a single dot has a box the size of the pen", () => {
		expect(boundsOf([[{ x: 5, y: 5 }]], 4)).toEqual({ x: 3, y: 3, width: 4, height: 4 });
	});
});

describe("toSVG", () => {
	test("the default is the whole pad, black ink, no background", () => {
		const svg = toSVG(VALUE);
		expect(
			svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="200" height="100">')
		).toBe(true);
		expect(svg.endsWith("</svg>")).toBe(true);
		expect(svg).not.toContain("<rect");
		expect(svg.match(/<path /g)).toHaveLength(2);
		expect(svg).toContain(`stroke="${SIGNATURE_EXPORT_STROKE_COLOR}"`);
		expect(svg).toContain('fill="none"');
		expect(svg).toContain('stroke-linecap="round"');
		expect(svg).toContain('stroke-linejoin="round"');
		expect(svg).toContain(`d="${smoothStroke(CURVE)}"`);
	});

	test("stroke width is written, defaulting to the pad's own", () => {
		expect(toSVG(VALUE)).toContain('stroke-width="2.5"');
		expect(toSVG(VALUE, { strokeWidth: 4 })).toContain('stroke-width="4"');
	});

	test("a background colour paints a rect behind the ink", () => {
		const svg = toSVG(VALUE, { background: "#ffffff" });
		expect(svg).toContain('<rect x="0" y="0" width="200" height="100" fill="#ffffff"/>');
		expect(svg.indexOf("<rect")).toBeLessThan(svg.indexOf("<path"));
	});

	test("transparent is no background at all", () => {
		expect(toSVG(VALUE, { background: "transparent" })).not.toContain("<rect");
	});

	test("a token name is not a colour an exported file can use", () => {
		expect(toSVG(VALUE, { strokeColor: "foreground" })).toContain(`stroke="${SIGNATURE_EXPORT_STROKE_COLOR}"`);
		expect(toSVG(VALUE, { background: "background" })).not.toContain("<rect");
	});

	test("a literal stroke colour is written", () => {
		expect(toSVG(VALUE, { strokeColor: "rgb(10, 20, 30)" })).toContain('stroke="rgb(10, 20, 30)"');
	});

	test("attribute values are escaped", () => {
		const svg = toSVG(VALUE, { strokeColor: 'rgb(1,2,3)" onload="x&y' });
		expect(svg).toContain('stroke="rgb(1,2,3)&quot; onload=&quot;x&amp;y"');
		expect(svg).not.toContain('" onload="');
	});

	test("tight crops to the ink plus padding", () => {
		const svg = toSVG({ width: 200, height: 100, strokes: [CURVE] }, { strokeWidth: 2, viewBox: "tight" });
		const pad = SIGNATURE_EXPORT_PADDING;
		expect(svg).toContain(`viewBox="${-1 - pad} ${-1 - pad} ${32 + pad * 2} ${12 + pad * 2}"`);
		expect(svg).toContain(`width="${32 + pad * 2}" height="${12 + pad * 2}"`);
	});

	test("tight honours an explicit padding", () => {
		const svg = toSVG({ width: 200, height: 100, strokes: [CURVE] }, { padding: 0, strokeWidth: 2, viewBox: "tight" });
		expect(svg).toContain('viewBox="-1 -1 32 12"');
	});

	test("a tight background covers the cropped box", () => {
		const svg = toSVG(
			{ width: 200, height: 100, strokes: [CURVE] },
			{ background: "#fff", padding: 0, strokeWidth: 2, viewBox: "tight" }
		);
		expect(svg).toContain('<rect x="-1" y="-1" width="32" height="12" fill="#fff"/>');
	});

	test("an empty value is an empty but valid document", () => {
		const svg = toSVG({ width: 200, height: 100, strokes: [] });
		expect(svg).toBe('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="200" height="100"></svg>');
	});

	test("an empty value cropped tight falls back to the pad", () => {
		expect(toSVG({ width: 200, height: 100, strokes: [] }, { viewBox: "tight" })).toContain('viewBox="0 0 200 100"');
	});
});

describe("scaleValue", () => {
	test("the same size is the same value", () => {
		expect(scaleValue(VALUE, 200, 100)).toBe(VALUE);
	});

	test("scales uniformly, preserving aspect", () => {
		const scaled = scaleValue(VALUE, 400, 200);
		expect(scaled.width).toBe(400);
		expect(scaled.height).toBe(200);
		expect(scaled.strokes[1]?.[2]).toEqual({ x: 40, y: 20 });
	});

	test("a narrower pad fits by width and centres vertically", () => {
		const scaled = scaleValue({ width: 200, height: 100, strokes: [[{ x: 0, y: 0 }]] }, 100, 100);
		expect(scaled.strokes[0]?.[0]).toEqual({ x: 0, y: 25 });
	});

	test("a wider pad fits by height and centres horizontally", () => {
		const scaled = scaleValue({ width: 100, height: 100, strokes: [[{ x: 0, y: 0 }]] }, 300, 100);
		expect(scaled.strokes[0]?.[0]).toEqual({ x: 100, y: 0 });
	});

	test("the timestamp is carried through", () => {
		const scaled = scaleValue({ width: 100, height: 100, strokes: [[{ t: 12, x: 10, y: 10 }]] }, 200, 200);
		expect(scaled.strokes[0]?.[0]).toEqual({ t: 12, x: 20, y: 20 });
	});

	test("an unmeasured source or target is returned unchanged", () => {
		const unmeasured = { width: 0, height: 0, strokes: [LINE] };
		expect(scaleValue(unmeasured, 200, 100)).toBe(unmeasured);
		expect(scaleValue(VALUE, 0, 100)).toBe(VALUE);
	});
});

describe("serializeSignature / parseSignature", () => {
	test("round trips", () => {
		expect(parseSignature(serializeSignature(VALUE))).toEqual(VALUE);
	});

	test("keeps timestamps", () => {
		const timed: SignatureValue = { width: 10, height: 10, strokes: [[{ t: 0, x: 1, y: 1 }]] };
		expect(parseSignature(serializeSignature(timed))).toEqual(timed);
	});

	test("rejects malformed input as null", () => {
		for (const bad of [
			"",
			"not json",
			"null",
			"[]",
			'{"width":10,"height":10}',
			'{"width":"10","height":10,"strokes":[]}',
			'{"width":10,"height":10,"strokes":[[{"x":1}]]}',
			'{"width":10,"height":10,"strokes":[{"x":1,"y":1}]}',
			'{"width":-1,"height":10,"strokes":[]}',
			'{"width":10,"height":10,"strokes":[[{"x":1,"y":1,"t":"0"}]]}',
		]) {
			expect(parseSignature(bad)).toBeNull();
		}
	});
});
