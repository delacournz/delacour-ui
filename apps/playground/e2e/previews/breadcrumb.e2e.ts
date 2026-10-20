// breadcrumb previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("breadcrumb/basic");

capture("breadcrumb/sizes");

capture("breadcrumb/custom-separator");

capture("breadcrumb/collapsed");

capture("breadcrumb/ellipsis-sheet", async (f) => {
	// Opening the hidden levels from the ellipsis
	await f.tapText("Show 5 hidden levels");
	await f.visible({ id: "breadcrumb-ellipsis-sheet-3" });
	await f.wait(700);
	// Jumping to Radiohead, which shortens the trail
	await f.tap("breadcrumb-ellipsis-sheet-3");
	await f.hidden({ id: "breadcrumb-ellipsis-sheet-3" });
	await f.wait(900);
	// And back to the track, so the clip loops without a jump cut
	await f.tap("breadcrumb-ellipsis-reset");
	await f.wait(700);
});

capture("breadcrumb/scroll-overflow", async (f) => {
	// Dragging back to the start of the trail, two strokes since one cannot cross it
	await f.swipe({ id: "breadcrumb-scroll-list" }, { x: 0.45 }, { durationMs: 450, momentum: false });
	await f.swipe({ id: "breadcrumb-scroll-list" }, { x: 0.45 }, { durationMs: 450, momentum: false });
	await f.wait(700);
	// And forward to the current page again — a third stroke so it lands flush on the end, as it began
	await f.swipe({ id: "breadcrumb-scroll-list" }, { x: -0.45 }, { durationMs: 450, momentum: false });
	await f.swipe({ id: "breadcrumb-scroll-list" }, { x: -0.45 }, { durationMs: 450, momentum: false });
	await f.swipe({ id: "breadcrumb-scroll-list" }, { x: -0.45 }, { durationMs: 450, momentum: false });
	await f.wait(600);
});
