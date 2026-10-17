// swipe previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("swipe/swipe-to-delete", async (f) => {
	// Revealing Archive and Delete behind the first row, without a full swipe so nothing is removed
	await f.swipe({ id: "swipe-invoice" }, { x: -0.3 }, { momentum: false });
	await f.wait(800);
	// Tapping the open row closes it, so the clip loops with all four rows in place
	await f.tap("swipe-invoice");
	await f.wait(600);
});

capture("swipe/both-sides", async (f) => {
	// Sliding the row toward the end edge to reveal Done and Flag
	await f.swipe({ id: "swipe-both-sides" }, { x: 0.3 }, { momentum: false });
	await f.wait(700);
	// Tapping the open row closes it
	await f.tap("swipe-both-sides");
	await f.wait(500);
	// Sliding the other way to reveal Snooze and Delete
	await f.swipe({ id: "swipe-both-sides" }, { x: -0.3 }, { momentum: false });
	await f.wait(700);
	// And shut again, so the clip loops without a jump cut
	await f.tap("swipe-both-sides");
	await f.wait(500);
});

capture("swipe/one-open-at-a-time", async (f) => {
	// Opening the first row
	await f.swipe({ id: "swipe-plants" }, { x: -0.3 }, { momentum: false });
	await f.wait(600);
	// Opening the second closes the first
	await f.swipe({ id: "swipe-bank" }, { x: -0.3 }, { momentum: false });
	await f.wait(600);
	// Opening the third closes the second
	await f.swipe({ id: "swipe-dentist" }, { x: -0.3 }, { momentum: false });
	await f.wait(600);
	// Tapping the open row shuts it, so the clip loops without a jump cut
	await f.tap("swipe-dentist");
	await f.wait(500);
});

capture("swipe/kept-open", async (f) => {
	// Revealing the Save tile
	await f.swipe({ id: "swipe-kept-open" }, { x: -0.25 }, { momentum: false });
	await f.wait(600);
	// Saving keeps the row open, so the tile shows its new state
	await f.tap("swipe-save");
	await f.wait(700);
	// Unsaving, back to where it began
	await f.tap("swipe-save");
	await f.wait(600);
	// Tapping the row closes it, so the clip loops without a jump cut
	await f.tap("swipe-kept-open");
	await f.wait(500);
});

capture("swipe/imperative", async (f) => {
	// Opening each side from the ref
	await f.tap("swipe-open-start");
	await f.wait(700);
	await f.tap("swipe-open-end");
	await f.wait(700);
	// And closing it, so the clip loops without a jump cut
	await f.tap("swipe-close");
	await f.wait(600);
});
