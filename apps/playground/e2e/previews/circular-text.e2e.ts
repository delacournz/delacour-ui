// circular-text previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("circular-text/seal", async (f) => {
	// Nothing to touch — the seal is its motion, so this only holds the camera on it
	await f.wait(2250);
});

capture("circular-text/two-rings", async (f) => {
	// Nothing to touch — the rings are their motion, so this only holds the camera on them
	await f.wait(4500);
});

capture("circular-text/arc");

capture("circular-text/badge", async (f) => {
	// Nothing to touch — the rings are their motion, so this only holds the camera on them
	await f.wait(6000);
});

capture("circular-text/hold-to-pause", async (f) => {
	// Holding a finger on the ring so it eases to a halt
	await f.longPress("circular-text-hold", 1600);
	// Released — it eases back up to speed from the same angle, as it began
	await f.wait(450);
});

capture("circular-text/controlled", async (f) => {
	// Dragging the thumb turns the ring with it
	await f.swipe({ id: "circular-text-dial" }, { x: 0.5 }, { durationMs: 1000, momentum: false });
	await f.wait(400);
	// And back past the start, so the slider clamps at 0 and the clip loops where it began
	await f.swipe({ id: "circular-text-dial" }, { x: -0.55 }, { durationMs: 1000, momentum: false });
	await f.wait(1200);
});
