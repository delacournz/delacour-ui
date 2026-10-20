// section-progress previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("section-progress/placements", async (f) => {
	// Moving the pill round the stage
	await f.tap("section-progress-placement-top-center");
	await f.wait(600);
	await f.tap("section-progress-placement-top-end");
	await f.wait(500);
	// A top pill opens its panel downward
	await f.tap("section-progress-placement-pill");
	await f.wait(900);
	await f.tap("section-progress-placement-pill");
	await f.wait(500);
	await f.tap("section-progress-placement-bottom-start");
	await f.wait(600);
	// And back to the bottom centre, so the clip loops without a jump cut
	await f.tap("section-progress-placement-bottom-center");
});

capture("section-progress/colored-sections", async (f) => {
	// Reading down the notes, so the ring fills and takes each section's colour
	await f.swipe({ id: "section-progress-colored-scroll" }, { y: -0.3 }, { durationMs: 500, momentum: false });
	await f.wait(300);
	await f.swipe({ id: "section-progress-colored-scroll" }, { y: -0.3 }, { durationMs: 500, momentum: false });
	await f.wait(300);
	await f.swipe({ id: "section-progress-colored-scroll" }, { y: -0.3 }, { durationMs: 500, momentum: false });
	await f.wait(300);
	await f.swipe({ id: "section-progress-colored-scroll" }, { y: -0.3 }, { durationMs: 500, momentum: false });
	await f.wait(600);
	// Opening the panel and jumping back to the first section, so the clip loops without a jump cut
	await f.tap("section-progress-colored-pill");
	await f.wait(900);
	await f.tap("section-progress-colored-summary");
	await f.wait(1200);
});

capture("section-progress/manual-progress", async (f) => {
	// Dragging the slider up, so the ring fills and the step advances
	await f.swipe({ id: "section-progress-manual-thumb" }, { x: 0.4 }, { durationMs: 900, momentum: false });
	await f.wait(600);
	// And back down by the same distance, so the clip loops near where it began
	await f.swipe({ id: "section-progress-manual-thumb" }, { x: -0.4 }, { durationMs: 900, momentum: false });
});

capture("section-progress/controlled-open", async (f) => {
	// The button outside opens the panel
	await f.tap("section-progress-controlled-toggle");
	await f.wait(1100);
	// And the pill closes it through the same callback, so the clip loops without a jump cut
	await f.tap("section-progress-controlled-pill");
	await f.wait(500);
});
