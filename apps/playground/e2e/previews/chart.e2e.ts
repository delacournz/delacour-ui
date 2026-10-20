// chart previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("chart/area/area");

capture("chart/area/area-stacked");

capture("chart/bar/bar");

capture("chart/bar/bar-grouped");

capture("chart/bar/bar-horizontal");

capture("chart/bar/bar-labels");

capture("chart/bar/bar-negative");

capture("chart/bar/bar-stacked");

capture("chart/bar/bar-tooltip", async (f) => {
	// Holding to arm the scrub, which does not activate on a plain drag
	// And back, so the clip loops without the band jumping across
	await f.gesture(
		[
			{ type: "down", x: 0.22, y: 0.5 },
			{ type: "move", x: 0.23, y: 0.5, delayMs: 500 },
			{ type: "move", x: 0.45, y: 0.5, delayMs: 220 },
			{ type: "move", x: 0.68, y: 0.5, delayMs: 220 },
			{ type: "move", x: 0.88, y: 0.5, delayMs: 220 },
			{ type: "move", x: 0.55, y: 0.5, delayMs: 220 },
			{ type: "move", x: 0.23, y: 0.5, delayMs: 220 },
			{ type: "up", x: 0.22, y: 0.5, delayMs: 160 },
		],
		{ interpolate: 6 }
	);
});

capture("chart/candlestick/candlestick");

capture("chart/line/curves");

capture("chart/line/line");

capture("chart/line/multi-series");

capture("chart/line/time-series");

capture("chart/parts/colours");

capture("chart/parts/dashboard");

capture("chart/parts/empty");

capture("chart/parts/flat");

capture("chart/parts/grid-and-axes");

capture("chart/parts/legend");

capture("chart/parts/sizes");

capture("chart/parts/tooltip", async (f) => {
	// Holding to arm the scrub, which does not activate on a plain drag
	// And back, so the clip loops without the readout jumping across
	await f.gesture(
		[
			{ type: "down", x: 0.22, y: 0.5 },
			{ type: "move", x: 0.23, y: 0.5, delayMs: 500 },
			{ type: "move", x: 0.45, y: 0.5, delayMs: 220 },
			{ type: "move", x: 0.68, y: 0.5, delayMs: 220 },
			{ type: "move", x: 0.88, y: 0.5, delayMs: 220 },
			{ type: "move", x: 0.55, y: 0.5, delayMs: 220 },
			{ type: "move", x: 0.23, y: 0.5, delayMs: 220 },
			{ type: "up", x: 0.22, y: 0.5, delayMs: 160 },
		],
		{ interpolate: 6 }
	);
});

capture("chart/pie/donut");

capture("chart/pie/pie");

capture("chart/pie/pie-labels");

capture("chart/pie/pie-tap", async (f) => {
	// Tapping the first slice, which starts at twelve o'clock and sweeps clockwise
	await f.tapAt(0.66, 0.47);
	await f.wait(900);
	// And outside, so the clip loops back to nothing selected
	await f.tapAt(0.12, 0.5);
	await f.wait(400);
});

capture("chart/scatter/scatter");
