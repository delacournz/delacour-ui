// splitter previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("splitter/anatomy", async (f) => {
	// Dragging the seam toward the trailing edge, so the sidebar grows
	await f.swipe({ id: "handle-0" }, { x: 0.2 }, { durationMs: 600, momentum: false });
	await f.wait(400);
	await f.swipe({ id: "handle-0" }, { x: -0.2 }, { durationMs: 600, momentum: false });
	await f.wait(400);
	// And the other way, so the detail pane grows
	await f.swipe({ id: "handle-0" }, { x: -0.2 }, { durationMs: 600, momentum: false });
	await f.wait(400);
	await f.swipe({ id: "handle-0" }, { x: 0.2 }, { durationMs: 600, momentum: false });
});

capture("splitter/panes", async (f) => {
	// Widening the inbox, then giving the room back
	await f.swipe({ id: "handle-0" }, { x: 0.15 }, { durationMs: 600, momentum: false });
	await f.wait(500);
	await f.swipe({ id: "handle-0" }, { x: -0.15 }, { durationMs: 600, momentum: false });
});

capture("splitter/three-columns", async (f) => {
	// The second seam moves only the editor and the inspector
	await f.swipe({ id: "handle-1" }, { x: -0.15 }, { durationMs: 600, momentum: false });
	await f.wait(400);
	await f.swipe({ id: "handle-1" }, { x: 0.15 }, { durationMs: 600, momentum: false });
	await f.wait(400);
	// The first seam moves only the files and the editor
	await f.swipe({ id: "handle-0" }, { x: 0.12 }, { durationMs: 600, momentum: false });
	await f.wait(400);
	await f.swipe({ id: "handle-0" }, { x: -0.12 }, { durationMs: 600, momentum: false });
});

capture("splitter/vertical", async (f) => {
	// Dragging the seam up gives the preview more room, then back
	await f.swipe({ id: "handle-0" }, { y: -0.08 }, { durationMs: 600, momentum: false });
	await f.wait(500);
	await f.swipe({ id: "handle-0" }, { y: 0.08 }, { durationMs: 600, momentum: false });
});

capture("splitter/collapsible", async (f) => {
	// Collapsing the sidebar from the button, then restoring it
	await f.tap("toggle-sidebar");
	await f.wait(900);
	await f.tap("toggle-sidebar");
	await f.wait(600);
});
