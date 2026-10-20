// slide-button previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("slide-button/slide-to-ship", async (f) => {
	// A drag released short of the threshold springs home
	await f.swipe({ id: "slide-to-ship-thumb" }, { x: 0.3 }, { durationMs: 600, momentum: false });
	await f.wait(700);
	// One carried to the end confirms with a tick
	await f.swipe({ id: "slide-to-ship-thumb" }, { x: 0.65 }, { durationMs: 800, momentum: false });
	// isAutoReset takes it home after 1500ms, so the clip loops where it began
	await f.wait(2400);
});

capture("slide-button/variants", async (f) => {
	// Confirming each variant in turn, top to bottom
	await f.swipe({ id: "variant-secondary-thumb" }, { x: 0.65 }, { durationMs: 600, momentum: false });
	await f.wait(300);
	await f.swipe({ id: "variant-destructive-thumb" }, { x: 0.65 }, { durationMs: 600, momentum: false });
	await f.wait(300);
	await f.swipe({ id: "variant-success-thumb" }, { x: 0.65 }, { durationMs: 600, momentum: false });
	// Each auto-resets after 1000ms, so the clip loops with every handle home
	await f.wait(1900);
});

capture("slide-button/sizes");

capture("slide-button/threshold", async (f) => {
	// Half the rail confirms at threshold 0.5
	await f.swipe({ id: "threshold-half-thumb" }, { x: 0.36 }, { durationMs: 700, momentum: false });
	await f.wait(400);
	// The same half springs home at threshold 1
	await f.swipe({ id: "threshold-full-thumb" }, { x: 0.36 }, { durationMs: 700, momentum: false });
	// The first auto-resets after 1000ms, so the clip loops with both handles home
	await f.wait(1400);
});

capture("slide-button/controlled-async", async (f) => {
	// The release asks for completion; the handle waits while the 1500ms request runs
	await f.swipe({ id: "controlled-transfer-thumb" }, { x: 0.8 }, { durationMs: 800, momentum: false });
	await f.wait(2300);
	// Reset hands isCompleted back to false, so the clip loops with the handle home and the status idle
	await f.tap("controlled-reset");
	await f.wait(900);
});

capture("slide-button/disabled");
