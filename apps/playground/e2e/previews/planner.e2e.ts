// planner previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("planner/training-plan", async (f) => {
	// Swiping the grid pages to next month, sliding in from the right
	await f.swipe({ id: "planner-training-grid" }, { x: -0.5 }, { durationMs: 300, momentum: false });
	await f.wait(1000);
	// The previous-month button slides back, so the clip loops on the month it began with
	await f.tap("planner-training-nav-previous");
	await f.wait(900);
});

capture("planner/tiles");

capture("planner/calendar-fill");

capture("planner/details-sheet", async (f) => {
	// Tapping the busiest day opens its sheet
	await f.tap("planner-details-2026-10-14");
	await f.visible({ text: "Tempo run · 8 km" });
	await f.wait(1200);
	// Dragging the sheet down closes it and clears the selection
	await f.swipe({ text: "3 sessions planned" }, { y: 0.12 }, { durationMs: 250 });
	await f.hidden({ text: "Tempo run · 8 km" });
	await f.wait(600);
});

capture("planner/scroller", async (f) => {
	// Scrolling six weeks down moves the title on to the next month
	await f.swipe({ id: "planner-scroller" }, { y: -0.3 }, { durationMs: 600, momentum: false });
	await f.swipe({ id: "planner-scroller" }, { y: -0.3 }, { durationMs: 600, momentum: false });
	await f.wait(900);
	// And back up by the same distance, so the clip loops on the week it began with
	await f.swipe({ id: "planner-scroller" }, { y: 0.3 }, { durationMs: 600, momentum: false });
	await f.swipe({ id: "planner-scroller" }, { y: 0.3 }, { durationMs: 600, momentum: false });
	await f.wait(700);
});

capture("planner/custom-day");
