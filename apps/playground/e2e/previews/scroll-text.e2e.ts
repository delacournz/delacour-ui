// scroll-text previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("scroll-text/colour", async (f) => {
	// Scrolling the text up through its window
	await f.swipe({ id: "scroll-text-host" }, { y: -0.15 }, { durationMs: 2200, momentum: false });
	await f.wait(600);
	// And back down by the same distance, so the clip loops near where it began
	await f.swipe({ id: "scroll-text-host" }, { y: 0.15 }, { durationMs: 2200, momentum: false });
});

capture("scroll-text/rise", async (f) => {
	// Scrolling the text up through its window
	await f.swipe({ id: "scroll-text-host" }, { y: -0.25 }, { durationMs: 2200, momentum: false });
	await f.wait(600);
	// And back down by the same distance, so the clip loops near where it began
	await f.swipe({ id: "scroll-text-host" }, { y: 0.25 }, { durationMs: 2200, momentum: false });
});

capture("scroll-text/highlight", async (f) => {
	// Scrolling the text up through its window
	await f.swipe({ id: "scroll-text-host" }, { y: -0.25 }, { durationMs: 2200, momentum: false });
	await f.wait(600);
	// And back down by the same distance, so the clip loops near where it began
	await f.swipe({ id: "scroll-text-host" }, { y: 0.25 }, { durationMs: 2200, momentum: false });
});

capture("scroll-text/characters", async (f) => {
	// Scrolling the text up through its window
	await f.swipe({ id: "scroll-text-host" }, { y: -0.3 }, { durationMs: 2200, momentum: false });
	await f.wait(600);
	// And back down by the same distance, so the clip loops near where it began
	await f.swipe({ id: "scroll-text-host" }, { y: 0.3 }, { durationMs: 2200, momentum: false });
});

capture("scroll-text/lines", async (f) => {
	// Scrolling the text up through its window
	await f.swipe({ id: "scroll-text-host" }, { y: -0.13 }, { durationMs: 2200, momentum: false });
	await f.wait(600);
	// And back down by the same distance, so the clip loops near where it began
	await f.swipe({ id: "scroll-text-host" }, { y: 0.13 }, { durationMs: 2200, momentum: false });
});

capture("scroll-text/scrub", async (f) => {
	// Dragging the thumb resolves the text word by word
	await f.swipe({ id: "scroll-text-scrub" }, { x: 0.5 }, { durationMs: 1400, momentum: false });
	await f.wait(500);
	// And back down by the same distance, dimming it again
	await f.swipe({ id: "scroll-text-scrub" }, { x: -0.5 }, { durationMs: 1400, momentum: false });
});
