// dialog previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("dialog/confirm", async (f) => {
	// Opening the confirmation
	await f.tap("dialog-confirm-open");
	await f.visible({ text: "Delete project?" });
	await f.wait(1200);
	// Cancelling from the footer
	await f.tap("dialog-confirm-cancel");
	await f.hidden({ text: "Delete project?" });
	await f.wait(500);
	// Opening it again and closing it from the corner
	await f.tap("dialog-confirm-open");
	await f.visible({ id: "dialog-confirm-close" });
	await f.wait(900);
	await f.tap("dialog-confirm-close");
	await f.hidden({ text: "Delete project?" });
});

capture("dialog/alert-dialog", async (f) => {
	// Opening the alert dialog
	await f.tap("dialog-alert-open");
	await f.visible({ text: "Updated terms" });
	await f.wait(1200);
	// Accepting — the only way out
	await f.tap("dialog-alert-accept");
	await f.hidden({ text: "Updated terms" });
});

capture("dialog/form", { types: true }, async (f) => {
	// Opening the form
	await f.tap("dialog-form-open");
	await f.visible({ id: "dialog-form-input" });
	await f.wait(700);
	// Focusing the field; the card lifts just clear of the keyboard
	await f.tap("dialog-form-input");
	await f.wait(900);
	await f.type("dialog-form-input", " North");
	await f.wait(800);
	// Saving closes it and the keyboard with it
	await f.tap("dialog-form-save");
	await f.hidden({ id: "dialog-form-input" });
});

capture("dialog/sizes", async (f) => {
	// The small card, with its stacked footer
	await f.tap("dialog-size-sm");
	await f.visible({ id: "dialog-size-sm-done" });
	await f.wait(1000);
	await f.tap("dialog-size-sm-done");
	await f.hidden({ id: "dialog-size-sm-done" });
	await f.wait(400);
	// The full-width card
	await f.tap("dialog-size-full");
	await f.visible({ id: "dialog-size-full-done" });
	await f.wait(1000);
	await f.tap("dialog-size-full-done");
	await f.hidden({ id: "dialog-size-full-done" });
});

capture("dialog/over-sheet", async (f) => {
	// Opening the sheet
	await f.tap("dialog-sheet-open");
	await f.visible({ id: "dialog-sheet-revoke" });
	await f.wait(700);
	// The dialog it opens draws above it
	await f.tap("dialog-sheet-revoke");
	await f.visible({ id: "dialog-sheet-confirm" });
	await f.wait(1100);
	await f.tap("dialog-sheet-confirm");
	await f.hidden({ id: "dialog-sheet-confirm" });
	await f.wait(500);
	// Dragging the sheet down, so the clip loops
	await f.swipe({ text: "Share project" }, { y: 0.15 }, { durationMs: 200 });
	await f.hidden({ id: "dialog-sheet-revoke" });
});
