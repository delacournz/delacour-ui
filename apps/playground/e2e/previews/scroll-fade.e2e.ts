// scroll-fade previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("scroll-fade/vertical-list", async (f) => {
	await f.wait(500);
	// Scrolling down a little — the top edge fades in
	await f.swipe({ id: "scroll-fade-vertical" }, { y: -0.08 }, { durationMs: 600, momentum: false });
	await f.wait(600);
	// On to the end — the bottom edge clears
	await f.swipe({ id: "scroll-fade-vertical" }, { y: -0.25 }, { durationMs: 900, momentum: false });
	await f.wait(800);
	// And back to the top, so the clip loops without a jump cut
	await f.swipe({ id: "scroll-fade-vertical" }, { y: 0.35 }, { durationMs: 1100, momentum: false });
	await f.wait(500);
});

capture("scroll-fade/horizontal-cards", async (f) => {
	await f.wait(400);
	// Dragging the row to its end — the left edge fades in, the right one clears
	await f.swipe({ id: "scroll-fade-horizontal" }, { x: -0.45 }, { durationMs: 600, momentum: false });
	await f.swipe({ id: "scroll-fade-horizontal" }, { x: -0.45 }, { durationMs: 600, momentum: false });
	await f.swipe({ id: "scroll-fade-horizontal" }, { x: -0.45 }, { durationMs: 600, momentum: false });
	await f.wait(700);
	// And back to the start, so the clip loops without a jump cut
	await f.swipe({ id: "scroll-fade-horizontal" }, { x: 0.45 }, { durationMs: 600, momentum: false });
	await f.swipe({ id: "scroll-fade-horizontal" }, { x: 0.45 }, { durationMs: 600, momentum: false });
	await f.swipe({ id: "scroll-fade-horizontal" }, { x: 0.45 }, { durationMs: 600, momentum: false });
	await f.wait(400);
});

capture("scroll-fade/single-edge", async (f) => {
	await f.wait(400);
	// Reading to the end of the terms — the one fade clears, and no top fade appears
	await f.swipe({ id: "scroll-fade-single-edge" }, { y: -0.2 }, { durationMs: 900, momentum: false });
	await f.wait(800);
	// And back to the top, so the clip loops without a jump cut
	await f.swipe({ id: "scroll-fade-single-edge" }, { y: 0.2 }, { durationMs: 900, momentum: false });
	await f.wait(400);
});

capture("scroll-fade/on-a-surface");
