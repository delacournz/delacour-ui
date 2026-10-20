// timeline previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("timeline/order-history");

capture("timeline/tones");

capture("timeline/numbered");

capture("timeline/cards");

capture("timeline/horizontal", async (f) => {
	// Swiping the strip along, one fling at a time, so each title lights as it reaches the left edge
	await f.swipe({ id: "timeline-horizontal" }, { x: -0.35 }, { durationMs: 400 });
	await f.wait(700);
	await f.swipe({ id: "timeline-horizontal" }, { x: -0.35 }, { durationMs: 400 });
	await f.wait(900);
	// And back to the first column, so the clip loops without a jump cut
	await f.swipe({ id: "timeline-horizontal" }, { x: 0.4 }, { durationMs: 350 });
	await f.wait(250);
	await f.swipe({ id: "timeline-horizontal" }, { x: 0.4 }, { durationMs: 350 });
	await f.wait(900);
});
