// carousel previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("carousel/hero-track", async (f) => {
	// Swiping forward two slides
	await f.swipe({ id: "carousel-hero-content" }, { x: -0.45 }, { durationMs: 450, momentum: false });
	await f.wait(700);
	await f.swipe({ id: "carousel-hero-content" }, { x: -0.45 }, { durationMs: 450, momentum: false });
	await f.wait(700);
	// And back to the first, so the clip loops without a jump cut
	await f.swipe({ id: "carousel-hero-content" }, { x: 0.45 }, { durationMs: 450, momentum: false });
	await f.wait(700);
	await f.swipe({ id: "carousel-hero-content" }, { x: 0.45 }, { durationMs: 450, momentum: false });
	await f.wait(700);
});

capture("carousel/peek");

capture("carousel/coverflow", async (f) => {
	// Turning to the next cover, then the one after
	await f.swipe({ id: "carousel-coverflow-content" }, { x: -0.3 }, { durationMs: 450, momentum: false });
	await f.wait(700);
	await f.swipe({ id: "carousel-coverflow-content" }, { x: -0.3 }, { durationMs: 450, momentum: false });
	await f.wait(700);
	// And back to the fourth, so the clip loops without a jump cut
	await f.swipe({ id: "carousel-coverflow-content" }, { x: 0.3 }, { durationMs: 450, momentum: false });
	await f.wait(700);
	await f.swipe({ id: "carousel-coverflow-content" }, { x: 0.3 }, { durationMs: 450, momentum: false });
	await f.wait(700);
});

capture("carousel/controls", async (f) => {
	// Stepping forward with Next
	await f.tap("carousel-next");
	await f.wait(600);
	await f.tap("carousel-next");
	await f.wait(600);
	// And back with Previous, so the clip loops on Welcome
	await f.tap("carousel-previous");
	await f.wait(600);
	await f.tap("carousel-previous");
	await f.wait(600);
});

capture("carousel/vertical");
