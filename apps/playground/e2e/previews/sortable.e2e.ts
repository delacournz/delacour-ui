// sortable previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("sortable/handle", async (f) => {
	// Dragging Dawn Chorus down two slots by its grip
	await f.swipe({ id: "sortable-handle-dawn" }, { y: 0.183 }, { durationMs: 900, momentum: false });
	await f.wait(700);
	// And back up by the same distance, so the clip loops without a jump cut
	await f.swipe({ id: "sortable-handle-dawn" }, { y: -0.183 }, { durationMs: 900, momentum: false });
});

capture("sortable/long-press", async (f) => {
	// Holding Scan a document until it lifts, then carrying it down two slots
	await f.gesture(
		[
			{ type: "down", x: 0.5, y: 0.366 },
			{ type: "move", x: 0.5, y: 0.367, delayMs: 450 },
			{ type: "move", x: 0.5, y: 0.545, delayMs: 800 },
			{ type: "up", x: 0.5, y: 0.545, delayMs: 150 },
		],
		{ interpolate: 20 }
	);
	await f.wait(700);
	// And the same hold back up, so the clip loops without a jump cut
	await f.gesture(
		[
			{ type: "down", x: 0.5, y: 0.545 },
			{ type: "move", x: 0.5, y: 0.544, delayMs: 450 },
			{ type: "move", x: 0.5, y: 0.366, delayMs: 800 },
			{ type: "up", x: 0.5, y: 0.366, delayMs: 150 },
		],
		{ interpolate: 20 }
	);
});

capture("sortable/variable-heights", async (f) => {
	// Dragging the short row past the tall one
	await f.swipe({ id: "sortable-variable-mix" }, { y: 0.14 }, { durationMs: 900, momentum: false });
	await f.wait(700);
	// And back above it, so the clip loops without a jump cut
	await f.swipe({ id: "sortable-variable-mix" }, { y: -0.14 }, { durationMs: 900, momentum: false });
});

capture("sortable/pinned", async (f) => {
	// Dragging This week toward the top; it stops below the pinned Inbox
	await f.swipe({ id: "sortable-pinned-week" }, { y: -0.27 }, { durationMs: 900, momentum: false });
	await f.wait(700);
	// And back down to fourth, so the clip loops without a jump cut
	await f.swipe({ id: "sortable-pinned-week" }, { y: 0.178 }, { durationMs: 900, momentum: false });
});

capture("sortable/list-group", async (f) => {
	// Dragging Home to the bottom of the card
	await f.swipe({ id: "sortable-list-group-home" }, { y: 0.234 }, { durationMs: 1000, momentum: false });
	await f.wait(700);
	// And back to the top, so the clip loops without a jump cut
	await f.swipe({ id: "sortable-list-group-home" }, { y: -0.234 }, { durationMs: 1000, momentum: false });
});
