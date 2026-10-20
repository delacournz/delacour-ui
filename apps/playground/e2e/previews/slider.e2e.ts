// slider previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("slider/anatomy", async (f) => {
	// Dragging the thumb up the track
	await f.swipe({ id: "slider-thumb" }, { x: 0.4 }, { durationMs: 700, momentum: false });
	await f.wait(500);
	// And back down by the same distance, so the clip loops near where it began
	await f.swipe({ id: "slider-thumb" }, { x: -0.4 }, { durationMs: 700, momentum: false });
});

capture("slider/colours");

capture("slider/sizes");

capture("slider/vertical", async (f) => {
	// Raising each slider in turn
	await f.swipe({ id: "thumb-default" }, { y: -0.07 }, { durationMs: 500, momentum: false });
	await f.swipe({ id: "thumb-success" }, { y: -0.1 }, { durationMs: 500, momentum: false });
	await f.swipe({ id: "thumb-warning" }, { y: -0.04 }, { durationMs: 500, momentum: false });
	await f.wait(500);
	// And lowering them by the same distance, so the clip loops near where it began
	await f.swipe({ id: "thumb-default" }, { y: 0.07 }, { durationMs: 500, momentum: false });
	await f.swipe({ id: "thumb-success" }, { y: 0.1 }, { durationMs: 500, momentum: false });
	await f.swipe({ id: "thumb-warning" }, { y: 0.04 }, { durationMs: 500, momentum: false });
});

capture("slider/a-range", async (f) => {
	// Pulling the two thumbs toward each other
	await f.swipe({ id: "thumb-0" }, { x: 0.18 }, { durationMs: 600, momentum: false });
	await f.wait(300);
	await f.swipe({ id: "thumb-1" }, { x: -0.18 }, { durationMs: 600, momentum: false });
	await f.wait(600);
	// And back out by the same distance, so the clip loops near where it began
	await f.swipe({ id: "thumb-0" }, { x: -0.18 }, { durationMs: 600, momentum: false });
	await f.wait(300);
	await f.swipe({ id: "thumb-1" }, { x: 0.18 }, { durationMs: 600, momentum: false });
});
