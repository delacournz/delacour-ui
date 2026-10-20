// skeleton previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("skeleton/profile-card", async (f) => {
	await f.wait(1200);
	await f.tap("skeleton-loading");
	await f.wait(1400);
	await f.tap("skeleton-loading");
	await f.wait(400);
});

capture("skeleton/shapes");

capture("skeleton/animations", async (f) => {
	// Nothing to touch — a skeleton is its motion, so this only holds the camera on it
	await f.wait(3000);
});

capture("skeleton/lines");

capture("skeleton/group", async (f) => {
	await f.wait(1500);
	await f.tap("skeleton-group-pulse");
	await f.wait(1600);
	await f.tap("skeleton-group-shimmer");
	await f.wait(600);
});

capture("skeleton/feed-post");
