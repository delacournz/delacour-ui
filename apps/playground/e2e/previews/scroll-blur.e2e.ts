// scroll-blur previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("scroll-blur/list-under-button", async (f) => {
	// Scrolling the rows up under the button — each blurs as it reaches the edge
	await f.swipe({ id: "scroll-blur-list" }, { y: -0.3 }, { durationMs: 1200, momentum: false });
	await f.wait(600);
	// And back to the top, so the clip loops without a jump cut
	await f.swipe({ id: "scroll-blur-list" }, { y: 0.3 }, { durationMs: 1200, momentum: false });
	await f.wait(600);
});

capture("scroll-blur/search-over-media", async (f) => {
	// Scrolling the tiles under the field — the start band arrives as they pass beneath it
	await f.swipe({ id: "scroll-blur-media" }, { y: -0.2 }, { durationMs: 1000, momentum: false });
	await f.wait(600);
	// And back to the top, where the band clears again, so the clip loops
	await f.swipe({ id: "scroll-blur-media" }, { y: 0.2 }, { durationMs: 1000, momentum: false });
	await f.wait(600);
});

capture("scroll-blur/horizontal", async (f) => {
	// Dragging the row left — the left band arrives as cards pass it
	await f.swipe({ id: "scroll-blur-row" }, { x: -0.4 }, { durationMs: 1000, momentum: false });
	await f.wait(600);
	// And back to the start, so the clip loops without a jump cut
	await f.swipe({ id: "scroll-blur-row" }, { x: 0.45 }, { durationMs: 1000, momentum: false });
	await f.wait(600);
});

capture("scroll-blur/blur-vs-fade");
