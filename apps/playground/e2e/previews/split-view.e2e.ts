// split-view previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("split-view/anatomy", async (f) => {
	// Dragging the row down to the last stop, so the map takes the box
	await f.swipe({ id: "drag-area" }, { y: 0.2 }, { durationMs: 600, momentum: false });
	await f.wait(600);
	// Up to the smallest stop, so the results take the room
	await f.swipe({ id: "drag-area" }, { y: -0.35 }, { durationMs: 700, momentum: false });
	await f.wait(600);
	// And back to the middle
	await f.swipe({ id: "drag-area" }, { y: 0.15 }, { durationMs: 600, momentum: false });
	await f.wait(600);
});

capture("split-view/seam", async (f) => {
	// The chart shrinks to its smallest stop, then comes back
	await f.swipe({ id: "drag-area" }, { y: -0.12 }, { durationMs: 600, momentum: false });
	await f.wait(500);
	await f.swipe({ id: "drag-area" }, { y: 0.12 }, { durationMs: 600, momentum: false });
	await f.wait(500);
	// Then grows to fill the card, and comes back
	await f.swipe({ id: "drag-area" }, { y: 0.13 }, { durationMs: 600, momentum: false });
	await f.wait(500);
	await f.swipe({ id: "drag-area" }, { y: -0.13 }, { durationMs: 600, momentum: false });
	await f.wait(500);
});

capture("split-view/snap-points", async (f) => {
	// A tap on the row cycles the stops — half, all, then wraps back to 120pt
	await f.tap("drag-area");
	await f.wait(800);
	await f.tap("drag-area");
	await f.wait(800);
	await f.tap("drag-area");
	await f.wait(800);
});

capture("split-view/controlled", async (f) => {
	// The buttons call snapTo, and the readout follows
	await f.tap("snap-2");
	await f.wait(800);
	await f.tap("snap-0");
	await f.wait(800);
	await f.tap("snap-1");
	await f.wait(800);
});

capture("split-view/scrolling-panes", async (f) => {
	// Scrolling the comments leaves the divider where it is
	await f.swipe({ id: "comments" }, { y: -0.15 }, { durationMs: 600, momentum: false });
	await f.wait(400);
	await f.swipe({ id: "comments" }, { y: 0.2 }, { durationMs: 600, momentum: false });
	await f.wait(500);
	// The row still moves the divider, and back
	await f.swipe({ id: "drag-area" }, { y: -0.15 }, { durationMs: 600, momentum: false });
	await f.wait(500);
	await f.swipe({ id: "drag-area" }, { y: 0.15 }, { durationMs: 600, momentum: false });
	await f.wait(500);
});
