// charts previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("charts/animation/morph", async (f) => {
	// Swapping to last week, which morphs every path
	await f.tap("charts-morph-last");
	await f.wait(1100);
	// And back, so the clip loops on the week it opened with
	await f.tap("charts-morph-this");
	await f.wait(900);
});

capture("charts/animation/spring", async (f) => {
	// Swapping to the south, which springs every bar
	await f.tap("charts-spring-south");
	await f.wait(1300);
	// And back, so the clip loops on the region it opened with
	await f.tap("charts-spring-north");
	await f.wait(1100);
});

capture("charts/area/area");

capture("charts/area/gradient");

capture("charts/area/stacked");

capture("charts/axes/axes-grid");

capture("charts/bar/bar");

capture("charts/bar/grouped");

capture("charts/bar/horizontal");

capture("charts/bar/stacked");

capture("charts/candlestick/candlestick", async (f) => {
	// Holding to arm the scrub, which does not activate on a plain drag
	// And back, so the clip loops without the cursor jumping across
	await f.gesture(
		[
			{ type: "down", x: 0.22, y: 0.5 },
			{ type: "move", x: 0.23, y: 0.5, delayMs: 500 },
			{ type: "move", x: 0.45, y: 0.5, delayMs: 260 },
			{ type: "move", x: 0.68, y: 0.5, delayMs: 260 },
			{ type: "move", x: 0.88, y: 0.5, delayMs: 260 },
			{ type: "move", x: 0.55, y: 0.5, delayMs: 260 },
			{ type: "move", x: 0.23, y: 0.5, delayMs: 260 },
			{ type: "up", x: 0.22, y: 0.5, delayMs: 160 },
		],
		{ interpolate: 6 }
	);
});

capture("charts/composition/declarative");

capture("charts/composition/mixed");

capture("charts/composition/render-prop");

capture("charts/cursor/readout", async (f) => {
	// Holding to arm the scrub, which does not activate on a plain drag
	// And back, so the clip loops without the cursor jumping across
	await f.gesture(
		[
			{ type: "down", x: 0.22, y: 0.52 },
			{ type: "move", x: 0.23, y: 0.52, delayMs: 500 },
			{ type: "move", x: 0.45, y: 0.52, delayMs: 260 },
			{ type: "move", x: 0.68, y: 0.52, delayMs: 260 },
			{ type: "move", x: 0.88, y: 0.52, delayMs: 260 },
			{ type: "move", x: 0.55, y: 0.52, delayMs: 260 },
			{ type: "move", x: 0.23, y: 0.52, delayMs: 260 },
			{ type: "up", x: 0.22, y: 0.52, delayMs: 160 },
		],
		{ interpolate: 6 }
	);
});

capture("charts/cursor/scrub", async (f) => {
	// Holding to arm the scrub, which does not activate on a plain drag
	// And back, so the clip loops without the cursor jumping across
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

capture("charts/cursor/stacked", async (f) => {
	// Holding to arm the scrub, which does not activate on a plain drag
	// And back, so the clip loops without the cursor jumping across
	await f.gesture(
		[
			{ type: "down", x: 0.22, y: 0.5 },
			{ type: "move", x: 0.23, y: 0.5, delayMs: 500 },
			{ type: "move", x: 0.45, y: 0.5, delayMs: 260 },
			{ type: "move", x: 0.68, y: 0.5, delayMs: 260 },
			{ type: "move", x: 0.88, y: 0.5, delayMs: 260 },
			{ type: "move", x: 0.55, y: 0.5, delayMs: 260 },
			{ type: "move", x: 0.23, y: 0.5, delayMs: 260 },
			{ type: "up", x: 0.22, y: 0.5, delayMs: 160 },
		],
		{ interpolate: 6 }
	);
});

capture("charts/line/curves");

capture("charts/line/line");

capture("charts/line/time-series", async (f) => {
	// Holding to arm the scrub, which does not activate on a plain drag
	// And back, so the clip loops without the cursor jumping across
	await f.gesture(
		[
			{ type: "down", x: 0.22, y: 0.5 },
			{ type: "move", x: 0.23, y: 0.5, delayMs: 500 },
			{ type: "move", x: 0.45, y: 0.5, delayMs: 260 },
			{ type: "move", x: 0.68, y: 0.5, delayMs: 260 },
			{ type: "move", x: 0.88, y: 0.5, delayMs: 260 },
			{ type: "move", x: 0.55, y: 0.5, delayMs: 260 },
			{ type: "move", x: 0.23, y: 0.5, delayMs: 260 },
			{ type: "up", x: 0.22, y: 0.5, delayMs: 160 },
		],
		{ interpolate: 6 }
	);
});

capture("charts/pie/donut", async (f) => {
	// Tapping Free, the 57% slice that crosses three o'clock
	await f.tapAt(0.74, 0.5);
	await f.wait(800);
	// Then Team, whose bisector sits at about 254°
	await f.tapAt(0.27, 0.53);
	await f.wait(800);
	// And the hole, which is no slice, so the clip loops back to nothing selected
	await f.tapAt(0.5, 0.5);
	await f.wait(400);
});

capture("charts/pie/pie");

capture("charts/scatter/scatter");
