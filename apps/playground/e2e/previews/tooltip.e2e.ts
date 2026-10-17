// tooltip previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("tooltip/icon-buttons", async (f) => {
	// Long-pressing Share; its label rises above it
	await f.longPress("tooltip-share", 700);
	await f.visible({ text: "Share" });
	await f.wait(900);
	// Long-pressing Save; Share's label gives way to it
	await f.longPress("tooltip-save", 700);
	await f.visible({ text: "Save" });
	await f.wait(2000);
});

capture("tooltip/press", async (f) => {
	// Tapping the info glyph
	await f.tap("tooltip-info");
	await f.visible({ text: "Includes photos, files and backups" });
	await f.wait(2000);
});

capture("tooltip/placements", async (f) => {
	// Opening each placement in turn; each one closes the last
	await f.tap("tooltip-top");
	await f.visible({ text: "On the top" });
	await f.wait(700);
	await f.tap("tooltip-right");
	await f.wait(700);
	await f.tap("tooltip-bottom");
	await f.wait(700);
	await f.tap("tooltip-left");
	// Holding until the last label hides itself, so the clip loops on four bare buttons
	await f.wait(2000);
});

capture("tooltip/surface", async (f) => {
	// Opening the surface tooltip
	await f.tap("tooltip-surface");
	await f.visible({ text: "Changes reach your other devices within a minute." });
	// Holding until it hides itself, so the clip loops on the bare button
	await f.wait(2000);
});

capture("tooltip/persistent", async (f) => {
	// Tapping Shortcut; with duration 0 the label stays
	await f.tap("tooltip-persistent");
	await f.visible({ text: "Press ⌘K anywhere" });
	await f.wait(1800);
	// Tapping it again closes it, so the clip loops on the bare button
	await f.tap("tooltip-persistent");
	await f.wait(700);
});

capture("tooltip/controlled", async (f) => {
	// Show the hint opens the Export tooltip from outside
	await f.tap("tooltip-controlled-show");
	await f.visible({ text: "Exports as CSV" });
	// Holding while it hides itself and the caption returns to Closed
	await f.wait(2000);
});
