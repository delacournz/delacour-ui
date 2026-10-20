// color-picker previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("color-picker/basic", async (f) => {
	// Dragging the area's thumb down and left, into the muted shades
	await f.swipe({ x: 0.93, y: 0.315 }, { x: -0.33, y: 0.108 }, { durationMs: 800, momentum: false });
	await f.wait(400);
	// Sliding the hue round to blue and back
	await f.swipe({ id: "color-picker-basic-hue-thumb" }, { x: 0.4 }, { durationMs: 800, momentum: false });
	await f.wait(400);
	await f.swipe({ x: 0.568, y: 0.571 }, { x: -0.4 }, { durationMs: 800, momentum: false });
	await f.wait(300);
	// And the area thumb back to its corner, so the clip loops without a jump cut
	await f.swipe({ x: 0.6, y: 0.423 }, { x: 0.38, y: -0.16 }, { durationMs: 800, momentum: false });
	await f.wait(400);
});

capture("color-picker/with-alpha", async (f) => {
	// Fading the colour out towards the checkerboard
	await f.swipe({ id: "color-picker-alpha-thumb" }, { x: -0.4 }, { durationMs: 900, momentum: false });
	await f.wait(500);
	// And back by the same distance, so the clip loops where it began
	await f.swipe({ id: "color-picker-alpha-thumb" }, { x: 0.4 }, { durationMs: 900, momentum: false });
	await f.wait(400);
});

capture("color-picker/swatches", async (f) => {
	// Tapping through the presets
	await f.tap("color-picker-swatch-3b82f6");
	await f.wait(450);
	await f.tap("color-picker-swatch-ec4899");
	await f.wait(450);
	await f.tap("color-picker-swatch-f59e0b");
	await f.wait(450);
	// And back to green, so the clip loops without a jump cut
	await f.tap("color-picker-swatch-22c55e");
	await f.wait(600);
});

capture("color-picker/sheet-trigger", async (f) => {
	// Opening the sheet from the trigger row
	await f.tap("color-picker-trigger");
	await f.visible({ id: "color-picker-sheet-swatch-3b82f6" });
	await f.wait(600);
	// Picking blue, then the original amber again
	await f.tap("color-picker-sheet-swatch-3b82f6");
	await f.wait(600);
	await f.tap("color-picker-sheet-swatch-f59e0b");
	await f.wait(500);
	// Dragging the sheet down by its handle to dismiss it, so the clip ends where it began
	await f.swipe({ text: "Bottom sheet" }, { y: 0.35 }, { durationMs: 250 });
	await f.hidden({ id: "color-picker-sheet-swatch-ef4444" });
	await f.wait(500);
});

capture("color-picker/sizes");
