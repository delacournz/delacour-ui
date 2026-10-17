// kpi previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("kpi/anatomy", async (f) => {
	await f.visible({ id: "kpi-anatomy-chart" });
	// Holding to arm the scrub, which does not activate on a plain drag
	// And back to the latest point, so the clip loops without the value jumping
	await f.gesture(
		[
			{ type: "down", x: 0.88, y: 0.55 },
			{ type: "move", x: 0.87, y: 0.55, delayMs: 500 },
			{ type: "move", x: 0.66, y: 0.55, delayMs: 260 },
			{ type: "move", x: 0.44, y: 0.55, delayMs: 260 },
			{ type: "move", x: 0.14, y: 0.55, delayMs: 300 },
			{ type: "move", x: 0.5, y: 0.55, delayMs: 260 },
			{ type: "move", x: 0.87, y: 0.55, delayMs: 260 },
			{ type: "up", x: 0.88, y: 0.55, delayMs: 160 },
		],
		{ interpolate: 6 }
	);
});

capture("kpi/good-direction", async (f) => {
	// Dragging the change negative, so revenue turns bad and churn turns good
	await f.swipe({ id: "kpi-direction-thumb" }, { x: -0.5 }, { durationMs: 900, momentum: false });
	await f.wait(500);
	// And back by the same distance, so the clip loops near where it began
	await f.swipe({ id: "kpi-direction-thumb" }, { x: 0.5 }, { durationMs: 900, momentum: false });
});

capture("kpi/inline");

capture("kpi/scrub", async (f) => {
	await f.visible({ id: "kpi-scrub-chart" });
	// Holding to arm the scrub, which does not activate on a plain drag
	// And back to the latest point, so the clip loops without the value jumping
	await f.gesture(
		[
			{ type: "down", x: 0.88, y: 0.56 },
			{ type: "move", x: 0.87, y: 0.56, delayMs: 500 },
			{ type: "move", x: 0.66, y: 0.56, delayMs: 260 },
			{ type: "move", x: 0.44, y: 0.56, delayMs: 260 },
			{ type: "move", x: 0.14, y: 0.56, delayMs: 300 },
			{ type: "move", x: 0.5, y: 0.56, delayMs: 260 },
			{ type: "move", x: 0.87, y: 0.56, delayMs: 260 },
			{ type: "up", x: 0.88, y: 0.56, delayMs: 160 },
		],
		{ interpolate: 6 }
	);
});

capture("kpi/group");

capture("kpi/dashboard", async (f) => {
	// Choosing Orders, then the 7 day period, which redraws every series
	await f.tap("kpi-dashboard-orders");
	await f.wait(700);
	await f.tap("kpi-dashboard-period-7d");
	await f.wait(800);
	// Back to Revenue over 30 days, so the clip loops where it began
	await f.tap("kpi-dashboard-revenue");
	await f.wait(500);
	await f.tap("kpi-dashboard-period-30d");
});
