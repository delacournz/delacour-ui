// section-rail previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("section-rail/docs-page", async (f) => {
	// Tapping the rail open and picking Usage
	await f.tap("section-rail-docs-trigger");
	await f.visible({ id: "section-rail-docs-usage" });
	await f.wait(600);
	await f.tap("section-rail-docs-usage");
	await f.wait(1300);
	// Scrubbing the rail back up to Introduction, so the clip loops without a jump cut
	await f.swipe({ id: "section-rail-docs-trigger" }, { y: -0.15 }, { durationMs: 900, momentum: false });
	await f.wait(1200);
});

capture("section-rail/center");

capture("section-rail/start-edge");

capture("section-rail/nested-levels", async (f) => {
	// Opening the outline and jumping to the level-2 row whose title wraps
	await f.tap("section-rail-nested-trigger");
	await f.visible({ id: "section-rail-nested-layout-flex-wrap" });
	await f.wait(900);
	await f.tap("section-rail-nested-layout-flex-wrap");
	await f.wait(1200);
	// And back to The basics, so the clip loops without a jump cut
	await f.tap("section-rail-nested-trigger");
	await f.visible({ id: "section-rail-nested-basics" });
	await f.wait(600);
	await f.tap("section-rail-nested-basics");
	await f.wait(900);
});

capture("section-rail/pager", async (f) => {
	// Picking Interests from the rail pages the pager there
	await f.tap("section-rail-pager-trigger");
	await f.visible({ id: "section-rail-pager-interests" });
	await f.wait(600);
	await f.tap("section-rail-pager-interests");
	await f.wait(1200);
	// And back to Welcome, so the clip loops without a jump cut
	await f.tap("section-rail-pager-trigger");
	await f.visible({ id: "section-rail-pager-welcome" });
	await f.wait(500);
	await f.tap("section-rail-pager-welcome");
	await f.wait(900);
});

capture("section-rail/controlled-open", async (f) => {
	// The button opens the panel; a pick closes it
	await f.tap("section-rail-controlled-open");
	await f.visible({ id: "section-rail-controlled-budget" });
	await f.wait(600);
	await f.tap("section-rail-controlled-budget");
	await f.wait(1100);
	// And back to Summary, so the clip loops without a jump cut
	await f.tap("section-rail-controlled-open");
	await f.visible({ id: "section-rail-controlled-summary" });
	await f.wait(500);
	await f.tap("section-rail-controlled-summary");
	await f.wait(900);
});
