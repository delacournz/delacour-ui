// compare previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("compare/anatomy", async (f) => {
	// Dragging the seam toward Draft, revealing the finished scene
	await f.swipe({ id: "compare-anatomy-handle" }, { x: -0.3 }, { durationMs: 700, momentum: false });
	await f.wait(400);
	// Across to Final, covering it with the draft
	await f.swipe({ id: "compare-anatomy-handle" }, { x: 0.6 }, { durationMs: 1000, momentum: false });
	await f.wait(400);
	// And back to the centre, so the clip loops without a jump cut
	await f.swipe({ id: "compare-anatomy-handle" }, { x: -0.3 }, { durationMs: 700, momentum: false });
});

capture("compare/themes", async (f) => {
	// Sweeping the seam across the card, light to dark and back
	await f.swipe({ id: "compare-themes-handle" }, { x: 0.3 }, { durationMs: 700, momentum: false });
	await f.wait(400);
	await f.swipe({ id: "compare-themes-handle" }, { x: -0.6 }, { durationMs: 1000, momentum: false });
	await f.wait(400);
	// And back to the centre, so the clip loops without a jump cut
	await f.swipe({ id: "compare-themes-handle" }, { x: 0.3 }, { durationMs: 700, momentum: false });
});

capture("compare/vertical", async (f) => {
	// Raising the seam toward Morning, then dropping it toward Night
	await f.swipe({ id: "compare-vertical-handle" }, { y: -0.1 }, { durationMs: 600, momentum: false });
	await f.wait(400);
	await f.swipe({ id: "compare-vertical-handle" }, { y: 0.2 }, { durationMs: 900, momentum: false });
	await f.wait(400);
	// And back to halfway, so the clip loops without a jump cut
	await f.swipe({ id: "compare-vertical-handle" }, { y: -0.1 }, { durationMs: 600, momentum: false });
});

capture("compare/snap-points", async (f) => {
	// Releasing just short of the trailing edge, so the seam snaps the rest of the way to 100%
	await f.swipe({ id: "compare-snap-handle" }, { x: 0.4 }, { durationMs: 800, momentum: false });
	await f.wait(700);
	// And releasing near the centre, so it snaps back onto 50% and the clip loops
	await f.swipe({ id: "compare-snap-handle" }, { x: -0.44 }, { durationMs: 800, momentum: false });
	await f.wait(300);
});

capture("compare/colours-and-sizes");

capture("compare/controlled", async (f) => {
	// The parent writes the position, and the seam springs to it
	await f.tap("compare-controlled-before");
	await f.wait(700);
	await f.tap("compare-controlled-after");
	await f.wait(700);
	// And back to half, so the clip loops without a jump cut
	await f.tap("compare-controlled-half");
	await f.wait(300);
});
