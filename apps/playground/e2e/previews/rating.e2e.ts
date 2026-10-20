// rating previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("rating/anatomy", async (f) => {
	// Dragging from the middle star to the last
	await f.swipe({ id: "rating-stars" }, { x: 0.25 }, { durationMs: 700, momentum: false });
	await f.wait(400);
	// And back down past the first
	await f.swipe({ id: "rating-stars" }, { x: -0.3 }, { durationMs: 700, momentum: false });
	await f.wait(400);
	// A tap on the middle star, so the clip loops at 3 where it began
	await f.tap("rating-stars");
});

capture("rating/half-stars", async (f) => {
	// Dragging slowly up the row, a half star at a time
	await f.swipe({ id: "rating-half" }, { x: 0.25 }, { durationMs: 1200, momentum: false });
	await f.wait(400);
	// A tap on the middle star's centre lands on its half, where the clip began
	await f.tap("rating-half");
});

capture("rating/colours");

capture("rating/sizes");

capture("rating/read-only");

capture("rating/a-review", async (f) => {
	// Rating Value, which enables Submit and moves the overall average
	await f.tap("rating-value");
	await f.wait(900);
	// A second tap on the same star clears it, so the clip loops unrated
	await f.tap("rating-value");
});
