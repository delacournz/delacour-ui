// bottom-sheet previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("bottom-sheet/anatomy/inline-persistent", async (f) => {
	// Dragging the drawer up to its second snap point
	await f.swipe({ text: "Nearby" }, { y: -0.3 }, { durationMs: 300, momentum: false });
	await f.containsText("inline-readout", "Snap point 2 of 2");
	await f.wait(800);
	// Dragging it back down to the first
	await f.swipe({ text: "Nearby" }, { y: 0.3 }, { durationMs: 300, momentum: false });
	await f.containsText("inline-readout", "Snap point 1 of 2");
	await f.wait(600);
	// A drag past the first snap point does nothing — the drawer is persistent
	await f.swipe({ text: "Nearby" }, { y: 0.25 }, { durationMs: 300, momentum: false });
	await f.wait(700);
	await f.containsText("inline-readout", "Snap point 1 of 2");
	await f.visible({ text: "Nearby" });
});

capture("bottom-sheet/anatomy/the-whole-composition", async (f) => {
	// Opening the sheet
	await f.tap("open-sheet");
	await f.visible({ text: "Keep yourself safe" });
	await f.wait(700);
	// Dragging it down to dismiss
	await f.swipe({ text: "Keep yourself safe" }, { y: 0.2 }, { durationMs: 250 });
	await f.hidden({ text: "Keep yourself safe" });
	await f.wait(500);
	// Opening it again and closing it from its own button
	await f.tap("open-sheet");
	await f.visible({ id: "sheet-later" });
	await f.wait(800);
	await f.tap("sheet-later");
	await f.hidden({ text: "Keep yourself safe" });
});

capture("bottom-sheet/hosting/inside-a-native-modal", async (f) => {
	// Presenting the native modal
	await f.tap("modal-open");
	await f.visible({ id: "modal-open-sheet" });
	await f.wait(600);
	// Opening a sheet inside it — it draws over the modal, not behind it
	await f.tap("modal-open-sheet");
	await f.visible({ text: "Above the modal" });
	await f.wait(900);
	await f.tap("modal-close-sheet");
	await f.hidden({ text: "Above the modal" });
	await f.wait(400);
	// Dismissing the modal
	await f.tap("modal-dismiss");
	await f.visible({ id: "modal-open" });
});

capture("bottom-sheet/sizing/detached", async (f) => {
	// Opening the floating card
	await f.tap("detached-open");
	await f.visible({ text: "Oh! Your wallet is empty" });
	await f.wait(700);
	// Dragging the whole card down through the gap to dismiss it
	await f.swipe({ text: "Oh! Your wallet is empty" }, { y: 0.24 }, { durationMs: 250 });
	await f.hidden({ text: "Oh! Your wallet is empty" });
	await f.wait(500);
	// Opening it again and closing it from its own button
	await f.tap("detached-open");
	await f.visible({ id: "detached-add-funds" });
	await f.wait(800);
	await f.tap("detached-add-funds");
	await f.hidden({ text: "Oh! Your wallet is empty" });
});

capture("bottom-sheet/steps/per-step-snap-points", async (f) => {
	// Opening on the compact step
	await f.tap("steps-snap-open");
	await f.visible({ id: "steps-snap-to-tall" });
	await f.wait(700);
	// Tall is 75%, half is 50%, compact is dynamic again
	await f.tap("steps-snap-to-tall");
	await f.visible({ id: "steps-snap-to-half" });
	await f.wait(700);
	await f.tap("steps-snap-to-half");
	await f.visible({ id: "steps-snap-to-compact" });
	await f.wait(700);
	await f.tap("steps-snap-to-compact");
	await f.visible({ id: "steps-snap-to-tall" });
	await f.wait(600);
	// Dragging it down to close
	await f.swipe({ text: "Compact" }, { y: 0.15 }, { durationMs: 250 });
	await f.hidden({ id: "steps-snap-to-tall" });
});
