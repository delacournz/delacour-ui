// toast previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("toast/statuses", async (f) => {
	// A plain toast
	await f.tap("toast-status-default");
	await f.visible({ text: "Link copied" });
	await f.wait(700);
	// A success, then a failure, stacking in front
	await f.tap("toast-status-success");
	await f.visible({ text: "Changes saved" });
	await f.wait(700);
	await f.tap("toast-status-destructive");
	await f.visible({ text: "Upload failed" });
	await f.wait(1200);
	// Swiping the front one away, then letting the rest time out, so the clip loops with no toast on screen
	await f.swipe({ text: "Upload failed" }, { x: 0.4 }, { durationMs: 200 });
	await f.hidden({ text: "Upload failed" });
	await f.hidden({ text: "Changes saved" }, { timeout: 8000 });
});

capture("toast/with-action", async (f) => {
	// Archiving
	await f.tap("toast-with-action");
	await f.visible({ text: "Conversation archived" });
	await f.wait(1200);
	// Undoing from the toast
	await f.tapText("Undo");
	await f.visible({ text: "Conversation restored" });
	await f.hidden({ text: "Conversation archived" });
	await f.wait(1000);
	// Swiping the confirmation away, so the clip loops with no toast on screen
	await f.swipe({ text: "Conversation restored" }, { x: 0.4 }, { durationMs: 200 });
	await f.hidden({ text: "Conversation restored" });
});

capture("toast/placement", async (f) => {
	// From the top, swiped back up
	await f.tap("toast-placement-top");
	await f.visible({ text: "From the top" });
	await f.wait(900);
	await f.swipe({ text: "From the top" }, { y: -0.08 }, { durationMs: 150 });
	await f.hidden({ text: "From the top" });
	// From the bottom, swiped back down
	await f.tap("toast-placement-bottom");
	await f.visible({ text: "From the bottom" });
	await f.wait(900);
	await f.swipe({ text: "From the bottom" }, { y: 0.06 }, { durationMs: 150 });
	await f.hidden({ text: "From the bottom" });
});

capture("toast/promise", async (f) => {
	// Loading, then success in place
	await f.tap("toast-promise-success");
	await f.visible({ text: "Uploading 3 photos…" });
	await f.visible({ text: "3 photos uploaded" });
	await f.wait(900);
	await f.swipe({ text: "3 photos uploaded" }, { x: 0.4 }, { durationMs: 200 });
	await f.hidden({ text: "3 photos uploaded" });
	// Loading, then failure in place
	await f.tap("toast-promise-error");
	await f.visible({ text: "Uploading 3 photos…" });
	await f.visible({ text: "The server is offline" });
	await f.wait(1200);
	await f.swipe({ text: "The server is offline" }, { x: 0.4 }, { durationMs: 200 });
	await f.hidden({ text: "The server is offline" });
});

capture("toast/stacking", async (f) => {
	// Five at once — three drawn, the newest in front, two queued behind them
	await f.tap("toast-stacking");
	await f.visible({ text: "photo.jpg downloaded" });
	await f.wait(1200);
	// Swiping the front one away, so a queued one comes forward
	await f.swipe({ text: "photo.jpg downloaded" }, { x: 0.4 }, { durationMs: 200 });
	await f.hidden({ text: "photo.jpg downloaded" });
	await f.wait(900);
	// Letting every other one time out, so the clip loops with no toast on screen
	await f.hidden({ text: "notes.md downloaded" }, { timeout: 15000 });
	await f.hidden({ text: "logo.svg downloaded" }, { timeout: 15000 });
	await f.hidden({ text: "budget.xlsx downloaded" }, { timeout: 15000 });
	await f.hidden({ text: "brief.pdf downloaded" }, { timeout: 15000 });
});

capture("toast/persistent", async (f) => {
	// A toast with no timeout
	await f.tap("toast-persistent");
	await f.visible({ text: "You are offline" });
	await f.wait(1800);
	// Still there; hidden from code
	await f.tap("toast-hide-all");
	await f.hidden({ text: "You are offline" });
});
