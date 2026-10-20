// marquee previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("marquee/badges", async (f) => {
	// Nothing to touch — a marquee is its motion, so this only holds the camera on it
	await f.wait(4000);
});

capture("marquee/two-rows", async (f) => {
	// Both rows drifting in step
	await f.wait(1200);
	// A finger on the top row holds both, then lets them ease back up to speed
	await f.longPress("marquee-two-rows-top", 1400);
	await f.wait(1200);
});

capture("marquee/vertical", async (f) => {
	// Nothing to touch — a marquee is its motion, so this only holds the camera on it
	await f.wait(4000);
});

capture("marquee/hold-to-pause", async (f) => {
	// Let the strip run, so the clip opens on the motion
	await f.wait(1200);
	// Hold a finger mid-strip — it eases to a stop and stays put while held
	await f.longPress("marquee-hold-to-pause", 1800);
	// Released, it eases back up to speed from exactly where it stopped
	await f.wait(1500);
});

capture("marquee/speed", async (f) => {
	// Nothing to touch — a marquee is its motion, so this only holds the camera on it
	await f.wait(4000);
});
